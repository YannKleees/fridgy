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

export type ItemCategory = 
  | 'dairy'
  | 'meat'
  | 'vegetables'
  | 'fruits'
  | 'beverages'
  | 'condiments'
  | 'leftovers'
  | 'other';

export const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'meat', label: 'Meat & Poultry' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'condiments', label: 'Condiments' },
  { value: 'leftovers', label: 'Leftovers' },
  { value: 'other', label: 'Other' },
];

export const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'bottles', 'packs'];
