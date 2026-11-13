import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  imageUrl?: string;
  isFavorite: boolean;
  addedAt: string;
}

interface DbFridgeItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
  image_url: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

function mapDbToFridgeItem(db: DbFridgeItem): FridgeItem {
  return {
    id: db.id,
    name: db.name,
    quantity: db.quantity,
    unit: db.unit,
    category: db.category,
    expiryDate: db.expiry_date || undefined,
    imageUrl: db.image_url || undefined,
    isFavorite: db.is_favorite,
    addedAt: db.created_at,
  };
}

export function useItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to always have access to current items in callbacks
  const itemsRef = useRef<FridgeItem[]>([]);
  itemsRef.current = items;

  // Fetch items from database
  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems((data as DbFridgeItem[]).map(mapDbToFridgeItem));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // updateItem must be defined before addItem and addItems since they depend on it
  const updateItem = useCallback(async (id: string, updates: Partial<FridgeItem>) => {
    const currentItems = itemsRef.current;
    const currentItem = currentItems.find(i => i.id === id);
    if (!currentItem) return;

    // Check if renaming to an existing item's name (case-insensitive)
    if (updates.name !== undefined) {
      const existingItem = currentItems.find(
        i => i.id !== id && i.name.toLowerCase() === updates.name!.toLowerCase()
      );
      
      if (existingItem) {
        // Merge: add current item's quantity to existing item, then delete current
        const newQuantity = existingItem.quantity + (updates.quantity ?? currentItem.quantity);
        
        // Update existing item's quantity
        const { error: updateError } = await supabase
          .from('fridge_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error('Error merging items:', updateError);
          return;
        }

        // Delete the current item
        const { error: deleteError } = await supabase
          .from('fridge_items')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('Error deleting merged item:', deleteError);
          return;
        }

        // Update local state: update existing item's quantity and remove current item
        setItems(prev => 
          prev
            .map(item => item.id === existingItem.id ? { ...item, quantity: newQuantity } : item)
            .filter(item => item.id !== id)
        );
        return;
      }
    }

    // Standard update (no merge needed)
    const dbUpdates: Partial<DbFridgeItem> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate || null;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl || null;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;

    const { error } = await supabase
      .from('fridge_items')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating item:', error);
      return;
    }

    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }, []);

  const addItem = useCallback(async (item: Omit<FridgeItem, 'id' | 'addedAt'>) => {
    if (!user) return null;

    // Use ref to get current items (avoids stale closure)
    const currentItems = itemsRef.current;
    
    // Check if item with same name already exists (case-insensitive)
    const existingItem = currentItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
    
    if (existingItem) {
      // Update quantity of existing item
      const newQuantity = existingItem.quantity + item.quantity;
      await updateItem(existingItem.id, { quantity: newQuantity });
      return { ...existingItem, quantity: newQuantity };
    }

    const { data, error } = await supabase
      .from('fridge_items')
      .insert({
        user_id: user.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiry_date: item.expiryDate || null,
        image_url: item.imageUrl || null,
        is_favorite: item.isFavorite,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
      return null;
    }

    const newItem = mapDbToFridgeItem(data as DbFridgeItem);
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, [user, updateItem]);

  const addItems = useCallback(async (newItems: Omit<FridgeItem, 'id' | 'addedAt'>[]) => {
    if (!user || newItems.length === 0) return [];

    // Use ref to get current items (avoids stale closure)
    const currentItems = itemsRef.current;

    const itemsToUpdate: { id: string; quantity: number }[] = [];
    const itemsToInsert: typeof newItems = [];

    // Separate items into updates (existing) and inserts (new)
    for (const item of newItems) {
      const existingItem = currentItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
      if (existingItem) {
        itemsToUpdate.push({
          id: existingItem.id,
          quantity: existingItem.quantity + Math.round(item.quantity),
        });
      } else {
        itemsToInsert.push(item);
      }
    }

    // Update existing items
    for (const update of itemsToUpdate) {
      await updateItem(update.id, { quantity: update.quantity });
    }

    // Insert new items
    if (itemsToInsert.length > 0) {
      const dbItemsToInsert = itemsToInsert.map(item => ({
        user_id: user.id,
        name: item.name,
        quantity: Math.round(item.quantity),
        unit: item.unit,
        category: item.category,
        expiry_date: item.expiryDate || null,
        image_url: item.imageUrl || null,
        is_favorite: item.isFavorite,
      }));

      const { data, error } = await supabase
        .from('fridge_items')
        .insert(dbItemsToInsert)
        .select();

      if (error) {
        console.error('Error adding items:', error);
        return [];
      }

      const addedItems = (data as DbFridgeItem[]).map(mapDbToFridgeItem);
      setItems(prev => [...addedItems, ...prev]);
      return addedItems;
    }

    return [];
  }, [user, updateItem]);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('fridge_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      return;
    }

    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback(async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + delta);
    await updateItem(id, { quantity: newQuantity });
  }, [items, updateItem]);

  const toggleFavorite = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    await updateItem(id, { isFavorite: !item.isFavorite });
  }, [items, updateItem]);

  const getItemsByCategory = useCallback((category: string) => {
    return items.filter(item => item.category === category);
  }, [items]);

  const getFavorites = useCallback(() => {
    return items.filter(item => item.isFavorite);
  }, [items]);

  const getLowStock = useCallback((threshold: number = 2) => {
    return items.filter(item => item.quantity <= threshold);
  }, [items]);

  return {
    items,
    isLoading,
    addItem,
    addItems,
    updateItem,
    deleteItem,
    updateQuantity,
    toggleFavorite,
    getItemsByCategory,
    getFavorites,
    getLowStock,
    refetch: fetchItems,
  };
}
