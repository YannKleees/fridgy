import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ShoppingItem, Recipe } from '@/types/recipe';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShoppingListContextType {
  shoppingList: ShoppingItem[];
  addToShoppingList: (recipe: Recipe) => void;
  addItemToShoppingList: (itemName: string, source?: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeFromShoppingList: (id: string) => void;
  clearCheckedItems: () => void;
  clearShoppingList: () => void;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const { user } = useAuth();

  // Fetch shopping list from database
  useEffect(() => {
    if (!user) {
      setShoppingList([]);
      return;
    }

    const fetchShoppingList = async () => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shopping list:', error);
        return;
      }

      setShoppingList(data.map(item => ({
        id: item.id,
        name: item.name,
        checked: item.checked,
        recipeId: 'db',
        recipeName: item.source || 'Manual',
      })));
    };

    fetchShoppingList();
  }, [user]);

  const addToShoppingList = useCallback(async (recipe: Recipe) => {
    if (!user) return;

    const newItems = recipe.missingIngredients.map(ingredient => ({
      user_id: user.id,
      name: ingredient,
      source: recipe.name,
    }));

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert(newItems)
      .select();

    if (error) {
      return;
    }

    setShoppingList(prev => [
      ...data.map(item => ({
        id: item.id,
        name: item.name,
        checked: item.checked,
        recipeId: 'db',
        recipeName: item.source || 'Manual',
      })),
      ...prev,
    ]);
  }, [user]);

  const addItemToShoppingList = useCallback(async (itemName: string, source: string = 'Manual') => {
    if (!user) return;

    // Check if already exists
    const exists = shoppingList.some(item => item.name.toLowerCase() === itemName.toLowerCase());
    if (exists) return;

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({ user_id: user.id, name: itemName, source })
      .select()
      .single();

    if (error) return;

    setShoppingList(prev => [{
      id: data.id,
      name: data.name,
      checked: data.checked,
      recipeId: 'db',
      recipeName: data.source || 'Manual',
    }, ...prev]);
  }, [user, shoppingList]);

  const toggleShoppingItem = useCallback(async (id: string) => {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;

    const { error } = await supabase
      .from('shopping_list_items')
      .update({ checked: !item.checked })
      .eq('id', id);

    if (error) return;

    setShoppingList(prev =>
      prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
    );
  }, [shoppingList]);

  const removeFromShoppingList = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', id);

    if (error) return;

    setShoppingList(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCheckedItems = useCallback(async () => {
    const checkedIds = shoppingList.filter(item => item.checked).map(item => item.id);
    if (checkedIds.length === 0) return;

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .in('id', checkedIds);

    if (error) return;

    setShoppingList(prev => prev.filter(item => !item.checked));
  }, [shoppingList]);

  const clearShoppingList = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('user_id', user.id);

    if (error) return;

    setShoppingList([]);
  }, [user]);

  return (
    <ShoppingListContext.Provider
      value={{
        shoppingList,
        addToShoppingList,
        addItemToShoppingList,
        toggleShoppingItem,
        removeFromShoppingList,
        clearCheckedItems,
        clearShoppingList,
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (context === undefined) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
}
