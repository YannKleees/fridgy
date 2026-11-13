import { Layout } from '@/components/Layout';
import { ShoppingList } from '@/components/ShoppingList';
import { useShoppingList } from '@/contexts/ShoppingListContext';

export default function ShoppingListPage() {
  const {
    shoppingList,
    addItemToShoppingList,
    toggleShoppingItem,
    removeFromShoppingList,
    clearCheckedItems,
    clearShoppingList,
  } = useShoppingList();

  return (
    <Layout title="Shopping List">
      <div className="pb-24">
        <ShoppingList
          items={shoppingList}
          onToggle={toggleShoppingItem}
          onRemove={removeFromShoppingList}
          onClearChecked={clearCheckedItems}
          onClearAll={clearShoppingList}
          onAddItem={addItemToShoppingList}
        />
      </div>
    </Layout>
  );
}
