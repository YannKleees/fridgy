import { Layout } from '@/components/Layout';
import { SwipeableItemCard } from '@/components/SwipeableItemCard';
import { useItems } from '@/contexts/ItemsContext';
import { useShoppingList } from '@/contexts/ShoppingListContext';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES, FridgeItem } from '@/types/item';

export default function Fridge() {
  const { addItemToShoppingList } = useShoppingList();
  const {
    items,
    isLoading,
    updateQuantity,
    toggleFavorite,
    deleteItem,
    updateItem
  } = useItems();

  const handleDelete = (id: string) => {
    deleteItem(id);
  };

  const handleAddToShoppingList = (item: FridgeItem) => {
    addItemToShoppingList(item.name, 'Pantry');
  };

  // Group items by category for pantry-style display
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  if (isLoading) {
    return (
      <Layout title="My Pantry">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Pantry">


      {/* Items Display */}
      {items.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-semibold text-foreground capitalize">
                  {CATEGORIES.find(c => c.value === category)?.label || category}
                </h2>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground">
                  {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {categoryItems.map(item => (
                  <SwipeableItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onToggleFavorite={toggleFavorite}
                    onDelete={handleDelete}
                    onAddToShoppingList={handleAddToShoppingList}
                    onUpdateItem={updateItem}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className={cn("w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6", "border-2 border-dashed border-border")}>
            <Package className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Your pantry is empty
          </h3>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            Tap the + button to add your first item
          </p>
        </div>
      )}
    </Layout>
  );
}