import { CATEGORIES } from '@/types/item';

export interface ReceiptLine {
  name: string;
  quantity: number;
  category: string;
  unit?: string;
  price?: number | null;
}

export interface ReceiptSummary {
  scanned_at: string;
  total_amount: number | null;
  items: ReceiptLine[];
}

export interface CategorySpend {
  category: string;
  name: string;
  value: number;
}

/** Sums item prices per category, largest first. Items without a price are ignored. */
export function spendingByCategory(receipts: Pick<ReceiptSummary, 'items'>[]): CategorySpend[] {
  const totals: Record<string, number> = {};

  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const price = typeof item.price === 'number' ? item.price : 0;
      if (price <= 0) continue;
      const category = item.category || 'other';
      totals[category] = (totals[category] || 0) + price;
    }
  }

  return Object.entries(totals)
    .map(([category, value]) => ({
      category,
      name: CATEGORIES.find(c => c.value === category)?.label || category,
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Totals over all receipts and over the calendar month that contains `now`. */
export function receiptStats(receipts: ReceiptSummary[], now: Date = new Date()) {
  let totalSpent = 0;
  let thisMonth = 0;

  for (const receipt of receipts) {
    const amount = receipt.total_amount || 0;
    totalSpent += amount;

    const date = new Date(receipt.scanned_at);
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      thisMonth += amount;
    }
  }

  return { totalSpent, thisMonth, receiptCount: receipts.length };
}
