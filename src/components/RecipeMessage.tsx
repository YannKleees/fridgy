import { Recipe } from '@/types/recipe';
import { RecipeCard } from './RecipeCard';
import { User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipeMessageProps {
  type: 'user' | 'assistant';
  content: string;
  recipes?: Recipe[];
  onAddToShoppingList?: (recipe: Recipe) => void;
  isLoading?: boolean;
}

export function RecipeMessage({ 
  type, 
  content, 
  recipes, 
  onAddToShoppingList,
  isLoading 
}: RecipeMessageProps) {
  const isUser = type === 'user';

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-foreground" : "bg-primary/10"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-background" />
        ) : (
          <Sparkles className={cn("w-4 h-4 text-primary", isLoading && "animate-pulse")} />
        )}
      </div>

      {/* Message content */}
      <div className={cn("flex-1 space-y-3", isUser && "text-right")}>
        {content && (
          <div className={cn(
            "inline-block px-4 py-2.5 rounded-2xl text-sm",
            isUser 
              ? "bg-foreground text-background rounded-tr-sm" 
              : "bg-card text-foreground rounded-tl-sm"
          )}>
            {content}
          </div>
        )}

        {/* Recipe cards - reversed so best recipe appears last */}
        {recipes && recipes.length > 0 && onAddToShoppingList && (
          <div className="space-y-3">
            {[...recipes].reverse().map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onAddToShoppingList={onAddToShoppingList}
              />
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !content && (
          <div className="inline-block px-4 py-2.5 rounded-2xl bg-card rounded-tl-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
