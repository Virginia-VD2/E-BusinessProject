import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Header } from '@/components/shop/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SnapPayButton } from '@/components/shop/SnapPayButton';
import { SandboxSimulateButton } from '@/components/shop/SandboxSimulateButton';
import { syncOrderStatusAction } from '@/actions/checkout';

export default async function OrderStatusPage({ params }: { params: { orderNumber: string } }) {
  let order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    notFound();
  }

  // Auto sync status with Midtrans API on page view if pending or unpaid
  if (['UNPAID', 'PENDING'].includes(order.paymentStatus)) {
    const syncResult = await syncOrderStatusAction(order.orderNumber);
    if (syncResult.success && syncResult.updated) {
      order = await prisma.order.findUnique({
        where: { orderNumber: params.orderNumber },
        include: { items: { include: { product: true } } },
      }) ?? order;
    }
  }

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SETTLEMENT': return 'bg-green-100 text-green-800';
      case 'UNPAID':
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'EXPIRED':
      case 'CANCEL': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/20 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl flex-1">
        <Card>
          <CardHeader className="text-center border-b bg-slate-50 rounded-t-lg">
            <CardTitle className="text-2xl font-serif text-slate-900">Order Invoice</CardTitle>
            <p className="font-mono text-sm text-slate-500 mt-2">{order.orderNumber}</p>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${getStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Shipping Details</p>
              <div className="bg-slate-50 p-3 rounded text-sm">
                {order.shippingAddress.replace(/["']/g, '')}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
              <div className="space-y-3 divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="pt-3 flex justify-between">
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">{item.requestedKg} kg x {formatIDR(item.pricePerKg)}/kg</p>
                    </div>
                    <p className="font-semibold">{formatIDR(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
              <span>Total Pas / Estimasi</span>
              <span className="text-primary">{formatIDR(order.finalAmount)}</span>
            </div>

            {['UNPAID', 'PENDING'].includes(order.paymentStatus) && (
              <div className="pt-6 space-y-3">
                {order.snapToken && (
                  <SnapPayButton snapToken={order.snapToken} orderNumber={order.orderNumber} />
                )}
                
                {!isProduction && (
                  <SandboxSimulateButton orderNumber={order.orderNumber} />
                )}

                <p className="text-xs text-center text-muted-foreground mt-2">
                  Please complete your payment before it expires.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
