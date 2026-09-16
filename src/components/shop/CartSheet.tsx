/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/use-cart-store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Trash2, Tag, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { GamificationBanner } from '@/components/shop/GamificationBanner';

export function CartSheet() {
  const [mounted, setMounted] = useState(false);
  const {
    items,
    updateQuantity,
    removeItem,
    totalPrice,
    totalItems,
    appliedDiscount,
    removeDiscountCode,
    discountAmount,
    finalPrice,
  } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const itemCount = mounted ? totalItems() : 0;
  const cartItems = mounted ? items : [];

  return (
    <Sheet>
      <SheetTrigger
        render={(props) => (
          <Button {...props} variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Button>
        )}
      />
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Shopping Cart ({itemCount})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Gamification Compact Banner */}
          {mounted && cartItems.length > 0 && (
            <div className="px-1">
              <GamificationBanner variant="compact" />
            </div>
          )}

          <div className="divide-y border-t pt-2">
            {!mounted || cartItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Your cart is empty.</div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-center">
                  <div className="relative h-16 w-16 rounded overflow-hidden bg-muted shrink-0">
                    {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{item.name}</h4>
                    <p className="text-sm text-primary font-bold">{formatIDR(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-8 w-8"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {mounted && cartItems.length > 0 && (
          <SheetFooter className="border-t pt-4 flex flex-col gap-3">
            {appliedDiscount && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-between text-xs text-emerald-900 font-medium">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <span>
                    Kode <strong className="font-bold">{appliedDiscount.code}</strong>: -{formatIDR(discountAmount())}
                  </span>
                </div>
                <button
                  onClick={removeDiscountCode}
                  className="text-emerald-700 hover:text-emerald-950 p-1 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Subtotal:</span>
                <span>{formatIDR(totalPrice())}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between items-center text-sm text-emerald-700 font-semibold">
                  <span>Diskon:</span>
                  <span>-{formatIDR(discountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between items-center w-full pt-1">
                <span className="font-bold text-slate-800">Total Bayar:</span>
                <span className="text-xl font-black text-amber-900">{formatIDR(finalPrice())}</span>
              </div>
            </div>

            <Link href="/checkout" className="w-full">
              <Button className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-5">
                Proceed to Checkout
              </Button>
            </Link>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
