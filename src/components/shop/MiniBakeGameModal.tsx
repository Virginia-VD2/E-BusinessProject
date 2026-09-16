'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/use-cart-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, Lock, X, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';

interface MiniBakeGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const VELOURS_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Bahan utama apa yang digunakan Velours Patisserie untuk membuat tekstur pastry renyah dan harum khas Prancis?',
    options: ['Margarin Olahan', 'Normandy Butter Asli Prancis', 'Minyak Kelapa Sawit', 'Mentega Putih'],
    correctIndex: 1,
    explanation: 'Velours Patisserie menggunakan Normandy Butter impor khas Prancis untuk cita rasa autentik!',
  },
  {
    id: 2,
    question: 'Teknik ragi & adonan apa yang dipakai Velours Patisserie untuk memanggang roti segar setiap pagi?',
    options: ['Sourdough Fermentation (Fermentasi Alami)', 'Baking Powder Instan', 'Pengembang Sintetis', 'Ragi Kimia Tinggi'],
    correctIndex: 0,
    explanation: 'Seluruh roti kami dibuat menggunakan teknik Sourdough Fermentation alami tanpa bahan pengawet.',
  },
  {
    id: 3,
    question: 'Berapa batas minimal total belanja di Velours Patisserie untuk membuka kesempatan main Mini Game & diskon rahasia?',
    options: ['Rp 50.000', 'Rp 75.000', 'Rp 100.000', 'Rp 250.000'],
    correctIndex: 2,
    explanation: 'Tepat sekali! Pembelian di atas Rp 100.000 memberikan 1x kesempatan main.',
  },
];

