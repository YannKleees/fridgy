export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  availableIngredients: string[];
  missingIngredients: string[];
  instructions: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  recipeId: string;
  recipeName: string;
}
