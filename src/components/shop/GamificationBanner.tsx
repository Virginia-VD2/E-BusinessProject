'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/use-cart-store';
import { MiniBakeGameModal } from '@/components/shop/MiniBakeGameModal';
import { Sparkles, HelpCircle, Gift, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GamificationBannerProps {
  variant?: 'banner' | 'compact' | 'floating';
}

export function GamificationBanner({ variant = 'banner' }: GamificationBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { totalPrice, appliedDiscount, hasPlayedGame } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = totalPrice();
  const isEligible = subtotal >= 100000;
  const neededAmount = Math.max(0, 100000 - subtotal);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (variant === 'compact') {
    return (
      <>
        <div
          onClick={() => setIsModalOpen(true)}
          className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-center justify-between gap-3 shadow-sm ${
            isEligible
              ? 'bg-gradient-to-r from-red-500/10 via-orange-400/20 to-amber-500/10 border-red-400/60 hover:border-red-500'
              : 'bg-red-50/50 border-red-200/60 hover:bg-red-100/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isEligible ? 'bg-red-800 text-red-100' : 'bg-red-200 text-red-800'
              }`}
            >
              {isEligible ? <HelpCircle className="h-5 w-5 animate-pulse" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Kuis AYAMAJA (Voucher Ayam Segar)</span>
                {isEligible && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${hasPlayedGame ? 'bg-red-800 text-white' : 'bg-emerald-600 text-white'}`}>
                    {hasPlayedGame ? 'Sudah Dimainkan (1x)' : '1x Main'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEligible
                  ? hasPlayedGame
                    ? 'Lihat/Pasang voucher diskon hasil kuis Anda'
                    : 'Jawab kuis & buka voucher diskon rahasia AYAMAJA 1x sebelum bayar!'
                  : `Kurang ${formatIDR(neededAmount)} lagi untuk 1x kesempatan kuis`}
              </p>
            </div>
          </div>
          <Button size="sm" variant={isEligible ? 'default' : 'outline'} className={isEligible ? 'bg-red-600 hover:bg-red-700 text-white shrink-0' : 'border-red-300 text-red-900 shrink-0'}>
            {isEligible ? (hasPlayedGame ? 'Voucher' : 'Kuis') : 'Info'}
          </Button>
        </div>

        <MiniBakeGameModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-red-600 to-orange-600 text-white p-3.5 rounded-full shadow-2xl hover:scale-105 transition-all border-2 border-orange-300/40 flex items-center gap-2 group"
        >
          <div className="relative">
            <HelpCircle className="h-6 w-6 text-amber-300 group-hover:rotate-12 transition-transform" />
            {isEligible && !hasPlayedGame && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <span className="text-xs font-bold hidden sm:inline pr-1">
            {hasPlayedGame ? 'Voucher Diskon' : 'Kuis AYAMAJA'}
          </span>
        </button>

        <MiniBakeGameModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Default Banner Variant
  return (
    <>
      <div
        className={`w-full rounded-2xl p-4 sm:p-5 border transition-all shadow-md relative overflow-hidden ${
          isEligible
            ? 'bg-gradient-to-br from-red-900 via-red-800 to-orange-950 text-white border-red-500/50'
            : 'bg-gradient-to-br from-red-50 via-amber-50 to-orange-50 text-slate-900 border-red-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl shadow-inner ${
                isEligible ? 'bg-red-700/80 text-amber-200' : 'bg-red-100 text-red-900'
              }`}
            >
              <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base sm:text-lg tracking-wide">
                  🧠 Kuis AYAMAJA & Voucher Diskon Ayam Segar
                </h4>
                {appliedDiscount ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {appliedDiscount.code} Aktif
                  </span>
                ) : hasPlayedGame ? (
                  <span className="bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-amber-300" /> 1x Kesempatan Selesai
                  </span>
                ) : null}
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-xl ${isEligible ? 'text-red-100' : 'text-slate-600'}`}>
                {isEligible ? (
                  hasPlayedGame ? (
                    <span>
                      🎉 <strong>Anda telah menyelesaikan 1x kesempatan kuis!</strong> Kode voucher diskon AYAMAJA siap digunakan di keranjang.
                    </span>
                  ) : (
                    <span>
                      🎉 <strong>Hore! 1x Kesempatan kuis terbuka!</strong> Jawab 3 pertanyaan seputar AYAMAJA Minahasa Utara & buka Voucher Diskon hingga 15%!
                    </span>
                  )
                ) : (
                  <span>
                    Belanja di atas <strong className="underline">Rp 100.000</strong> untuk membuka Kuis AYAMAJA & diskon rahasia! (Masih kurang{' '}
                    <strong className="text-red-950 font-bold">{formatIDR(neededAmount)}</strong> lagi)
                  </span>
                )}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className={`w-full sm:w-auto font-bold shrink-0 ${
              isEligible
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isEligible ? (
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4" /> {hasPlayedGame ? 'Lihat Voucher' : 'Mulai Kuis'} <ChevronRight className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> Cek syarat kuis
              </span>
            )}
          </Button>
        </div>
      </div>

      <MiniBakeGameModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
