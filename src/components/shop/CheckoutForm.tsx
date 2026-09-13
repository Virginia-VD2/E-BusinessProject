'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/use-cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { createCheckoutSessionAction } from '@/actions/checkout';
import { SnapPayButton } from '@/components/shop/SnapPayButton';

export function CheckoutForm() {
  const [mounted, setMounted] = useState(false);
  const { items, totalPrice, clearCart } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [snapData, setSnapData] = useState<{ token: string; orderNumber: string } | null>(null);
  const [error, setError] = useState('');

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    const res = await createCheckoutSessionAction({
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      customer: formData,
    });

    setLoading(false);

    if (res.success && res.snapToken) {
      setSnapData({ token: res.snapToken, orderNumber: res.orderNumber! });
      clearCart();
    } else {
      setError(res.error || 'Failed to create order. Please try again.');
    }
  };

  if (!mounted || (items.length === 0 && !snapData)) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{!mounted ? 'Loading checkout...' : 'Your cart is empty.'}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Form Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-serif">Shipping Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Delivery Address</label>
              <Input
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street name, City, Postal Code"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-xl font-serif">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 divide-y">
          <div className="space-y-2 pt-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-semibold">{formatIDR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg pt-4 text-primary">
            <span>Total Amount</span>
            <span>{formatIDR(totalPrice())}</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {error && <p className="text-xs text-destructive">{error}</p>}

          {snapData ? (
            <SnapPayButton snapToken={snapData.token} orderNumber={snapData.orderNumber} />
          ) : (
            <Button
              type="submit"
              form="checkout-form"
              disabled={loading || items.length === 0}
              className="w-full"
            >
              {loading ? 'Generating Payment...' : 'Proceed to Payment'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
