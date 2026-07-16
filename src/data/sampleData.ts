import { Transaction } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Equity & Inception
  {
    id: 't-1',
    amount: 50000,
    type: 'income',
    category: 'Founder Capital',
    accountingType: 'equity',
    date: '2026-07-01',
    description: 'Initial seed capital invested by founder'
  },
  {
    id: 't-2',
    amount: 15000,
    type: 'income',
    category: 'Bank Loan',
    accountingType: 'liability',
    date: '2026-07-02',
    description: 'SBA startup development loan approved'
  },
  // Capital Asset Purchase
  {
    id: 't-3',
    amount: 4500,
    type: 'expense',
    category: 'Computer Hardware',
    accountingType: 'asset',
    date: '2026-07-03',
    description: 'MacBook Pro workstations and monitors for team'
  },
  // Revenue (Trading A/C)
  {
    id: 't-4',
    amount: 14200,
    type: 'income',
    category: 'SaaS Subscriptions',
    accountingType: 'trading_revenue',
    date: '2026-07-08',
    description: 'Stripe merchant payout for subscription sales'
  },
  {
    id: 't-5',
    amount: 8500,
    type: 'income',
    category: 'Enterprise Contract',
    accountingType: 'trading_revenue',
    date: '2026-07-12',
    description: 'Design agency custom integration fee'
  },
  // Direct Costs (Trading A/C - COGS)
  {
    id: 't-6',
    amount: 2100,
    type: 'expense',
    category: 'Production API Services',
    accountingType: 'trading_cogs',
    date: '2026-07-05',
    description: 'Direct cost for OpenAI API tokens consumed by users'
  },
  {
    id: 't-7',
    amount: 1400,
    type: 'expense',
    category: 'Fulfillment & Shipping',
    accountingType: 'trading_cogs',
    date: '2026-07-10',
    description: 'Core inventory packaging and global express shipping'
  },
  // Operating Expenses (P&L A/C - OpEx)
  {
    id: 't-8',
    amount: 850,
    type: 'expense',
    category: 'Hosting & Infrastructure',
    accountingType: 'opex',
    date: '2026-07-04',
    description: 'AWS cloud servers and DB clusters'
  },
  {
    id: 't-9',
    amount: 420,
    type: 'expense',
    category: 'Software Subscriptions',
    accountingType: 'opex',
    date: '2026-07-06',
    description: 'Google Workspace, Slack, Linear, and Github Team plans'
  },
  {
    id: 't-10',
    amount: 3200,
    type: 'expense',
    category: 'Marketing & Ads',
    accountingType: 'opex',
    date: '2026-07-07',
    description: 'Meta Ads and Google AdWords campaigns'
  },
  {
    id: 't-11',
    amount: 7500,
    type: 'expense',
    category: 'Employee Payroll',
    accountingType: 'opex',
    date: '2026-07-14',
    description: 'Monthly payroll processing for developers and operations'
  },
  {
    id: 't-12',
    amount: 1200,
    type: 'expense',
    category: 'Office Rent & Coworking',
    accountingType: 'opex',
    date: '2026-07-14',
    description: 'WeWork team private desk subscription'
  }
];
