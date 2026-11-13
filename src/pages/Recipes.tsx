import { useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { RecipeMessage } from '@/components/RecipeMessage';
import { RecipeChatInput } from '@/components/RecipeChatInput';
import { useItems } from '@/contexts/ItemsContext';
import { useRecipes } from '@/hooks/useRecipes';
import { useShoppingList } from '@/contexts/ShoppingListContext';
import { Trash2 } from 'lucide-react';
export default function Recipes() {
  const {
    items
  } = useItems();
  const {
    addToShoppingList
  } = useShoppingList();
  const {
    messages,
    isLoading: recipesLoading,
    sendMessage,
    clearChat
  } = useRecipes();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, recipesLoading]);
  const handleSendMessage = (message: string) => {
    sendMessage(message, items);
  };
  const suggestions = ["Something quick for dinner", "A healthy lunch idea", "Comfort food for tonight", "Something with chicken"];
  return <Layout title="What do you want to eat?">
      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 ? (/* Empty state with suggestions */
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <h3 className="text-lg font-medium text-foreground mb-2">
                What are you craving?
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Tell me what you're in the mood for and I'll suggest recipes using what's in your fridge
              </p>
              
              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map(suggestion => <button key={suggestion} onClick={() => handleSendMessage(suggestion)} className="px-3 py-1.5 bg-card text-sm text-foreground rounded-full hover:bg-muted transition-colors border border-border">
                    {suggestion}
                  </button>)}
              </div>
            </div>) : <>
              {/* Clear chat button */}
              <div className="flex justify-end">
                <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Trash2 className="w-3 h-3" />
                  Clear chat
                </button>
              </div>
              
              {/* Messages */}
              {messages.map(message => <RecipeMessage key={message.id} type={message.type} content={message.content} recipes={message.recipes} onAddToShoppingList={addToShoppingList} />)}
              
              {/* Loading indicator */}
              {recipesLoading && <RecipeMessage type="assistant" content="" isLoading={true} />}
              
              <div ref={messagesEndRef} />
            </>}
        </div>

        {/* Chat input - fixed at bottom */}
        <div className="pt-2 border-t border-border">
          <RecipeChatInput onSubmit={handleSendMessage} isLoading={recipesLoading} placeholder={items.length > 0 ? `You have ${items.length} items in your fridge...` : "What are you in the mood for?"} />
        </div>
      </div>
    </Layout>;
}