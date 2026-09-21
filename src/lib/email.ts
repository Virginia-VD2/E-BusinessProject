import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'Velours Patisserie <dungusvirginia2@gmail.com>';

// Create Nodemailer Transporter
const createTransporter = () => {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const isSecure = SMTP_PORT === 465;
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: isSecure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  return null;
};

const formatIDR = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

/**
 * Send Welcome Email on New User Registration
 */
export async function sendRegistrationWelcomeEmail(userEmail: string, userName: string) {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdfbf7; color: #3b2a1d; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #f3e8d6; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background-color: #78350f; padding: 30px 20px; text-align: center; color: #fef3c7; }
          .header h1 { font-family: Georgia, serif; margin: 0; font-size: 26px; letter-spacing: 1px; }
          .content { padding: 30px 25px; line-height: 1.6; }
          .welcome-badge { display: inline-block; background-color: #fef3c7; color: #92400e; font-weight: bold; font-size: 12px; padding: 6px 12px; border-radius: 20px; margin-bottom: 15px; }
          .button { display: inline-block; background-color: #78350f; color: #ffffff !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; }
          .footer { background-color: #faf5eb; padding: 20px; text-align: center; font-size: 12px; color: #92400e; border-top: 1px solid #f3e8d6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Velours Patisserie</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Artisanal French Bakery & Pastries</p>
          </div>
          <div class="content">
            <span class="welcome-badge">Selamat Bergabung!</span>
            <h2 style="font-family: Georgia, serif; color: #78350f; margin-top: 0;">Bonjour, ${userName}!</h2>
            <p>Selamat datang di keluarga besar <strong>Velours Patisserie</strong>. Akun Anda telah berhasil terdaftar dengan email: <code>${userEmail}</code>.</p>
            <p>Kini Anda dapat menikmati pilihan pastry Perancis segar yang dipanggang setiap pagi menggunakan <em>Normandy Butter</em> dan teknik <em>Sourdough Fermentation</em> alami.</p>
            
            <div style="background-color: #fffbe8; border: 1px dashed #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong style="color: #92400e;">💡 Tips Spesial Pengunjung:</strong>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #78350f;">Dapatkan kesempatan bermain <strong>Kuis Seputar Velours</strong> & buka <strong>Voucher Diskon Easter Egg 15%</strong> untuk pembelian di atas Rp 100.000!</p>
            </div>

            <a href="https://www.velourspatisserie.web.id" class="button">Jelajahi Menu Pastry</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Velours Patisserie. All rights reserved.</p>
            <p style="margin-top: 5px; opacity: 0.8;">Jl. Artisanal Bakery No. 1, Jakarta • Customer Support</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Registration email triggered for: ${userEmail} (${userName})`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: userEmail,
      subject: '✨ Selamat Datang di Velours Patisserie - Konfirmasi Pendaftaran',
      html: htmlContent,
    });
    console.log(`[EMAIL SUCCESS] Registration email sent to ${userEmail} (${info.messageId})`);
    return { success: true };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send registration email to ${userEmail}:`, error);
    return { success: false, error };
  }
}

/**
 * Send Order Confirmation Email on New Order Checkout / Payment Settlement
 */
export async function sendOrderConfirmationEmail(orderData: {
  userEmail: string;
  userName: string;
  orderNumber: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  totalAmount: number;
  discountAmount?: number;
  discountCode?: string;
  shippingAddress: string;
  isPaid?: boolean;
}) {
  const transporter = createTransporter();

  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f3e8d6;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f3e8d6; text-align: center;">${item.quantity}x</td>
        <td style="padding: 10px; border-bottom: 1px solid #f3e8d6; text-align: right; font-weight: bold;">${formatIDR(item.price * item.quantity)}</td>
      </tr>
    `
    )
    .join('');

  const subtotal = orderData.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const statusTitle = orderData.isPaid ? 'Pembayaran Lunas & Pesanan Diproses' : 'Konfirmasi Pesanan Baru';
  const statusMessage = orderData.isPaid
    ? `Hore, ${orderData.userName}! Pembayaran Anda telah kami terima (LUNAS). Pesanan Anda sedang dipanggang & dikemas oleh tim bakery kami!`
    : `Terima kasih atas pesanan Anda, ${orderData.userName}! Pesanan Anda telah berhasil diterima dan sedang diproses oleh tim bakery kami.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fdfbf7; color: #3b2a1d; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #f3e8d6; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background-color: #78350f; padding: 30px 20px; text-align: center; color: #fef3c7; }
          .header h1 { font-family: Georgia, serif; margin: 0; font-size: 26px; }
          .content { padding: 30px 25px; line-height: 1.6; }
          .order-number { background-color: #fef3c7; color: #78350f; font-family: monospace; font-weight: bold; font-size: 16px; padding: 8px 16px; border-radius: 8px; display: inline-block; margin-bottom: 15px; }
          .status-badge { display: inline-block; background-color: ${orderData.isPaid ? '#d1fae5' : '#fef3c7'}; color: ${orderData.isPaid ? '#065f46' : '#78350f'}; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          th { background-color: #faf5eb; color: #78350f; padding: 10px; text-align: left; border-bottom: 2px solid #f3e8d6; }
          .totals { font-size: 14px; line-height: 1.8; }
          .grand-total { font-size: 18px; font-weight: bold; color: #78350f; border-top: 2px solid #78350f; padding-top: 8px; margin-top: 8px; }
          .footer { background-color: #faf5eb; padding: 20px; text-align: center; font-size: 12px; color: #92400e; border-top: 1px solid #f3e8d6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Velours Patisserie</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${statusTitle}</p>
          </div>
          <div class="content">
            <span class="status-badge">${orderData.isPaid ? 'STATUS: LUNAS (PAID)' : 'STATUS: PENDING PAYMENT'}</span>
            <h2 style="font-family: Georgia, serif; color: #78350f; margin-top: 0;">${statusTitle}</h2>
            <p>${statusMessage}</p>

            <div style="text-align: center; margin: 15px 0;">
              <span class="order-number">Nomor Pesanan: ${orderData.orderNumber}</span>
            </div>

            <h3 style="font-family: Georgia, serif; color: #78350f; border-bottom: 1px solid #f3e8d6; padding-bottom: 8px;">Rincian Produk</h3>
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals" style="margin-left: auto; max-width: 250px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>${formatIDR(subtotal)}</span>
              </div>
              ${
                orderData.discountAmount && orderData.discountAmount > 0
                  ? `
                <div style="display: flex; justify-content: space-between; color: #047857; font-weight: bold;">
                  <span>Diskon (${orderData.discountCode}):</span>
                  <span>-${formatIDR(orderData.discountAmount)}</span>
                </div>
              `
                  : ''
              }
              <div class="grand-total" style="display: flex; justify-content: space-between;">
                <span>Total Bayar:</span>
                <span>${formatIDR(orderData.totalAmount)}</span>
              </div>
            </div>

            <div style="background-color: #faf5eb; padding: 15px; border-radius: 8px; margin-top: 25px; font-size: 13px;">
              <strong style="color: #78350f;">Alamat Pengiriman:</strong>
              <p style="margin: 5px 0 0 0; color: #451a03;">${orderData.shippingAddress}</p>
            </div>
          </div>
          <div class="footer">
            <p>Butuh bantuan dengan pesanan Anda? Hubungi kami di support@velourspatisserie.web.id</p>
            <p style="margin-top: 5px; opacity: 0.8;">© ${new Date().getFullYear()} Velours Patisserie</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const subjectText = orderData.isPaid
    ? `✅ Pembayaran Lunas! Pesanan ${orderData.orderNumber} - Velours Patisserie`
    : `🍰 Konfirmasi Pesanan ${orderData.orderNumber} - Velours Patisserie`;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Order email triggered for: ${orderData.userEmail} (${orderData.orderNumber})`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: orderData.userEmail,
      subject: subjectText,
      html: htmlContent,
    });
    console.log(`[EMAIL SUCCESS] Order email sent to ${orderData.userEmail} (${info.messageId})`);
    return { success: true };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send order email to ${orderData.userEmail}:`, error);
    return { success: false, error };
  }
}

/**
 * Send Payment Success Email when an Order is Settled / Paid
 */
export async function sendOrderPaidSuccessEmail(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, user: true },
    });

    if (!order) return;

    let customerEmail = order.user?.email || '';
    const customerName = order.user?.name || 'Pelanggan Setia';
    let shippingAddr = 'Alamat Pengiriman';

    try {
      if (order.shippingAddress) {
        shippingAddr = JSON.parse(order.shippingAddress);
      }
    } catch {
      shippingAddr = order.shippingAddress || 'Alamat Pengiriman';
    }

    if (!customerEmail) {
      // Look up in activity logs for guest checkout email if needed
      const log = await prisma.activityLog.findFirst({
        where: { entity: 'Order', entityId: order.id, action: 'DISCOUNT_APPLIED' },
        orderBy: { createdAt: 'desc' },
      });
      if (log?.details) {
        try {
          const parsed = JSON.parse(log.details);
          if (parsed.email) customerEmail = parsed.email;
        } catch {
          // ignore
        }
      }
    }

    if (!customerEmail) {
      customerEmail = process.env.SMTP_USER || 'dungusvirginia2@gmail.com';
    }

    await sendOrderConfirmationEmail({
      userEmail: customerEmail,
      userName: customerName,
      orderNumber: order.orderNumber,
      items: order.items.map((i) => ({
        name: i.product.name,
        price: i.pricePerKg,
        quantity: i.requestedKg,
      })),
      totalAmount: order.finalAmount,
      shippingAddress: typeof shippingAddr === 'string' ? shippingAddr : JSON.stringify(shippingAddr),
      isPaid: true,
    });
  } catch (err) {
    console.error('Failed to dispatch order paid success email:', err);
  }
}
