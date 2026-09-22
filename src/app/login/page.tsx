'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Email atau password tidak sesuai.');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleQuickLogin = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-900 text-white">
        <CardHeader className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 flex items-center justify-center text-white text-2xl shadow-lg">
              🍗
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
              AYAMAJA
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Platform Asisten Belanja Ayam Segar • Minahasa Utara
            </p>
          </div>
          <CardTitle className="text-sm font-medium text-slate-300 pt-2">
            Masuk ke Akun Anda
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-slate-800 border-slate-700 text-white focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-800 border-slate-700 text-white focus:border-orange-500"
              />
            </div>

            {error && <p className="text-xs text-red-400 font-semibold text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-5 rounded-xl shadow-lg">
              {loading ? 'Memproses...' : 'Masuk Akun'}
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider text-center">Akun Uji Coba Cepat:</p>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@ayamaja.com', 'admin123')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold border border-slate-700 text-center"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('seller@ayamaja.com', 'seller123')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-orange-400 font-semibold border border-slate-700 text-center"
              >
                🏪 Seller
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('nathantambuku13@gmail.com', 'user123')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold border border-slate-700 text-center"
              >
                👤 Customer
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          Belum punya akun?{' '}
          <Link href="/register" className="text-orange-400 font-bold hover:underline ml-1">
            Daftar Sekarang
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
