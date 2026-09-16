'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/use-cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { createCheckoutSessionAction } from '@/actions/checkout';
import { SnapPayButton } from '@/components/shop/SnapPayButton';
import { GamificationBanner } from '@/components/shop/GamificationBanner';
import { Tag, CheckCircle2, AlertCircle, X } from 'lucide-react';

export function CheckoutForm() {
  const [mounted, setMounted] = useState(false);
  const {
    items,
    totalPrice,
    appliedDiscount,
    applyDiscountCode,
    removeDiscountCode,
    discountAmount,
    finalPrice,
    clearCart,
  } = useCartStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [snapData, setSnapData] = useState<{ token: string; orderNumber: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = applyDiscountCode(couponInput);
    if (res.success) {
      setCouponMsg({ type: 'success', text: res.message });
      setCouponInput('');
    } else {
      setCouponMsg({ type: 'error', text: res.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    const res = await createCheckoutSessionAction({
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      customer: formData,
      discountCode: appliedDiscount?.code,
    });

    setLoading(false);

    if (res.success && res.snapToken) {
      setSnapData({ token: res.snapToken, orderNumber: res.orderNumber! });
      clearCart();
    } else {
      setError(res.error || 'Gagal membuat pesanan. Silakan coba lagi.');
    }
  };

  if (!mounted || (items.length === 0 && !snapData)) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{!mounted ? 'Memuat checkout...' : 'Keranjang kamu kosong.'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner Gamifikasi */}
      {!snapData && <GamificationBanner variant="banner" />}

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
                  placeholder="Nama jalan, Nomor rumah, Kota, Kode Pos"
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Order Summary & Coupon Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-xl font-serif">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Items List */}
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold">{formatIDR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            {!snapData && (
              <div className="pt-4 border-t space-y-3">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Tag className="h-3.5 w-3.5 text-amber-700" />
                  <span>Voucher Diskon / Easter Egg Code</span>
                </label>

                {appliedDiscount ? (
                  <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold text-emerald-950">
                          {appliedDiscount.code} ({appliedDiscount.description})
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          Hemat {formatIDR(discountAmount())}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={removeDiscountCode}
                      className="text-emerald-700 hover:text-emerald-950 p-1"
                      title="Hapus Kode"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <Input
                      placeholder="Masukkan kode diskon..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="uppercase font-mono text-sm"
                    />
                    <Button type="submit" variant="outline" className="border-amber-300 hover:bg-amber-50">
                      Pasang
                    </Button>
                  </form>
                )}

                {couponMsg && (
                  <div
                    className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${
                      couponMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {couponMsg.type === 'success' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    )}
                    <span>{couponMsg.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatIDR(totalPrice())}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Diskon Promo ({appliedDiscount.code})</span>
                  <span>-{formatIDR(discountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 text-amber-900 border-t">
                <span>Total Amount</span>
                <span>{formatIDR(finalPrice())}</span>
              </div>
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
                className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-6"
              >
                {loading ? 'Menyiapkan Pembayaran...' : 'Lanjut Ke Pembayaran'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
