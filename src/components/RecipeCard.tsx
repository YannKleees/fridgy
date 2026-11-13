import { Recipe } from '@/types/recipe';
import { Clock, ChefHat, Check, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface RecipeCardProps {
  recipe: Recipe;
  onAddToShoppingList: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, onAddToShoppingList }: RecipeCardProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToShoppingList = () => {
    onAddToShoppingList(recipe);
    setIsAdded(true);
  };

  const difficultyColor = {
    Easy: 'text-success',
    Medium: 'text-yellow-500',
    Hard: 'text-destructive',
  };

  return (
    <div className="bg-card rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-lg text-foreground">{recipe.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-4 h-4" />
          {recipe.cookTime}
        </div>
        <div className={cn("flex items-center gap-1.5", difficultyColor[recipe.difficulty])}>
          <ChefHat className="w-4 h-4" />
          {recipe.difficulty}
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-2">
        {recipe.missingIngredients.length > 0 && (
          <div className="flex items-start gap-2">
            <ShoppingCart className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Need to buy:</p>
              <p className="text-sm text-muted-foreground">
                {recipe.missingIngredients.join(', ')}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">You have:</p>
            <p className="text-sm text-muted-foreground">
              {recipe.availableIngredients.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions toggle */}
      <Button
        variant="ghost"
        onClick={() => setShowInstructions(!showInstructions)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-start px-0 h-auto py-1"
      >
        {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showInstructions ? 'Hide instructions' : 'Show instructions'}
      </Button>

      {showInstructions && (
        <ol className="space-y-2 pl-5 list-decimal text-sm text-muted-foreground">
          {recipe.instructions.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      )}

      {/* Add to shopping list */}
      {recipe.missingIngredients.length > 0 && (
        isAdded ? (
          <div className="w-full py-2.5 px-4 bg-muted text-muted-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-success" />
            Added to list
          </div>
        ) : (
          <Button
            onClick={handleAddToShoppingList}
            className="w-full py-2.5 px-4 bg-foreground text-background rounded-xl font-medium text-sm hover:bg-foreground/90 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add missing items to list
          </Button>
        )
      )}
    </div>
  );
}
