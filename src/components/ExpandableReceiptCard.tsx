import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReceiptItem {
  name: string;
  quantity: number;
  category: string;
  price?: number;
}

interface ExpandableReceiptCardProps {
  receipt: {
    id: string;
    items: ReceiptItem[];
    total_amount: number | null;
    scanned_at: string;
  };
  onDelete: (id: string) => void;
}

export function ExpandableReceiptCard({ receipt, onDelete }: ExpandableReceiptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? receipt.items : receipt.items.slice(0, 3);
  const hasMore = receipt.items.length > 3;

  return (
    <div className="group bg-card hover:bg-accent/50 rounded-xl p-4 transition-colors border border-border/50">
      <div className="flex items-start justify-between gap-3">
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => hasMore && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-foreground">
              {receipt.items.length} {receipt.items.length === 1 ? 'item' : 'items'}
            </span>
            {receipt.total_amount && (
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                €{receipt.total_amount.toFixed(2)}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              • {format(parseISO(receipt.scanned_at), 'h:mm a')}
            </span>
            {hasMore && (
              <ChevronDown 
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform ml-auto",
                  isExpanded && "rotate-180"
                )} 
              />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleItems.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
              >
                {item.name}
                {item.price && (
                  <span className="ml-1 opacity-70">€{item.price.toFixed(2)}</span>
                )}
              </span>
            ))}
            {!isExpanded && hasMore && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                +{receipt.items.length - 3} more
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(receipt.id)}
          className={cn(
            "p-2 rounded-full opacity-0 group-hover:opacity-100",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            "transition-all shrink-0"
          )}
          aria-label="Delete receipt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
