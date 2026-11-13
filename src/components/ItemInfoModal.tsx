import { useState } from 'react';
import { FridgeItem } from '@/types/item';
import { CATEGORIES } from '@/types/item';
import { X, Calendar, Tag, Package, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
interface ItemInfoModalProps {
  item: FridgeItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateItem?: (id: string, updates: Partial<FridgeItem>) => void;
}
export function ItemInfoModal({
  item,
  open,
  onOpenChange,
  onUpdateItem
}: ItemInfoModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
  const [editCategory, setEditCategory] = useState(item.category);
  const [editUnit, setEditUnit] = useState(item.unit);
  if (!open) return null;
  const categoryLabel = CATEGORIES.find(c => c.value === item.category)?.label || item.category;
  const addedDate = new Date(item.addedAt);
  const handleStartEdit = () => {
    setEditName(item.name);
    setEditQuantity(item.quantity.toString());
    setEditCategory(item.category);
    setEditUnit(item.unit);
    setIsEditing(true);
  };
  const handleSave = () => {
    if (onUpdateItem) {
      onUpdateItem(item.id, {
        name: editName.trim() || item.name,
        quantity: parseInt(editQuantity) || item.quantity,
        category: editCategory,
        unit: editUnit
      });
    }
    setIsEditing(false);
  };
  const handleCancel = () => {
    setIsEditing(false);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Card */}
      <div onClick={e => e.stopPropagation()} className={cn("relative z-10", "w-full max-w-[300px]", "bg-card/90 backdrop-blur-md", "border border-border", "shadow-[12px_17px_51px_rgba(0,0,0,0.22)]", "rounded-2xl", "overflow-hidden", "animate-in fade-in-0 zoom-in-95 duration-300")}>
        {/* Close button */}
        

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            {isEditing ? <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full text-xl font-bold text-card-foreground bg-muted/50 border border-border rounded-lg px-3 py-2 text-center" autoFocus /> : <h2 className="text-xl font-bold text-card-foreground mb-1">
                {item.name}
              </h2>}
            {!isEditing && <p className="text-sm text-muted-foreground capitalize">
                {categoryLabel}
              </p>}
          </div>

          {/* Details */}
          <div className="space-y-3">
            {/* Quantity */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Quantity</p>
                {isEditing ? <div className="flex gap-2 mt-1">
                    <input type="number" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} min={1} className="w-16 px-2 py-1 bg-background border border-border rounded text-sm font-semibold" />
                    
                  </div> : <p className="font-semibold text-card-foreground">
                    {item.quantity} {item.unit}
                  </p>}
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Category</p>
                {isEditing ? (
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value.toLowerCase())}
                      placeholder="Type or select category"
                      list="category-options"
                      className="w-full px-2 py-1 bg-background border border-border rounded text-sm font-semibold"
                    />
                    <datalist id="category-options">
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <p className="font-semibold text-card-foreground capitalize">
                    {categoryLabel}
                  </p>
                )}
              </div>
            </div>

            {/* Added date */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Added</p>
                <p className="font-semibold text-card-foreground">
                  {format(addedDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Expiry date (if exists) */}
            {item.expiryDate && <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="font-semibold text-destructive">
                    {format(new Date(item.expiryDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>}
          </div>

          {/* Action buttons */}
          {onUpdateItem && <div className="mt-6">
              {isEditing ? <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button className="flex-1 rounded-full" onClick={handleSave}>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div> : <Button variant="outline" className="w-full rounded-full" onClick={handleStartEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Item
                </Button>}
            </div>}
        </div>
      </div>
    </div>;
}