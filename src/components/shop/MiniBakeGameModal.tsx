'use client';

import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/stores/use-cart-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, Lock, RefreshCw, X, CheckCircle2, Flame, Gift } from 'lucide-react';

interface MiniBakeGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAKE_LAYERS = [
  { id: 1, name: 'Sponge Bolu Lembut', color: 'bg-amber-200 border-amber-400 text-amber-900', icon: '🍞' },
  { id: 2, name: 'Selai Stroberi Manis', color: 'bg-rose-400 border-rose-500 text-white', icon: '🍓' },
  { id: 3, name: 'Krim Whipped Fluffy', color: 'bg-amber-50 border-amber-300 text-amber-900', icon: '🧁' },
  { id: 4, name: 'Cokelat & Ceri Top', color: 'bg-amber-950 border-amber-900 text-amber-100', icon: '🍒' },
];

export function MiniBakeGameModal({ isOpen, onClose }: MiniBakeGameModalProps) {
  const { totalPrice, applyDiscountCode, setHasPlayedGame } = useCartStore();

  const subtotal = totalPrice();
  const isEligible = subtotal >= 100000;
  const neededAmount = Math.max(0, 100000 - subtotal);

  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'SUCCESS' | 'TIME_OUT'>('READY');
  const [currentLayer, setCurrentLayer] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [unlockedCode, setUnlockedCode] = useState('EASTERBAKE15');
  const [copied, setCopied] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setGameState('READY');
      setCurrentLayer(0);
      setTimeLeft(5.0);
      setCopied(false);
      setApplySuccessMsg('');
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = () => {
    if (!isEligible) return;
    setGameState('PLAYING');
    setCurrentLayer(0);
    setTimeLeft(5.0);

    if (timerRef.current) clearInterval(timerRef.current);

    const startTime = Date.now();
    const duration = 5000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setTimeLeft(Number(remaining.toFixed(1)));

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState((prev) => (prev === 'PLAYING' ? 'TIME_OUT' : prev));
      }
    }, 50);
  };

  const handleStackClick = () => {
    if (gameState !== 'PLAYING') return;

    const nextLayer = currentLayer + 1;
    setCurrentLayer(nextLayer);

    if (nextLayer >= CAKE_LAYERS.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState('SUCCESS');
      setHasPlayedGame(true);

      // Randomize Easter Egg reward for extra fun!
      const codes = ['EASTERBAKE15', 'BAKER20K', 'SECRETBAKE10'];
      const chosen = codes[Math.floor(Math.random() * codes.length)];
      setUnlockedCode(chosen);
    }
  };

  const handleApplyDiscount = () => {
    const res = applyDiscountCode(unlockedCode);
    if (res.success) {
      setApplySuccessMsg(res.message);
    } else {
      setApplySuccessMsg(res.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-amber-200/50 overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-lg">
            <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
            <span>Mini Bake Game: 5 Detik Layer Kue</span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-full hover:bg-amber-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {!isEligible ? (
            /* Locked State for < 100.000 IDR */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-800 shadow-inner">
                <Lock className="h-8 w-8 text-amber-700" />
              </div>

              <div>
                <Badge variant="outline" className="border-amber-500 text-amber-800 bg-amber-50 mb-2">
                  Persyaratan Belanja Belum Terpenuhi
                </Badge>
                <h3 className="text-xl font-bold text-slate-800 font-serif">Kesempatan Main Terkunci</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">
                  Game ini khusus untuk pembelian di atas <span className="font-bold text-amber-900">Rp 100.000</span>.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-left space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Total Keranjang: {formatIDR(subtotal)}</span>
                  <span>Target: {formatIDR(100000)}</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, (subtotal / 100000) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-amber-800 font-medium text-center">
                  Tambah produk senilai <span className="font-bold">{formatIDR(neededAmount)}</span> lagi untuk membuka 1x Kesempatan Main!
                </p>
              </div>

              <Button onClick={onClose} className="w-full bg-amber-800 hover:bg-amber-900 text-white font-semibold">
                Kembali Belanja Roti & Pastry
              </Button>
            </div>
          ) : (
            /* Eligible State: Game Modes */
            <>
              {gameState === 'READY' && (
                <div className="text-center space-y-5 py-2">
                  <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Trophy className="h-8 w-8" />
                  </div>

                  <div>
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 mb-2">
                      1x Kesempatan Bermain Aktif!
                    </Badge>
                    <h3 className="text-2xl font-serif font-bold text-amber-950">Susun 4 Layer Kue!</h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                      Klik tombol susun layer secepat mungkin sebelum waktu 5 detik habis untuk membuka Kode Diskon Easter Egg Rahasia!
                    </p>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center justify-center gap-2 text-xs text-amber-900">
                    <Flame className="h-4 w-4 text-amber-600 animate-bounce" />
                    <span>Hadiah Easter Egg: Diskon hingga 15% / Rp 20.000 untuk pesanan ini!</span>
                  </div>

                  <Button
                    onClick={startGame}
                    className="w-full py-6 text-lg font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-lg hover:shadow-xl transition"
                  >
                    🎮 Mulai Tantangan (5 Detik)
                  </Button>
                </div>
              )}

              {gameState === 'PLAYING' && (
                <div className="text-center space-y-4">
                  {/* Timer & Layer Status */}
                  <div className="flex justify-between items-center bg-amber-100/80 px-4 py-2 rounded-xl border border-amber-300">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <span>Waktu:</span>
                      <span className={`text-xl font-bold font-mono ${timeLeft <= 2 ? 'text-red-600 animate-ping' : 'text-amber-900'}`}>
                        {timeLeft.toFixed(1)}s
                      </span>
                    </div>
                    <div className="text-sm font-bold text-amber-900">
                      Layer: {currentLayer} / {CAKE_LAYERS.length}
                    </div>
                  </div>

                  {/* Cake Display Area */}
                  <div className="relative h-56 bg-slate-50 rounded-2xl border-2 border-dashed border-amber-300 flex flex-col justify-end items-center p-4 overflow-hidden">
                    {/* Cake Plate */}
                    <div className="w-44 h-4 bg-slate-300 rounded-full shadow-md z-10 border border-slate-400"></div>

                    {/* Cake Layers Container */}
                    <div className="absolute bottom-6 flex flex-col-reverse items-center gap-1 w-full px-12 z-20">
                      {CAKE_LAYERS.map((layer, idx) => {
                        const isStacked = idx < currentLayer;
                        if (!isStacked) return null;
                        return (
                          <div
                            key={layer.id}
                            className={`w-full py-2.5 rounded-lg border-2 font-bold text-xs flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-6 duration-150 ${layer.color}`}
                          >
                            <span>{layer.icon}</span>
                            <span>{layer.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stack Button */}
                  <Button
                    onClick={handleStackClick}
                    className="w-full py-8 text-xl font-black bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white shadow-xl rounded-xl"
                  >
                    🥞 SUSUN LAYER ({currentLayer + 1}/{CAKE_LAYERS.length})
                  </Button>
                </div>
              )}

              {gameState === 'TIME_OUT' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">⏰ Waktu Habis!</h3>
                  <p className="text-sm text-slate-600 max-w-xs mx-auto">
                    Kamu belum selesai menyusun kue. Ayo coba lagi secepat kilat!
                  </p>
                  <Button onClick={startGame} className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold">
                    🔄 Coba Lagi
                  </Button>
                </div>
              )}

              {gameState === 'SUCCESS' && (
                <div className="text-center space-y-5 py-2 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Gift className="h-8 w-8 text-emerald-700 animate-bounce" />
                  </div>

                  <div>
                    <Badge className="bg-amber-600 text-white mb-2">🎉 Victory Easter Egg Unlocked!</Badge>
                    <h3 className="text-2xl font-serif font-bold text-amber-950">Selamat! Kue Selesai Disusun!</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Kamu berhasil membuka Kode Diskon Easter Egg berikut:
                    </p>
                  </div>

                  {/* Coupon Box */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-amber-400 p-4 rounded-xl space-y-2">
                    <div className="text-xs text-amber-800 font-medium">KODE DISKON EASTER EGG</div>
                    <div className="text-2xl font-mono font-black text-amber-950 tracking-wider">
                      {unlockedCode}
                    </div>
                    <div className="text-xs text-emerald-700 font-semibold">
                      {unlockedCode === 'EASTERBAKE15' && '✨ Diskon 15% OFF (Potongan langsung)'}
                      {unlockedCode === 'BAKER20K' && '✨ Potongan Langsung Rp 20.000'}
                      {unlockedCode === 'SECRETBAKE10' && '✨ Diskon Rahasia 10% OFF'}
                    </div>
                  </div>

                  {applySuccessMsg ? (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>{applySuccessMsg}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleApplyDiscount}
                        className="w-full py-6 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                      >
                        ⚡ Pasang Kode Diskon Ke Keranjang
                      </Button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(unlockedCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-xs text-slate-500 underline hover:text-slate-700"
                      >
                        {copied ? 'Kode berhasil disalin!' : 'Salin kode secara manual'}
                      </button>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full border-amber-300 text-amber-900 hover:bg-amber-50 font-semibold"
                  >
                    Tutup & Lanjut Ke Checkout
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
