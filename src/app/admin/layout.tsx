import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-serif font-bold text-xl text-slate-900">Admin Panel</span>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
              <Link href="/admin" className="hover:text-primary">Dashboard</Link>
              <Link href="/admin/products" className="hover:text-primary">Products</Link>
              <Link href="/admin/logs" className="hover:text-primary">Activity Logs</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">Storefront</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
