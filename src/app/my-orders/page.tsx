import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shop/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Package, ChevronRight, Truck, Scale, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { syncOrderStatusAction } from '@/actions/checkout';
import { OrderClaimBar } from '@/components/shop/OrderClaimBar';

export const revalidate = 0; // Prevent aggressive caching for user data

export default async function MyOrdersPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/my-orders');
  }

  // Claim unassigned orders or orders matching user's email
  if (session.user.id || session.user.email) {
    const userEmail = session.user.email || '';
    await prisma.order.updateMany({
      where: {
        OR: [
          { userId: null },
          ...(userEmail ? [{ shippingAddress: { contains: userEmail, mode: 'insensitive' as const } }] : []),
        ],
      },
      data: { userId: session.user.id },
    });
  }

  // Query user orders
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        ...(session.user.email ? [{ shippingAddress: { contains: session.user.email, mode: 'insensitive' as const } }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  });

  // Auto-sync status with Midtrans API for UNPAID / PENDING orders
  const pendingOrders = orders.filter((o) => ['UNPAID', 'PENDING'].includes(o.paymentStatus));
  for (const po of pendingOrders) {
    await syncOrderStatusAction(po.orderNumber);
  }

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'SETTLEMENT': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING':
      case 'UNPAID': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'EXPIRED':
      case 'CANCEL': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Pesanan Dikonfirmasi', icon: CheckCircle2, color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'WEIGHT_VERIFIED':
        return { label: 'Timbangan IoT Verified', icon: Scale, color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'PROCESSING':
        return { label: 'Sedang Dipotong & Dikemas', icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'SHIPPED':
        return { label: '🚚 Dalam Pengiriman (OTW)', icon: Truck, color: 'bg-amber-500 text-white border-amber-600 font-extrabold animate-pulse' };
      case 'DELIVERED':
        return { label: '✅ Tiba di Lokasi', icon: CheckCircle2, color: 'bg-emerald-600 text-white border-emerald-700 font-bold' };
      default:
        return { label: 'Menunggu Pemrosesan', icon: Package, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/20 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-amber-900" />
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-amber-950">Pesanan Saya</h1>
              <p className="text-xs text-slate-500">Monitor status pembayaran, pemotongan, dan pengantaran ayam segar AYAMAJA</p>
            </div>
          </div>
        </div>

        {/* Claim / Search Bar Component */}
        <OrderClaimBar />

        {orders.length === 0 ? (
          <Card className="p-12 text-center shadow-sm">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-slate-700">Belum Ada Pesanan</h2>
            <p className="text-muted-foreground mt-2 mb-6">Anda belum memiliki riwayat pesanan ayam segar.</p>
            <Link href="/" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90">
              Mulai Belanja Ayam Segar
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const deliveryBadge = getDeliveryStatusBadge(order.status);
              const DeliveryIcon = deliveryBadge.icon;

              return (
                <Link href={`/orders/${order.orderNumber}`} key={order.id} className="block group">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-slate-200">
                    <CardHeader className="py-3 px-4 border-b bg-slate-50/80 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-mono text-slate-800 flex items-center gap-2">
                          <span>{order.orderNumber}</span>
                          <span className="text-xs font-serif text-slate-500 font-normal">
                            • {new Date(order.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Delivery Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 ${deliveryBadge.color}`}>
                          <DeliveryIcon className="w-3 h-3" />
                          {deliveryBadge.label}
                        </span>

                        {/* Payment Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPaymentBadge(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900 text-sm">
                          {order.items.length > 0 ? order.items[0].product.name : 'Ayam Segar'}
                          {order.items.length > 1 && <span className="text-muted-foreground font-normal"> (+{order.items.length - 1} item lainnya)</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          Total Weight: <strong className="text-slate-800">{order.actualWeightKg ? `${order.actualWeightKg} kg (Actual)` : `${order.requestedWeightKg} kg`}</strong>
                        </p>
                        <p className="text-sm font-bold text-primary">{formatIDR(order.finalAmount)}</p>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                        <span>Lacak Pengantaran</span>
                        <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
