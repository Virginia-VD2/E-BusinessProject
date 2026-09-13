import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/shop/ProductCard';
import { AIChatbot } from '@/components/shop/AIChatbot';
import { Header } from '@/components/shop/Header';

export const revalidate = 60; // Refresh dynamic content every minute

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function HomePage() {
  // Fetch active products from DB (fall back gracefully if DB not connected yet)
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to load products from DB:', error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/20">
      <Header />

      {/* Hero Banner */}
      <section className="relative bg-amber-900 text-amber-50 py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight">
            Artisanal French Bakery & Pastries
          </h1>
          <p className="text-amber-200 text-lg sm:text-xl">
            Baked fresh every morning using traditional sourdough techniques and Normandy butter.
          </p>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-amber-950 mb-8 text-center sm:text-left">
          Our Fresh Pastries
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-amber-100 p-8 shadow-sm">
            <p className="text-muted-foreground text-lg">
              No products found. Run <code className="bg-muted px-2 py-1 rounded text-sm font-mono">npx prisma db seed</code> to load default bakery items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          © {new Date().getFullYear()} Velours Patisserie. All rights reserved.
        </div>
      </footer>

      {/* AI Virtual Assistant */}
      <AIChatbot />
    </div>
  );
}
