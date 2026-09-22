'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { registerUserAction } from '@/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await registerUserAction(formData);

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push('/login?registered=true');
    }
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
            Pendaftaran Akun Baru AYAMAJA
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Nama Lengkap</label>
              <Input type="text" name="name" required placeholder="Nama Anda" className="bg-slate-800 border-slate-700 text-white focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Alamat Email</label>
              <Input type="email" name="email" required placeholder="email@example.com" className="bg-slate-800 border-slate-700 text-white focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
              <Input type="password" name="password" required minLength={6} placeholder="••••••••" className="bg-slate-800 border-slate-700 text-white focus:border-orange-500" />
            </div>

            {error && <p className="text-xs text-red-400 font-semibold text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-5 rounded-xl shadow-lg">
              {loading ? 'Mendaftarkan...' : 'Buat Akun AYAMAJA'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="text-orange-400 font-bold hover:underline ml-1">
            Masuk Sekarang
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
