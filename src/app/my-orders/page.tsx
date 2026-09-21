import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shop/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { syncOrderStatusAction } from '@/actions/checkout';

export const revalidate = 0; // Prevent aggressive caching for user data

export default async function MyOrdersPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/my-orders');
  }

  // Associate any previously unassigned orders with the current logged-in user
  if (session.user.id) {
    await prisma.order.updateMany({
      where: { userId: null },
      data: { userId: session.user.id },
    });
  }

  // Auto-sync any pending or unpaid orders for current user
  const initialPendingOrders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      paymentStatus: { in: ['UNPAID', 'PENDING'] },
    },
    select: { orderNumber: true },
  });

  for (const po of initialPendingOrders) {
    await syncOrderStatusAction(po.orderNumber);
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  });

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SETTLEMENT': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'EXPIRED':
      case 'CANCEL': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/20 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl flex-1">
        <div className="flex items-center gap-3 mb-8">
          <Package className="h-8 w-8 text-amber-900" />
          <h1 className="font-serif text-3xl font-bold text-amber-950">My Order History</h1>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center shadow-sm">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-slate-700">No orders yet</h2>
            <p className="text-muted-foreground mt-2 mb-6">Looks like you haven&apos;t made your first purchase.</p>
            <Link href="/" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90">
              Start Shopping
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link href={`/orders/${order.orderNumber}`} key={order.id} className="block group">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-mono text-slate-600">{order.orderNumber}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">
                        {order.items.length > 0 ? order.items[0].product.name : 'Unknown Product'}
                        {order.items.length > 1 && <span className="text-muted-foreground font-normal"> and {order.items.length - 1} other items</span>}
                      </p>
                      <p className="text-sm font-bold text-primary">{formatIDR(order.finalAmount)}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
