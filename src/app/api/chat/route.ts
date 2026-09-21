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
    let productCatalogText = 'Katalog produk saat ini belum tersedia.';
    try {
      const activeProducts = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { category: 'asc' },
      });
      productCatalogText = activeProducts
        .map(
          (p) =>
            `• ${p.name} | Kategori: ${p.category} | Harga: Rp ${p.pricePerKg.toLocaleString('id-ID')}/kg | Stok: ${p.stockKg} kg | Deskripsi: ${p.description}`
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

    const systemPrompt = `Kamu adalah AYAMAJA AI, asisten belanja cerdas ayam segar di Minahasa Utara (Airmadidi, Kalawat, Kauditan, Likupang).
Positioning utama: "Kamu bilang butuh apa, AYAMAJA yang mengurus sisanya."

Berikut katalog live & stok ayam segar saat ini:
${productCatalogText}

Aturan Penulisan (SANGAT PENTING):
- JANGAN gunakan tanda markdown seperti pagar (###), asterisk (* atau **), underscore (_), atau garis horizontal (---).
- Tulis dalam TEKS POLOS yang rapi & ramah.
- Gunakan poin peluru sederhana (•) untuk daftar item.
- Format harga dalam Rupiah (contoh: Rp 36.000/kg).
- Jawab pertanyaan pembeli secara alami dan solutif dalam bahasa Indonesia sehari-hari.`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    if (!apiKey) {
      return Response.json({
        text: 'Maaf, saat ini layanan AYAMAJA AI Assistant sedang tidak aktif. Silakan gunakan UI pemilihan langsung di halaman depan.',
      });
    }

    const { text } = await generateText({
      model: google('gemini-3.6-flash'),
      system: systemPrompt,
      messages: formattedMessages,
      maxSteps: 5,
      tools: {
        checkOrderStatus: tool({
          description: 'Cek status pesanan ayam menggunakan nomor pesanan',
          parameters: z.object({
            orderNumber: z.string().describe('Nomor Pesanan (contoh: AYM-89210)'),
          }),
          execute: async ({ orderNumber }: { orderNumber: string }) => {
            const order = await prisma.order.findUnique({
              where: { orderNumber },
              select: { orderNumber: true, status: true, paymentStatus: true, finalAmount: true },
            });
            if (!order) return { error: 'Pesanan tidak ditemukan.' };
            return order;
          },
        } as any),
      },
    } as any);

    let cleanText = (text || '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*{1,2}/g, '')
      .replace(/_{1,2}/g, '')
      .replace(/^---+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanText) {
      cleanText = 'Ada yang bisa AYAMAJA bantu lagi untuk pemesanan ayam segar Anda?';
    }

    return Response.json({ text: cleanText });
  } catch (error: any) {
    console.error('API Chat Error:', error?.message || error);

    return Response.json({
      text: 'Maaf, saat ini layanan AYAMAJA AI sedang bermasalah. Silakan gunakan pemesanan via UI.',
    });
  }
}
