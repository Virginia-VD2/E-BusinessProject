'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/shop/Header';
import { useCartStore } from '@/stores/use-cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  Zap,
  Clock,
  MapPin,
  Building2,
  UserCheck,
  Plus,
} from 'lucide-react';
import {
  BASE_PRICE_PER_KG,
  calculateDynamicPricing,
  calculateDeliveryFee,
  generateB2bQuotation,
  CUT_OPTIONS_LIST,
  DELIVERY_SLOTS,
} from '@/lib/ayamaja-services';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestionItem?: {
    name: string;
    weightKg: number;
    price: number;
    cutType: string;
    crossSellItem?: string;
  };
  b2bQuotation?: {
    quotationNumber: string;
    kg: number;
    pricePerKg: number;
    total: number;
    tier: string;
  };
}

const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/_/g, '')
    .replace(/#{1,6}\s?/g, '');
};

const SAMPLE_PROMPTS = [
  'Mau ayam 2 kg potong 10, antar besok jam 7 pagi WITA...',
  'Bantu buatkan quotation grosir 50 kg untuk Warung Makan Airmadidi',
  'Cari dada ayam fillet 1.5 kg untuk diet protein',
  'Ayam utuh 3 ekor untuk acara keluarga di Kalawat',
];

const AYAMAJA_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Ayam Broiler Segar (Per Kg)',
    category: 'AYAM_SEGAR',
    pricePerKg: 36000,
    stockKg: 150,
    image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
    description: 'Dipotong fresh setiap jam 04:00 WITA dari peternakan lokal Minahasa Utara.',
  },
  {
    id: 'prod-2',
    name: 'Dada Ayam Fillet Segar',
    category: 'PART_CUT',
    pricePerKg: 48000,
    stockKg: 45,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    description: '100% daging dada tanpa tulang & lemak. Tinggi protein.',
  },
  {
    id: 'prod-3',
    name: 'Paha Ayam Segar (Paha Atas & Bawah)',
    category: 'PART_CUT',
    pricePerKg: 42000,
    stockKg: 60,
    image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80',
    description: 'Juicy, gurih, dan tekstur empuk pas untuk goreng & bakar.',
  },
  {
    id: 'prod-4',
    name: 'Hati & Ampela Ayam Segar (Per Pasang)',
    category: 'JEROAN',
    pricePerKg: 20000,
    stockKg: 30,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    description: 'Pilihan jeroan ayam bersih & segar per pasang.',
  },
];

