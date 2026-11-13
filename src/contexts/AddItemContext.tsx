import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AddItemModal } from '@/components/AddItemModal';
import { useItems } from '@/contexts/ItemsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AddItemContextType {
  openAddModal: () => void;
}

const AddItemContext = createContext<AddItemContextType | null>(null);

export function AddItemProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { addItem, addItems } = useItems();
  const { user } = useAuth();

  const openAddModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleSaveReceipt = useCallback(async (
    items: { name: string; quantity: number; category: string; price?: number }[],
    total?: number
  ) => {
    if (!user) return;

    const { error } = await supabase.from('receipt_history').insert({
      user_id: user.id,
      items: items,
      total_amount: total || null,
    });

    if (error) {
      console.error('Error saving receipt:', error);
      toast.error('Items were added, but the receipt could not be saved to your history.');
    }
  }, [user]);

  return (
    <AddItemContext.Provider value={{ openAddModal }}>
      {children}
      <AddItemModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddItem={addItem}
        onAddItems={addItems}
        onSaveReceipt={handleSaveReceipt}
      />
    </AddItemContext.Provider>
  );
}

export function useAddItem() {
  const context = useContext(AddItemContext);
  if (!context) {
    throw new Error('useAddItem must be used within an AddItemProvider');
  }
  return context;
}