export function MiniBakeGameModal({ isOpen, onClose }: MiniBakeGameModalProps) {
  const { totalPrice, applyDiscountCode, appliedDiscount, hasPlayedGame, setHasPlayedGame } = useCartStore();

  const subtotal = totalPrice();
  const isEligible = subtotal >= 100000;
  const neededAmount = Math.max(0, 100000 - subtotal);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'READY' | 'QUIZ' | 'RESULT' | 'ALREADY_PLAYED'>('READY');
  const [unlockedCode, setUnlockedCode] = useState('EASTERBAKE15');
  const [applySuccessMsg, setApplySuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  useEffect(() => {
    if (isOpen) {
      if (hasPlayedGame) {
        setGameState('ALREADY_PLAYED');
      } else {
        setGameState('READY');
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setScore(0);
        setApplySuccessMsg('');
        setCopied(false);
      }
    }
  }, [isOpen, hasPlayedGame]);

  const handleStartQuiz = () => {
    if (!isEligible || hasPlayedGame) return;
    setGameState('QUIZ');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
  };

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null) return; // Prevent double selection
    setSelectedOption(index);

    const isCorrect = index === VELOURS_QUESTIONS[currentQuestionIndex].correctIndex;
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    // Auto advance after 1.2 seconds
    setTimeout(() => {
      if (currentQuestionIndex + 1 < VELOURS_QUESTIONS.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        // Quiz Finished - Mark as Played (1x chance limit per payment session)
        setHasPlayedGame(true);
        setGameState('RESULT');

        // Choose Easter Egg Code based on score
        if (newScore >= 2) {
          const codes = ['EASTERBAKE15', 'BAKER20K'];
          setUnlockedCode(codes[Math.floor(Math.random() * codes.length)]);
        } else {
          setUnlockedCode('SECRETBAKE10');
        }
      }
    }, 1200);
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

  const currentQ = VELOURS_QUESTIONS[currentQuestionIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-amber-200/60 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-orange-950 text-amber-50 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-lg">
            <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
            <span>Kuis Seputar Velours Patisserie</span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-full hover:bg-amber-800/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {!isEligible ? (
            /* Locked State for < 100.000 IDR */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-800 shadow-inner">
                <Lock className="h-8 w-8 text-amber-700" />
              </div>

              <div>
                <Badge variant="outline" className="border-amber-500 text-amber-800 bg-amber-50 mb-2">
                  Syarat Belanja Belum Terpenuhi
                </Badge>
                <h3 className="text-xl font-bold text-slate-800 font-serif">Kuis Seputar Velours Terkunci</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">
                  Kuis ini khusus untuk pembelian di atas <span className="font-bold text-amber-900">Rp 100.000</span> (Hanya 1x kesempatan bermain sebelum pembayaran).
                </p>
              </div>

              {/* Progress Bar */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-left space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Keranjang Saat Ini: {formatIDR(subtotal)}</span>
                  <span>Target: {formatIDR(100000)}</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, (subtotal / 100000) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-amber-800 font-medium text-center">
                  Tambah pastry senilai <span className="font-bold">{formatIDR(neededAmount)}</span> lagi untuk membuka 1x Kesempatan Kuis!
                </p>
              </div>

              <Button onClick={onClose} className="w-full bg-amber-900 hover:bg-amber-950 text-white font-semibold">
                Kembali Belanja Pastry
              </Button>
            </div>
          ) : gameState === 'ALREADY_PLAYED' ? (
            /* State when user has ALREADY played their 1x chance */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-8 w-8 text-amber-700" />
              </div>

              <div>
                <Badge className="bg-amber-800 text-white mb-2">1x Kesempatan Main Telah Digunakan</Badge>
                <h3 className="text-2xl font-serif font-bold text-amber-950">Terima Kasih Sudah Mengikuti Kuis!</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">
                  Anda sudah menggunakan 1x kesempatan main untuk pesanan ini sebelum melakukan pembayaran.
                </p>
              </div>

              {appliedDiscount ? (
                <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl space-y-1 text-emerald-900">
                  <div className="text-xs font-semibold">VOUCHER DISKON TERPASANG</div>
                  <div className="text-xl font-mono font-bold">{appliedDiscount.code}</div>
                  <div className="text-xs">{appliedDiscount.description}</div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-1 text-amber-900">
                  <div className="text-xs font-semibold">KODE DISKON EASTER EGG ANDA</div>
                  <div className="text-xl font-mono font-bold text-amber-950">{unlockedCode}</div>
                  <Button onClick={handleApplyDiscount} size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    Pasang Kode Ini
                  </Button>
                </div>
              )}

              <Button onClick={onClose} className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold">
                Tutup & Lanjut Ke Pembayaran
              </Button>
            </div>
          ) : (
            /* Active Game States */
            <>
              {gameState === 'READY' && (
                <div className="text-center space-y-5 py-2">
                  <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <HelpCircle className="h-8 w-8" />
                  </div>

                  <div>
                    <Badge className="bg-emerald-600 text-white mb-2">
                      1x Kesempatan Bermain Aktif!
                    </Badge>
                    <h3 className="text-2xl font-serif font-bold text-amber-950">Kuis Seputar Velours</h3>
                    <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                      Jawab 3 pertanyaan seputar kelezatan roti & pastry Velours Patisserie untuk membuka Kode Diskon Easter Egg Rahasia!
                    </p>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center justify-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                      <span>Catatan Penting:</span>
                    </div>
                    <p>Kuis ini hanya dapat dimainkan **1x kesempatan** sebelum melakukan pembayaran.</p>
                  </div>

                  <Button
                    onClick={handleStartQuiz}
                    className="w-full py-6 text-lg font-bold bg-amber-900 hover:bg-amber-950 text-white shadow-lg hover:shadow-xl transition"
                  >
                    🧠 Mulai Kuis Seputar Velours
                  </Button>
                </div>
              )}

              {gameState === 'QUIZ' && (
                <div className="space-y-5">
                  {/* Progress Header */}
                  <div className="flex justify-between items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
                    <span>Pertanyaan {currentQuestionIndex + 1} dari {VELOURS_QUESTIONS.length}</span>
                    <span>Skor: {score}</span>
                  </div>

                  {/* Question Title */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-base font-bold text-slate-800 font-serif leading-snug">
                      {currentQ.question}
                    </h4>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {currentQ.options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === currentQ.correctIndex;

                      let btnStyle = 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-800';
                      if (selectedOption !== null) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-red-100 border-red-500 text-red-950 font-bold';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={selectedOption !== null}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between text-sm ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>
                          {selectedOption !== null && isCorrect && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption !== null && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 animate-in fade-in duration-200">
                      <strong>Penjelasan:</strong> {currentQ.explanation}
                    </div>
                  )}
                </div>
              )}

              {gameState === 'RESULT' && (
                <div className="text-center space-y-5 py-2 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Trophy className="h-8 w-8 text-emerald-700 animate-bounce" />
                  </div>

                  <div>
                    <Badge className="bg-amber-800 text-white mb-2">Kuis Selesai!</Badge>
                    <h3 className="text-2xl font-serif font-bold text-amber-950">
                      Skor Anda: {score} / {VELOURS_QUESTIONS.length}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {score >= 2
                        ? 'Luar biasa! Anda sangat mengenal kualitas Velours Patisserie!'
                        : 'Terima kasih telah mengikuti kuis Velours Patisserie!'}
                    </p>
                  </div>

                  {/* Coupon Box */}
                  <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-dashed border-amber-400 p-4 rounded-xl space-y-2">
                    <div className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                      🎁 KODE DISKON EASTER EGG UNLOCKED
                    </div>
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
