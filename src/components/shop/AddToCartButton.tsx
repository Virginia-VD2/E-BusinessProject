/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/use-cart-store';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus, Minus, Check } from 'lucide-react';

export function AddToCartButton({ product }: { product: any }) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const pricePerKg = product.pricePerKg || product.price || 36000;
  const stockKg = product.stockKg ?? product.stock ?? 100;

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: `${product.name} (${quantity} kg)`,
        price: pricePerKg * quantity,
        image: product.images?.[0] || '/placeholder.png',
      },
      1
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-slate-700">Jumlah (Kg):</span>
        <div className="flex items-center border border-slate-300 rounded-xl bg-white">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-700"
            disabled={quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-10 text-center font-black text-sm text-slate-900">{quantity} kg</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-700"
            disabled={quantity >= stockKg}
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Button
        onClick={handleAdd}
        disabled={stockKg <= 0}
        className="w-full h-12 text-base font-bold gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md"
      >
        {added ? (
          <>
            <Check className="h-5 w-5" /> Ditambahkan ke Keranjang!
          </>
        ) : (
          <>
            <ShoppingBag className="h-5 w-5" /> Tambah {quantity} kg ke Keranjang
          </>
        )}
      </Button>
    </div>
  );
}
