import type { Money } from './types';
export const money = (amount: Money) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: amount % 100 === 0 ? 0 : 2 }).format(amount / 100);
