import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { receiptStats } from '@/lib/receipts';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  price?: number;
}

export interface ReceiptHistory {
  id: string;
  user_id: string;
  scanned_at: string;
  total_amount: number | null;
  store_name: string | null;
  items: ReceiptItem[];
  recipe_name: string | null;
  created_at: string;
}

export function useReceiptHistory() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReceipts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('receipt_history')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false });

      if (error) throw error;

      // Parse JSONB items field
      const parsedReceipts = (data || []).map(receipt => ({
        ...receipt,
        items: Array.isArray(receipt.items) ? receipt.items as unknown as ReceiptItem[] : [],
      }));

      setReceipts(parsedReceipts);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Failed to load receipt history');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const addReceipt = useCallback(async (receipt: {
    total_amount?: number;
    store_name?: string;
    items: ReceiptItem[];
    recipe_name?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('receipt_history')
        .insert([{
          user_id: user.id,
          total_amount: receipt.total_amount || null,
          store_name: receipt.store_name || null,
          items: JSON.parse(JSON.stringify(receipt.items)),
          recipe_name: receipt.recipe_name || null,
        }]);

      if (error) throw error;

      await fetchReceipts();
      toast.success('Receipt saved');
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast.error('Failed to save receipt');
    }
  }, [user, fetchReceipts]);

  const deleteReceipt = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('receipt_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReceipts(prev => prev.filter(r => r.id !== id));
      toast.success('Receipt deleted');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast.error('Failed to delete receipt');
    }
  }, []);

  const stats = receiptStats(receipts);

  return {
    receipts,
    isLoading,
    addReceipt,
    deleteReceipt,
    stats,
    refetch: fetchReceipts,
  };
}
