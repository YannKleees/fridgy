import { Home, ShoppingCart, ChefHat, BarChart3, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAddItem } from '@/contexts/AddItemContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: ShoppingCart, label: 'Shopping', path: '/shopping' },
  { type: 'add' as const },
  { icon: ChefHat, label: 'Recipes', path: '/recipes' },
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
];

export function BottomNav() {
  const location = useLocation();
  const { openAddModal } = useAddItem();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 px-4 py-2 bg-foreground rounded-[15px]">
        {navItems.map((item, index) => {
          if (item.type === 'add') {
            return (
              <button
                key="add"
                onClick={openAddModal}
                className={cn(
                  "p-2 rounded-full bg-background text-foreground",
                  "hover:bg-background/90 active:scale-95 transition-all duration-200",
                  "shadow-md"
                )}
              >
                <Plus className="w-5 h-5" />
              </button>
            );
          }

          const { icon: Icon, label, path } = item as { icon: typeof Home; label: string; path: string };
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "relative group p-2 rounded-full transition-all duration-300",
                isActive 
                  ? "bg-background/20" 
                  : "hover:bg-background/10"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-background" : "text-background/70"
                )} 
              />
              
              {/* Tooltip */}
              <div className={cn(
                "absolute bottom-full left-1/2 -translate-x-1/2 mb-4",
                "px-2 py-1 text-sm text-background bg-foreground rounded-md",
                "opacity-0 scale-50 transition-all duration-300",
                "group-hover:opacity-100 group-hover:scale-100",
                "pointer-events-none whitespace-nowrap"
              )}>
                {label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}