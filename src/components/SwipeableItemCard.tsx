import { useState, useRef } from 'react';
import { Info, Trash2, ShoppingCart } from 'lucide-react';
import { FridgeItem } from '@/types/item';
import { ItemCard } from './ItemCard';
import { ItemInfoModal } from './ItemInfoModal';
import { cn } from '@/lib/utils';

interface SwipeableItemCardProps {
  item: FridgeItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onAddToShoppingList: (item: FridgeItem) => void;
  onUpdateItem?: (id: string, updates: Partial<FridgeItem>) => void;
}

export function SwipeableItemCard({
  item,
  onUpdateQuantity,
  onToggleFavorite,
  onDelete,
  onAddToShoppingList,
  onUpdateItem,
}: SwipeableItemCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const ACTION_WIDTH = 56; // Width of each action button (48px + 8px gap)
  const TOTAL_ACTIONS_WIDTH = ACTION_WIDTH * 3 + 8; // 3 actions + padding
  const SWIPE_THRESHOLD = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = translateX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const diff = startXRef.current - e.touches[0].clientX;
    const newTranslate = Math.max(
      0,
      Math.min(TOTAL_ACTIONS_WIDTH, currentXRef.current + diff)
    );
    setTranslateX(newTranslate);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to open or closed
    if (translateX > SWIPE_THRESHOLD) {
      setTranslateX(TOTAL_ACTIONS_WIDTH);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    currentXRef.current = translateX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = startXRef.current - e.clientX;
    const newTranslate = Math.max(
      0,
      Math.min(TOTAL_ACTIONS_WIDTH, currentXRef.current + diff)
    );
    setTranslateX(newTranslate);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (translateX > SWIPE_THRESHOLD) {
      setTranslateX(TOTAL_ACTIONS_WIDTH);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  const handleAction = (action: 'info' | 'delete' | 'shopping') => {
    setTranslateX(0);
    
    switch (action) {
      case 'info':
        setShowInfoModal(true);
        break;
      case 'delete':
        onDelete(item.id);
        break;
      case 'shopping':
        onAddToShoppingList(item);
        break;
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl"
        onMouseLeave={handleMouseLeave}
      >
        {/* Action buttons (behind the card) */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2">
          <button
            onClick={() => handleAction('info')}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-full",
              "bg-primary text-primary-foreground",
              "transition-transform duration-200"
            )}
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleAction('shopping')}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-full",
              "bg-accent text-accent-foreground",
              "transition-transform duration-200"
            )}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleAction('delete')}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-full",
              "bg-destructive text-destructive-foreground",
              "transition-transform duration-200"
            )}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Main card (slides to reveal actions) */}
        <div
          className={cn(
            "relative bg-card",
            isDragging ? "" : "transition-transform duration-300 ease-out"
          )}
          style={{ transform: `translateX(-${translateX}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <ItemCard
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onToggleFavorite={onToggleFavorite}
            onDoubleClick={() => setShowInfoModal(true)}
          />
        </div>
      </div>

      <ItemInfoModal
        item={item}
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
        onUpdateItem={onUpdateItem}
      />
    </>
  );
}
