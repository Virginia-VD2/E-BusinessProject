import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Header } from '@/components/shop/Header';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  // Decode slug in case it has spaces or special characters
  const decodedSlug = decodeURIComponent(params.slug);

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: decodedSlug },
        { slug: params.slug },
        { name: { equals: decodedSlug, mode: 'insensitive' } },
      ],
    },
  });

  if (!product) {
    notFound();
  }

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-amber-50/20 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-5xl flex-1">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-amber-900 mb-8">
          <ChevronLeft className="h-4 w-4" /> Back to Storefront
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-xl border border-amber-100 p-6 sm:p-8 shadow-sm">
          {/* Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={product.images[0] || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                {product.category}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-amber-950">
                {product.name}
              </h1>
              <p className="text-2xl font-bold text-primary">
                {formatIDR(product.price)}
              </p>
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Availability:</span>
                {product.stock > 0 ? (
                  <span className="font-semibold text-green-600">In Stock ({product.stock} available)</span>
                ) : (
                  <span className="font-semibold text-red-600">Out of Stock</span>
                )}
              </div>

              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
