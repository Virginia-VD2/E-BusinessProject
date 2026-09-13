import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShoppingBag, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Always dynamic

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminDashboardPage() {
  let productCount = 0;
  let orderCount = 0;
  let totalRevenue = 0;
  let recentOrders: any[] = [];

  try {
    productCount = await prisma.product.count();
    orderCount = await prisma.order.count();
    
    const settledOrders = await prisma.order.aggregate({
      where: { paymentStatus: 'SETTLEMENT' },
      _sum: { totalAmount: true },
    });
    totalRevenue = settledOrders._sum.totalAmount || 0;

    recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  } catch (error) {
    console.error('Failed to load admin stats:', error);
  }

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Velours Patisserie Store Management</p>
          </div>
          <Link href="/" className="text-sm text-primary underline">
            Back to Public Storefront
          </Link>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatIDR(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orders Placed</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No transactions recorded yet.</p>
            ) : (
              <div className="divide-y text-sm">
                {recentOrders.map((order) => (
                  <div key={order.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.user?.name || 'Guest'} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatIDR(order.totalAmount)}</p>
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
