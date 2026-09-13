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

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '/placeholder.png',
      },
      quantity
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={quantity >= product.stock}
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Button
        onClick={handleAdd}
        disabled={product.stock <= 0}
        className="w-full h-12 text-base gap-2"
      >
        {added ? (
          <>
            <Check className="h-5 w-5" /> Added to Cart!
          </>
        ) : (
          <>
            <ShoppingBag className="h-5 w-5" /> Add {quantity} to Cart
          </>
        )}
      </Button>
    </div>
  );
}
