'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { deleteProductAction } from '@/actions/admin';
import { Trash2 } from 'lucide-react';

export function DeleteProductButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      await deleteProductAction(id);
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
