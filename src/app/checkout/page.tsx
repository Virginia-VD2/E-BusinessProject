import { Header } from '@/components/shop/Header';
import { CheckoutForm } from '@/components/shop/CheckoutForm';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-amber-50/20 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl flex-1">
        <h1 className="font-serif text-3xl font-bold text-amber-950 mb-8">Checkout</h1>
        <CheckoutForm />
      </main>
    </div>
  );
}
