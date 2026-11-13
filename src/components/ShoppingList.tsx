import { ShoppingItem } from '@/types/recipe';
import { Trash2, ShoppingCart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClearChecked: () => void;
  onClearAll: () => void;
  onAddItem?: (name: string) => void;
}

const SUGGESTIONS = [
  'Bananas',
  'Apples',
  'Yogurt',
  'Cheese',
  'Chicken',
  'Salmon',
  'Spinach',
  'Avocado',
  'Lemons',
  'Coffee',
  'Oats',
  'Honey',
];

export function ShoppingList({
  items,
  onToggle,
  onRemove,
  onClearChecked,
  onClearAll,
  onAddItem,
}: ShoppingListProps) {
  const [newItemName, setNewItemName] = useState('');
  const checkedCount = items.filter(item => item.checked).length;
  const groupedByRecipe = items.reduce((acc, item) => {
    if (!acc[item.recipeName]) {
      acc[item.recipeName] = [];
    }
    acc[item.recipeName].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  // Filter out suggestions that are already in the list
  const availableSuggestions = useMemo(() => {
    const itemNames = new Set(items.map(item => item.name.toLowerCase()));
    return SUGGESTIONS.filter(suggestion => !itemNames.has(suggestion.toLowerCase()));
  }, [items]);

  const handleAddItem = () => {
    if (newItemName.trim() && onAddItem) {
      onAddItem(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        {/* Empty state */}
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-medium mb-1">Your shopping list is empty</p>
          <p className="text-sm text-muted-foreground">
            Add items manually or from recipes
          </p>
        </div>

        {/* Add item input */}
        {onAddItem && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an item..."
              className="flex-1 px-4 py-3 bg-muted/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Suggestions */}
        {availableSuggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Quick Add
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onAddItem?.(suggestion)}
                  className="px-3 py-2 bg-muted/50 text-sm text-foreground rounded-full hover:bg-muted transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add item input */}
      {onAddItem && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add an item..."
            className="flex-1 px-4 py-3 bg-muted/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleAddItem}
            disabled={!newItemName.trim()}
            className="px-4 py-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {checkedCount} of {items.length} items checked
        </p>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <button
              onClick={onClearChecked}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear checked
            </button>
          )}
          <button
            onClick={onClearAll}
            className="text-sm text-destructive hover:text-destructive/80 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Grouped items */}
      {Object.entries(groupedByRecipe).map(([recipeName, recipeItems]) => (
        <div key={recipeName} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {recipeName}
          </h3>
          <div className="checklist-container space-y-2">
            {recipeItems.map(item => (
              <div
                key={item.id}
                className="checklist-item flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
              >
                <label className="checklist-label flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggle(item.id)}
                    className="checklist-checkbox"
                  />
                  <span className={cn(
                    "checklist-text transition-colors duration-300",
                    item.checked && "checked"
                  )}>
                    {item.name}
                  </span>
                </label>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Suggestions section when list has items */}
      {availableSuggestions.length > 0 && (
        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Quick Add
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onAddItem?.(suggestion)}
                className="px-3 py-1.5 bg-muted/50 text-xs text-foreground rounded-full hover:bg-muted transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-primary" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
