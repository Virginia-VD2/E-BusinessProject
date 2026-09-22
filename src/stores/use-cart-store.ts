import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface AppliedDiscount {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
}

export const VALID_DISCOUNTS: Record<
  string,
  { type: 'percentage' | 'fixed'; value: number; description: string; minSpend: number }
> = {
  EASTERBAKE15: {
    type: 'percentage',
    value: 15,
    description: 'Diskon Easter Egg 15% (Mini Bake Game)',
    minSpend: 100000,
  },
  BAKER20K: {
    type: 'fixed',
    value: 20000,
    description: 'Voucher Master Baker Rp 20.000',
    minSpend: 100000,
  },
  SECRETBAKE10: {
    type: 'percentage',
    value: 10,
    description: 'Diskon Rahasia Chef 10%',
    minSpend: 100000,
  },
};

interface CartStore {
  items: CartItem[];
  appliedDiscount: AppliedDiscount | null;
  hasPlayedGame: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
  applyDiscountCode: (code: string) => { success: boolean; message: string };
  removeDiscountCode: () => void;
  setHasPlayedGame: (played: boolean) => void;
  discountAmount: () => number;
  finalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedDiscount: null,
      hasPlayedGame: false,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity }] };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [], appliedDiscount: null, hasPlayedGame: false }),

      totalPrice: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),

      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      applyDiscountCode: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        const promo = VALID_DISCOUNTS[cleanCode];

        if (!promo) {
          return { success: false, message: 'Kode diskon tidak ditemukan atau tidak valid.' };
        }

        const subtotal = get().totalPrice();
        if (subtotal < promo.minSpend) {
          return {
            success: false,
            message: `Kode ini hanya dapat digunakan untuk pembelian di atas Rp ${promo.minSpend.toLocaleString('id-ID')}.`,
          };
        }

        set({
          appliedDiscount: {
            code: cleanCode,
            type: promo.type,
            value: promo.value,
            description: promo.description,
          },
        });

        return { success: true, message: `Kode diskon ${cleanCode} berhasil dipasang!` };
      },

      removeDiscountCode: () => set({ appliedDiscount: null }),

      setHasPlayedGame: (played: boolean) => set({ hasPlayedGame: played }),

      discountAmount: () => {
        const discount = get().appliedDiscount;
        if (!discount) return 0;
        const subtotal = get().totalPrice();
        if (discount.type === 'percentage') {
          return Math.round((subtotal * discount.value) / 100);
        }
        return Math.min(discount.value, subtotal);
      },

      finalPrice: () => {
        const subtotal = get().totalPrice();
        const discount = get().discountAmount();
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'ayamaja-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
