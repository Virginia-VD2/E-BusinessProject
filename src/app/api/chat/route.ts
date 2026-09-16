/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export async function POST(req: Request) {
  let rawMessages: any[] = [];
  try {
    const body = await req.json().catch(() => ({}));
    rawMessages = body.messages || [];

    // Fetch live product catalog to inject into Gemini context
    let productCatalogText = 'Catalog currently unavailable.';
    try {
      const activeProducts = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { category: 'asc' },
      });
      productCatalogText = activeProducts
        .map(
          (p) =>
            `• ${p.name} | Category: ${p.category} | Price: Rp ${p.price.toLocaleString('id-ID')} | Stock: ${p.stock} | Description: ${p.description}`
        )
        .join('\n');
    } catch (e) {
      console.error('Failed to load catalog for AI prompt:', e);
    }

    const formattedMessages = rawMessages.map((m: any) => {
      let contentString = '';
      if (typeof m.content === 'string') {
        contentString = m.content;
      } else if (Array.isArray(m.content)) {
        contentString = m.content.map((c: any) => c.text || '').join(' ');
      } else if (Array.isArray(m.parts)) {
        contentString = m.parts.map((p: any) => p.text || '').join(' ');
      }

      return {
        role: m.role || 'user',
        content: contentString || String(m.content || ''),
      };
    });

    const systemPrompt = `You are the friendly, expert customer assistant for Velours Patisserie, a premium French bakery & e-commerce shop. 

Here is our live product catalog and store inventory:
${productCatalogText}

Formatting & Style Rules (CRITICAL):
- DO NOT use markdown symbols such as hashtags (###), asterisks (* or **), underscores (_), or horizontal rules (---).
- Write in clean, elegant PLAIN TEXT only.
- Use simple bullet points (•) for listing items.
- Format all prices in Indonesian Rupiah (e.g. Rp 38.000).
- Answer customer inquiries naturally, politely, and warmly in Indonesian (or English if the user speaks English).`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    if (!apiKey) {
      return Response.json({
        text: 'Maaf, saat ini layanan AI Assistant sedang tidak aktif atau bermasalah. Silakan hubungi customer service kami atau coba lagi nanti.',
      });
    }

    const { text } = await generateText({
      model: google('gemini-3.6-flash'),
      system: systemPrompt,
      messages: formattedMessages,
      maxSteps: 5,
      tools: {
        checkOrderStatus: tool({
          description: 'Check the status of an order using the order number',
          parameters: z.object({
            orderNumber: z.string().describe('Order number (e.g. ORD-20260913-XXXX)'),
          }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            const order = await prisma.order.findUnique({
              where: { orderNumber },
              select: { orderNumber: true, status: true, paymentStatus: true, totalAmount: true },
            });
            if (!order) return { error: 'Order not found. Please check the order number.' };
            return order;
          },
        } as any),
      },
    } as any);

    // Clean up any residual markdown symbols (#, *, __, ---)
    let cleanText = (text || '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*{1,2}/g, '')
      .replace(/_{1,2}/g, '')
      .replace(/^---+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanText) {
      cleanText = 'Tentu! Ada yang bisa saya bantu lagi tentang produk Velours Patisserie?';
    }

    return Response.json({ text: cleanText });
  } catch (error: any) {
    console.error('API Chat Error:', error?.message || error);

    return Response.json({
      text: 'Maaf, saat ini layanan AI Assistant sedang bermasalah atau tidak aktif. Silakan hubungi customer service kami atau coba beberapa saat lagi.',
    });
  }
}
