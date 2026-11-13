import { Minus, Plus } from 'lucide-react';
import { FridgeItem } from '@/types/item';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: FridgeItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggleFavorite: (id: string) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export function ItemCard({
  item,
  onUpdateQuantity,
  onToggleFavorite,
  onClick,
  onDoubleClick
}: ItemCardProps) {
  return (
    <div 
      className={cn(
        "relative bg-card rounded-2xl border-2 border-border/50",
        "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]",
        "hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)]",
        "hover:border-border transition-all duration-300",
        "cursor-pointer overflow-hidden group",
        "flex items-center justify-between px-4 py-3"
      )} 
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-card-foreground truncate text-sm">
          {item.name}
        </h3>
        <p className="text-xs text-muted-foreground/70 capitalize">
          {item.category}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-3">
        <button 
          onClick={e => {
            e.stopPropagation();
            onUpdateQuantity(item.id, -1);
          }} 
          disabled={item.quantity <= 0} 
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "bg-muted/50 hover:bg-muted active:scale-95",
            "transition-all duration-200",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-muted/50"
          )}
        >
          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="min-w-[40px] text-center">
          <span className="text-lg font-bold text-card-foreground tabular-nums">
            {item.quantity}
          </span>
        </div>

        <button 
          onClick={e => {
            e.stopPropagation();
            onUpdateQuantity(item.id, 1);
          }} 
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "bg-foreground text-background hover:opacity-90 active:scale-95",
            "transition-all duration-200"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}