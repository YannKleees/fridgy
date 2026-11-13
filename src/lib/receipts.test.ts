import { describe, it, expect } from 'vitest';
import { receiptStats, spendingByCategory } from './receipts';

describe('spendingByCategory', () => {
  it('adds up prices per category across receipts, largest first', () => {
    const result = spendingByCategory([
      {
        items: [
          { name: 'milk', quantity: 1, category: 'dairy', price: 1.2 },
          { name: 'steak', quantity: 1, category: 'meat', price: 9.5 },
        ],
      },
      { items: [{ name: 'cheese', quantity: 1, category: 'dairy', price: 3.3 }] },
    ]);

    expect(result).toEqual([
      { category: 'meat', name: 'Meat & Poultry', value: 9.5 },
      { category: 'dairy', name: 'Dairy', value: 4.5 },
    ]);
  });

  it('skips items without a price and falls back to "other"', () => {
    const result = spendingByCategory([
      {
        items: [
          { name: 'bread', quantity: 1, category: '', price: 2 },
          { name: 'salt', quantity: 1, category: 'condiments', price: null },
          { name: 'water', quantity: 1, category: 'beverages' },
        ],
      },
    ]);

    expect(result).toEqual([{ category: 'other', name: 'Other', value: 2 }]);
  });

  it('rounds to cents', () => {
    const [dairy] = spendingByCategory([
      {
        items: [
          { name: 'a', quantity: 1, category: 'dairy', price: 0.1 },
          { name: 'b', quantity: 1, category: 'dairy', price: 0.2 },
        ],
      },
    ]);

    expect(dairy.value).toBe(0.3);
  });

  it('returns an empty list when there is nothing to count', () => {
    expect(spendingByCategory([])).toEqual([]);
  });
});

describe('receiptStats', () => {
  const now = new Date(2026, 1, 15);
  const receipts = [
    { scanned_at: new Date(2026, 1, 3).toISOString(), total_amount: 20, items: [] },
    { scanned_at: new Date(2026, 1, 14).toISOString(), total_amount: null, items: [] },
    { scanned_at: new Date(2026, 0, 28).toISOString(), total_amount: 12.5, items: [] },
    { scanned_at: new Date(2025, 1, 10).toISOString(), total_amount: 99, items: [] },
  ];

  it('totals all receipts', () => {
    const stats = receiptStats(receipts, now);
    expect(stats.totalSpent).toBe(131.5);
    expect(stats.receiptCount).toBe(4);
  });

  it('counts only the current month of the current year', () => {
    expect(receiptStats(receipts, now).thisMonth).toBe(20);
  });
});
