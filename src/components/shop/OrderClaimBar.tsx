'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { claimOrderByNumberAction } from '@/actions/checkout';

export function OrderClaimBar() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await claimOrderByNumberAction(orderNumber.trim());
    setLoading(false);

    if (res.success && res.orderNumber) {
      router.push(`/orders/${res.orderNumber}`);
    } else {
      setErrorMsg(res.error || 'Pesanan tidak ditemukan.');
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 space-y-2">
      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <Search className="w-3.5 h-3.5 text-orange-600" />
        <span>Punya Kode Pesanan? Cari & Klaim Ke Akun Anda:</span>
      </div>

      <form onSubmit={handleClaim} className="flex gap-2">
        <input
          type="text"
          placeholder="Contoh: ORD-20260922-RSO7Y3"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 font-mono uppercase focus:outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Klaim & Lacak'}
        </button>
      </form>

      {errorMsg && (
        <div className="text-[11px] text-red-600 font-medium">⚠️ {errorMsg}</div>
      )}
    </div>
  );
}
