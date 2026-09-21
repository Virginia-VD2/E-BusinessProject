'use client';

import Link from 'next/link';
import { CartSheet } from '@/components/shop/CartSheet';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { Sparkles, Store } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-red-100 bg-white/95 backdrop-blur shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
            🍗
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                AYAMAJA
              </span>
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                AI Assistant
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Asisten Belanja Ayam Segar • Minahasa Utara
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/#ai-assistant">
            <Button size="sm" variant="outline" className="hidden md:inline-flex border-orange-300 text-orange-700 hover:bg-orange-50 gap-1.5 font-bold">
              <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
              Tanya AI AYAMAJA
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {(user.role === 'ADMIN' || user.role === 'SELLER') && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50 font-bold flex items-center gap-1">
                    <Store className="h-4 w-4" />
                    <span className="hidden sm:inline">Seller Copilot</span>
                  </Button>
                </Link>
              )}
              <Link href="/my-orders">
                <Button variant="ghost" size="sm" className="text-slate-700">Pesanan Saya</Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Keluar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-700 font-semibold">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold hidden sm:inline-flex">Daftar</Button>
              </Link>
            </div>
          )}

          <CartSheet />
        </div>
      </div>
    </header>
  );
}