export default function HomePage() {
  const { addItem } = useCartStore();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [userMode, setUserMode] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');
  const [selectedCut, setSelectedCut] = useState('POTONG_10');
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0].slotName);
  const [distance] = useState(3.5); // Km Airmadidi/Kalawat

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Halo! Saya AYAMAJA, asisten belanja ayam segar pribadi Anda di Minahasa Utara. 👋\n\nKamu bilang butuh apa, AYAMAJA yang mengurus sisanya! Silakan ketik atau gunakan perintah suara di bawah.',
      timestamp: 'Baru saja',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceClick = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate Voice Input Recognition
      setTimeout(() => {
        setInputText('Mau ayam 2.5 kg potong 10, tambahkan hati ampela 2 pasang antar besok pagi...');
        setIsListening(false);
      }, 2500);
    }
  };

  const handleSendMessage = (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');

    // AI Intelligent Parsing & Response Logic
    setTimeout(() => {
      const lower = textToSend.toLowerCase();

      // Case 1: B2B Quotation Bulk Request
      if (lower.includes('quotation') || lower.includes('grosir') || lower.includes('warung') || lower.includes('50 kg') || lower.includes('100 kg')) {
        const kg = lower.includes('100') ? 100 : lower.includes('50') ? 50 : 25;
        const quo = generateB2bQuotation(kg, 'Warung Kuliner Minut');

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Siap! Saya telah men-generate Draft AI Quotation B2B khusus usaha Anda.\n\n` + quo.aiRecommendation,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          b2bQuotation: {
            quotationNumber: quo.quotationNumber,
            kg: quo.requestedKg,
            pricePerKg: quo.finalPricePerKg,
            total: quo.estimatedSubtotal,
            tier: quo.tierLabel,
          },
        };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }

      // Case 2: Natural Order Parsing (e.g. 2kg potong 10)
      const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*kg/);
      const kgVal = kgMatch ? parseFloat(kgMatch[1]) : 2.0;

      const dynamicPricing = calculateDynamicPricing(BASE_PRICE_PER_KG, kgVal);
      const deliveryInfo = calculateDeliveryFee(distance, selectedSlot);

      const aiReplyText =
        `Siap, saya paham! 🐓\n\n` +
        `Saya siapkan Ayam Broiler Segar (${kgVal} kg) dengan pilihan potongan ${selectedCut.replace('_', ' ')}.\n` +
        `• Est. Harga Daging: Rp ${dynamicPricing.estimatedPrice.toLocaleString('id-ID')} (Rp ${BASE_PRICE_PER_KG.toLocaleString('id-ID')}/kg)\n` +
        `• Ongkir (${deliveryInfo.zone}): Rp ${deliveryInfo.fee.toLocaleString('id-ID')}\n` +
        `• Slot Pengiriman: ${selectedSlot}\n\n` +
        `💡 Rekomendasi AI Cart: Apakah Anda mau menambahkan 2 pasang Hati & Ampela Segar (+Rp 8.000) untuk melengkapi olahan Anda?`;

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestionItem: {
          name: `Ayam Segar (${kgVal} kg)`,
          weightKg: kgVal,
          price: dynamicPricing.estimatedPrice,
          cutType: selectedCut,
          crossSellItem: 'Hati & Ampela Segar (2 Pasang)',
        },
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 900);
  };

  const handleAddToCartFromAI = (item: { name: string; price: number; weightKg: number }) => {
    addItem({
      id: `ai-item-${Date.now()}`,
      name: `${item.name} [${selectedCut}]`,
      price: item.price,
      image: AYAMAJA_PRODUCTS[0].image,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-confirm-${Date.now()}`,
        sender: 'ai',
        text: `${item.name} berhasil dimasukkan ke keranjang belanja Anda! Klik keranjang di kanan atas untuk lanjut checkout.`,
        timestamp: 'Baru saja',
      },
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      {/* Hero Section Wajah AI */}
      <section className="relative bg-gradient-to-br from-red-700 via-red-800 to-orange-900 text-white py-12 px-4 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6 text-center relative z-10">
          <Badge className="bg-amber-400 text-slate-950 font-bold px-3 py-1 text-xs sm:text-sm hover:bg-amber-300">
            ⚡ Platform Belanja Ayam Segar #1 Minahasa Utara
          </Badge>

          <h1 className="font-extrabold text-3xl sm:text-5xl tracking-tight leading-tight">
            &quot;Kamu bilang butuh apa, <span className="text-amber-300 underline underline-offset-4">AYAMAJA</span> yang mengurus sisanya.&quot;
          </h1>

          <p className="text-red-100 text-sm sm:text-lg max-w-2xl mx-auto">
            Beli ayam potong fresh 04:00 WITA, pilih jenis potongan (Potong 4, 8, 10, Geprek), dan nikmati pengantaran kilat ke Airmadidi, Kalawat, Kauditan & sekitarnya.
          </p>

          {/* Mode Toggle: Personal vs B2B */}
          <div className="inline-flex bg-red-950/60 p-1.5 rounded-2xl border border-red-500/40 gap-1 shadow-inner">
            <button
              onClick={() => setUserMode('PERSONAL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${
                userMode === 'PERSONAL'
                  ? 'bg-white text-red-700 shadow-md'
                  : 'text-red-200 hover:text-white'
              }`}
            >
              <UserCheck className="h-4 w-4" /> Mode Konsumen / Rumah Tangga
            </button>

            <button
              onClick={() => setUserMode('BUSINESS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${
                userMode === 'BUSINESS'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-red-200 hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4" /> Mode B2B (Warung / Resto / Grosir)
            </button>
          </div>

          {/* Big CTA Button */}
          <div>
            <a href="#ai-assistant">
              <Button
                size="lg"
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg sm:text-xl py-7 px-8 rounded-2xl shadow-2xl hover:scale-105 transition-transform gap-3 border-2 border-amber-200"
              >
                <Sparkles className="h-6 w-6 text-red-700 animate-spin" /> BANTU SAYA BELI AYAM SEKARANG
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Main Interactive AI Interface */}
      <main className="flex-1 container mx-auto px-4 py-10 space-y-12 max-w-5xl">
        {/* Section 1: AI Chat Shopping Assistant */}
        <section id="ai-assistant" className="space-y-4 scroll-mt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-red-600 text-white rounded-xl shadow">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-xl sm:text-2xl text-slate-900">
                  AYAMAJA AI Shopping Assistant
                </h2>
                <p className="text-xs text-slate-500">
                  Ketik atau gunakan suara dalam bahasa sehari-hari. AI akan memproses estimasi harga & potongan.
                </p>
              </div>
            </div>

            <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 hidden sm:flex items-center gap-1 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span> Live Stock Minut Ready
            </Badge>
          </div>

          {/* Natural Language Prompt Chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Contoh Perintah:
            </span>
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-300 px-3 py-1.5 rounded-full transition shadow-sm font-medium"
              >
                &quot;{prompt}&quot;
              </button>
            ))}
          </div>

          {/* Chat Window Container */}
          <Card className="border-2 border-red-100 shadow-xl rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              {/* Message List */}
              <div className="h-[380px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center shrink-0 shadow">
                        🐓
                      </div>
                    )}

                    <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-red-600 text-white rounded-br-none shadow-md font-medium'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <div className="whitespace-pre-line">{stripMarkdown(msg.text)}</div>

                        {/* AI Cross-selling & Cart Suggestion UI */}
                        {msg.suggestionItem && (
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                            <div className="bg-red-50 p-3 rounded-xl border border-red-200 flex items-center justify-between">
                              <div>
                                <div className="font-bold text-red-950 text-sm">{msg.suggestionItem.name}</div>
                                <div className="text-xs text-red-700 font-semibold">
                                  Est. Harga: Rp {msg.suggestionItem.price.toLocaleString('id-ID')}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddToCartFromAI(msg.suggestionItem!)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold shadow"
                              >
                                <Plus className="h-4 w-4 mr-1" /> Tambah Ke Keranjang
                              </Button>
                            </div>

                            {msg.suggestionItem.crossSellItem && (
                              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-950">
                                <span>💡 <strong>AI Cross-Sell</strong>: {msg.suggestionItem.crossSellItem}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    addItem({
                                      id: 'prod-4',
                                      name: 'Hati & Ampela Segar (2 Pasang)',
                                      price: 8000,
                                      image: AYAMAJA_PRODUCTS[3].image,
                                    })
                                  }
                                  className="border-amber-400 hover:bg-amber-100 text-amber-950 text-xs font-bold"
                                >
                                  + Rp 8.000
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* B2B Quotation Draft Card */}
                        {msg.b2bQuotation && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-xs text-amber-300 font-bold">
                                <span>DRAFT QUOTATION B2B #{msg.b2bQuotation.quotationNumber}</span>
                                <Badge className="bg-amber-400 text-slate-950">{msg.b2bQuotation.tier}</Badge>
                              </div>
                              <div className="text-lg font-extrabold">
                                {msg.b2bQuotation.kg} kg Ayam Segar @ Rp {msg.b2bQuotation.pricePerKg.toLocaleString('id-ID')}/kg
                              </div>
                              <div className="text-xs text-slate-300">
                                Est. Total Grosir: <strong className="text-white text-base">Rp {msg.b2bQuotation.total.toLocaleString('id-ID')}</strong>
                              </div>
                              <Button
                                onClick={() =>
                                  addItem({
                                    id: `quo-${msg.b2bQuotation?.quotationNumber}`,
                                    name: `B2B Bulk Order (${msg.b2bQuotation?.kg} kg)`,
                                    price: msg.b2bQuotation?.total || 0,
                                    image: AYAMAJA_PRODUCTS[0].image,
                                  })
                                }
                                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold mt-2"
                              >
                                Terima Quotation & Pesan Grosir
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 px-1">{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Controls Bar: Cut Selection & Slot Selection */}
              <div className="bg-slate-100 p-3 px-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Pilihan Potongan:</span>
                  <select
                    value={selectedCut}
                    onChange={(e) => setSelectedCut(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-red-700 focus:outline-none"
                  >
                    {CUT_OPTIONS_LIST.map((cut) => (
                      <option key={cut.type} value={cut.type}>
                        {cut.icon} {cut.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-orange-600" /> Slot Pengantaran:
                  </span>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none"
                  >
                    {DELIVERY_SLOTS.map((slot) => (
                      <option key={slot.slotName} value={slot.slotName}>
                        {slot.slotName} ({slot.timeRange})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input & Voice Ordering Form */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  className={`p-3 rounded-xl transition ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse shadow-lg'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                  title={isListening ? 'Mendengarkan suara...' : 'Gunakan Suara (Voice Ordering)'}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    isListening
                      ? 'Silakan bicara sekarang (misal: Mau ayam 2 kg potong 10)...'
                      : 'Tulis pesanan dalam bahasa sehari-hari (contoh: Mau ayam 2.5 kg potong 8)...'
                  }
                  className="flex-1 bg-slate-50 border-slate-200 py-5 text-sm rounded-xl focus:bg-white"
                />

                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() && !isListening}
                  className="bg-red-600 hover:bg-red-700 text-white py-5 px-5 rounded-xl font-bold shadow"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Pilihan Potongan Daging (Cut Options Guide) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">
                Pilihan Jenis Potongan Ayam Segar
              </h3>
              <p className="text-xs text-slate-500">
                Semua ayam dipotong higienis oleh jagal berpengalaman di Minahasa Utara.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CUT_OPTIONS_LIST.map((cut) => (
              <div
                key={cut.type}
                onClick={() => setSelectedCut(cut.type)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all shadow-sm ${
                  selectedCut === cut.type
                    ? 'bg-red-50 border-red-600 ring-2 ring-red-400/30'
                    : 'bg-white border-slate-200 hover:border-red-300'
                }`}
              >
                <div className="text-2xl mb-1">{cut.icon}</div>
                <div className="font-bold text-sm text-slate-900">{cut.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-tight">{cut.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Katalog Produk Ayam Segar */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b pb-3">
            <div>
              <h3 className="font-extrabold text-2xl text-slate-900 font-serif">
                Katalog Produk Ayam Segar Hari Ini
              </h3>
              <p className="text-xs text-slate-500">
                Stok diperbarui realtime dari peternakan lokal Minahasa Utara.
              </p>
            </div>
            <Badge className="bg-red-600 text-white font-bold">Harga Pasar: Rp 36.000 / kg</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {AYAMAJA_PRODUCTS.map((product) => (
              <Card key={product.id} className="overflow-hidden border border-slate-200 hover:shadow-xl transition group">
                <div className="relative h-44 bg-slate-200 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 right-3 bg-red-600 text-white font-bold text-[11px]">
                    Stok: {product.stockKg} kg
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 group-hover:text-red-700 transition">
                      {product.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Harga / kg</span>
                      <div className="text-lg font-black text-red-700">
                        Rp {product.pricePerKg.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() =>
                        addItem({
                          id: product.id,
                          name: `${product.name} [${selectedCut}]`,
                          price: product.pricePerKg * 2, // Est. 2kg default
                          image: product.image,
                        })
                      }
                      className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      + 2 kg
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 4: Mengapa Memilih AYAMAJA */}
        <section className="bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 p-6 sm:p-8 rounded-2xl border border-red-200 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-red-600 text-white rounded-xl shadow shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Potong Fresh Jam 04.00 WITA</h4>
              <p className="text-xs text-slate-600 mt-1">Ayam potong segar dari peternakan lokal Minahasa Utara setiap subuh.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-3 bg-orange-600 text-white rounded-xl shadow shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Flexible Weight & Pricing</h4>
              <p className="text-xs text-slate-600 mt-1">Harga dihitung akurat berdasarkan berat riil penimbangan jagal.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-600 text-white rounded-xl shadow shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Pengantaran Cepat Minut</h4>
              <p className="text-xs text-slate-600 mt-1">Jangkauan pengantaran Airmadidi, Kalawat, Kauditan, hingga Dimembe.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 text-center text-xs text-slate-500">
        <div className="container mx-auto px-4 space-y-2">
          <div className="font-extrabold text-red-700 text-base">AYAMAJA</div>
          <p>© {new Date().getFullYear()} AYAMAJA - Platform Asisten Belanja Ayam Segar Minahasa Utara.</p>
        </div>
      </footer>
    </div>
  );
}
