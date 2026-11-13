import { useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { ExpandableReceiptCard } from '@/components/ExpandableReceiptCard';
import { useReceiptHistory } from '@/hooks/useReceiptHistory';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Wallet, ShoppingBag, Calendar, LogOut, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { spendingByCategory, CategorySpend } from '@/lib/receipts';

// Category colors for the pie chart
const CATEGORY_COLORS: Record<string, string> = {
  dairy: 'hsl(220, 70%, 55%)',
  vegetables: 'hsl(140, 60%, 45%)',
  fruits: 'hsl(35, 85%, 55%)',
  meat: 'hsl(0, 65%, 50%)',
  beverages: 'hsl(195, 70%, 50%)',
  condiments: 'hsl(280, 55%, 55%)',
  leftovers: 'hsl(25, 45%, 45%)',
  other: 'hsl(210, 10%, 55%)',
};

export default function Dashboard() {
  const { signOut } = useAuth();
  const { receipts, isLoading, stats, deleteReceipt } = useReceiptHistory();

  const categorySpending = useMemo(() => spendingByCategory(receipts), [receipts]);

  const totalCategorySpending = categorySpending.reduce((sum, item) => sum + item.value, 0);

  // Group receipts by date
  const groupedReceipts = receipts.reduce((groups, receipt) => {
    const date = format(parseISO(receipt.scanned_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(receipt);
    return groups;
  }, {} as Record<string, typeof receipts>);

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: CategorySpend }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalCategorySpending) * 100).toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            €{data.value.toFixed(2)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout showAddButton={false}>
      <div className="pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your shopping history</p>
          </div>
          <button
            onClick={signOut}
            className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-5 border border-green-500/10">
            <div className="absolute top-3 right-3">
              <Wallet className="w-8 h-8 text-green-500/20" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">Spent</span>
            <p className="text-3xl font-bold text-foreground mt-2">
              {stats.thisMonth > 0 ? `€${stats.thisMonth.toFixed(2)}` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">this month</p>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/10">
            <div className="absolute top-3 right-3">
              <ShoppingBag className="w-8 h-8 text-primary/20" />
            </div>
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Trips</span>
            <p className="text-3xl font-bold text-foreground mt-2">
              {stats.receiptCount > 0 ? stats.receiptCount : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">shopping trips</p>
          </div>
        </div>

        {/* Spending by Category Chart */}
        {categorySpending.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-4">Spending by Category</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={600}
                    animationBegin={0}
                    label={({ value, cx, cy, midAngle, outerRadius }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 25;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="currentColor"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-xs fill-foreground"
                        >
                          €{value.toFixed(2)}
                        </text>
                      );
                    }}
                    labelLine={{
                      stroke: 'hsl(var(--muted-foreground))',
                      strokeWidth: 1,
                    }}
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => (
                      <span className="text-sm text-muted-foreground">{value}</span>
                    )}
                    wrapperStyle={{ paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Receipt History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">History</h2>
            {receipts.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-5">
                <Sparkles className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-[240px]">
                Scan a receipt or shopping list to start tracking your purchases
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedReceipts).map(([date, dayReceipts]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatDateLabel(date)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {dayReceipts.map(receipt => (
                      <ExpandableReceiptCard
                        key={receipt.id}
                        receipt={receipt}
                        onDelete={deleteReceipt}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}