/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { upsertProductAction } from '@/actions/admin';
import { Plus, Edit2 } from 'lucide-react';

export function ProductFormModal({ existingProduct }: { existingProduct?: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (existingProduct?.id) {
      formData.append('id', existingProduct.id as string);
    }

    await upsertProductAction(formData);
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={existingProduct ? "outline" : "default"}
        size={existingProduct ? "icon" : "default"}
        onClick={() => setIsOpen(true)}
      >
        {existingProduct ? <Edit2 className="h-4 w-4" /> : <><Plus className="h-4 w-4 mr-2" /> Tambah Produk</>}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{existingProduct ? 'Edit Produk Ayam' : 'Tambah Produk Ayam Segar'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nama Produk</label>
                <Input name="name" required defaultValue={existingProduct?.name as any} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Kategori</label>
                <Input name="category" required defaultValue={(existingProduct?.category as any) || 'AYAM_SEGAR'} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Deskripsi</label>
                <Input name="description" required defaultValue={existingProduct?.description as any} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Harga / Kg (IDR)</label>
                  <Input type="number" name="pricePerKg" required defaultValue={(existingProduct?.pricePerKg || existingProduct?.price) as any} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Stok (Kg)</label>
                  <Input type="number" step="0.5" name="stockKg" required defaultValue={(existingProduct?.stockKg || existingProduct?.stock) as any} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Foto Produk</label>
                <Input type="file" name="image" accept="image/*" />
                {(existingProduct as any)?.images?.[0] && (
                  <p className="text-xs text-muted-foreground mt-1">Biarkan kosong jika tidak ingin mengubah foto.</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Simpan...' : 'Simpan Produk'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
