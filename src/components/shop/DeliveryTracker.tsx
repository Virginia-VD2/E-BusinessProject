'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  Truck,
  Scale,
  UtensilsCrossed,
  Home,
  MapPin,
  UserCheck,
  ShieldCheck,
  Play
} from 'lucide-react';
import { updateOrderStatusAction } from '@/actions/checkout';

interface DeliveryTrackerProps {
  orderNumber: string;
  initialStatus: string;
  paymentStatus: string;
  deliverySlot?: string;
  shippingAddress: string;
  requestedWeightKg: number;
  actualWeightKg?: number | null;
}

const STAGES = [
  {
    id: 'PENDING',
    title: 'Pesanan Dibuat',
    desc: 'Menunggu konfirmasi pembayaran',
    icon: Clock,
  },
  {
    id: 'CONFIRMED',
    title: 'Dikonfirmasi',
    desc: 'Seller mengonfirmasi stok ayam',
    icon: CheckCircle2,
  },
  {
    id: 'WEIGHT_VERIFIED',
    title: 'Penimbangan IoT',
    desc: 'Ditimbang presisi dengan skala digital',
    icon: Scale,
  },
  {
    id: 'PROCESSING',
    title: 'Pemotongan & Pengemasan',
    desc: 'Dipotong higienis sesuai instruksi',
    icon: UtensilsCrossed,
  },
  {
    id: 'SHIPPED',
    title: 'Dalam Pengiriman',
    desc: 'Kurir Direct Express Minut OTW',
    icon: Truck,
  },
  {
    id: 'DELIVERED',
    title: 'Tiba di Lokasi',
    desc: 'Diterima hangat & segar di rumah',
    icon: Home,
  },
];

export function DeliveryTracker({
  orderNumber,
  initialStatus,
  paymentStatus,
  deliverySlot = 'Pagi (06:00 - 08:00 WITA)',
  shippingAddress,
  requestedWeightKg,
  actualWeightKg,
}: DeliveryTrackerProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus || 'PENDING');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const getStageIndex = (statusStr: string) => {
    switch (statusStr) {
      case 'CONFIRMED': return 1;
      case 'WEIGHT_VERIFIED': return 2;
      case 'PROCESSING': return 3;
      case 'SHIPPED': return 4;
      case 'DELIVERED': return 5;
      case 'CANCELLED':
      case 'EXPIRED': return -1;
      default: return 0; // PENDING
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  const handleAdvanceStatus = async (nextStatus: string) => {
    setIsUpdating(true);
    setCurrentStatus(nextStatus);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateOrderStatusAction(orderNumber, nextStatus as any);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700/80 space-y-6">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚚</span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Live Monitor Pengantaran Direct Express
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
              Minut Hub Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Lacak status penimbangan, pemotongan, dan pengantaran ayam segar secara real-time.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Slot Delivery:</div>
          <div className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 mt-0.5">
            {deliverySlot}
          </div>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="relative py-2">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {STAGES.map((stage, idx) => {
            const IconComponent = stage.icon;
            const isCompleted = currentIndex > idx;
            const isCurrent = currentIndex === idx;

            return (
              <div
                key={stage.id}
                className={`relative flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-b from-orange-500/20 to-red-500/10 border-orange-500 text-white shadow-lg shadow-orange-900/30 ring-2 ring-orange-500/40'
                    : isCompleted
                    ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold mb-2 transition ${
                    isCurrent
                      ? 'bg-orange-600 text-white animate-bounce'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold leading-tight">{stage.title}</div>
                <div className="text-[10px] mt-1 text-slate-400 line-clamp-2">{stage.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Status Detail Card */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-xl">
              {currentIndex === 4 ? '🛵' : currentIndex === 3 ? '🔪' : currentIndex === 2 ? '⚖️' : currentIndex === 5 ? '🎉' : '⏳'}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status Pengantaran:</div>
              <div className="text-base font-bold text-amber-300">
                {currentIndex === 0 && 'Pesanan diterima. Menunggu verifikasi pembayaran.'}
                {currentIndex === 1 && 'Pesanan telah dikonfirmasi seller Minahasa Utara.'}
                {currentIndex === 2 && 'Proses Timbangan IoT selesai. Berat dihitung presisi.'}
                {currentIndex === 3 && 'Ayam segar sedang dipotong & dikemas higienis.'}
                {currentIndex === 4 && 'Kurir Direct Express sedang di jalan menuju alamat Anda!'}
                {currentIndex === 5 && 'Pesanan telah sampai & diterima dengan segar!'}
              </div>
            </div>
          </div>

          {paymentStatus === 'SETTLEMENT' && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Pembayaran Lunas
            </span>
          )}
        </div>

        {/* Courier & Delivery Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Driver Direct Express:</div>
              <div className="font-bold text-slate-200">Pak Roy (Minut Express)</div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Berat Ditimbang:</div>
              <div className="font-bold text-slate-200">
                {actualWeightKg ? `${actualWeightKg} kg (Akurat)` : `${requestedWeightKg} kg (Estimasi)`}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Alamat Tujuan:</div>
              <div className="font-bold text-slate-200 truncate max-w-[180px]">
                {shippingAddress.replace(/["']/g, '')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Tools for Testing Delivery Process */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Play className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-semibold text-slate-300">Simulasi Alur Pengantaran (Testing):</span>
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          <button
            disabled={isUpdating}
            onClick={() => handleAdvanceStatus('CONFIRMED')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            1. Konfirmasi
          </button>
          <button
            disabled={isUpdating}
            onClick={() => handleAdvanceStatus('WEIGHT_VERIFIED')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            2. Timbang
          </button>
          <button
            disabled={isUpdating}
            onClick={() => handleAdvanceStatus('PROCESSING')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            3. Potong
          </button>
          <button
            disabled={isUpdating}
            onClick={() => handleAdvanceStatus('SHIPPED')}
            className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold transition shadow-sm"
          >
            4. Kirim (OTW)
          </button>
          <button
            disabled={isUpdating}
            onClick={() => handleAdvanceStatus('DELIVERED')}
            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
          >
            5. Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
