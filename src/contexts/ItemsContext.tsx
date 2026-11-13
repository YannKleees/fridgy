import { createContext, useContext, ReactNode } from 'react';
import { useItems as useItemsHook, FridgeItem } from '@/hooks/useItems';

interface ItemsContextType {
  items: FridgeItem[];
  isLoading: boolean;
  addItem: (item: Omit<FridgeItem, 'id' | 'addedAt'>) => Promise<FridgeItem | null>;
  addItems: (items: Omit<FridgeItem, 'id' | 'addedAt'>[]) => Promise<FridgeItem[]>;
  updateItem: (id: string, updates: Partial<FridgeItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getItemsByCategory: (category: string) => FridgeItem[];
  getFavorites: () => FridgeItem[];
  getLowStock: (threshold?: number) => FridgeItem[];
  refetch: () => Promise<void>;
}

const ItemsContext = createContext<ItemsContextType | null>(null);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const itemsData = useItemsHook();

  return (
    <ItemsContext.Provider value={itemsData}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
}
