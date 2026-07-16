export type AccountingType =
  | 'trading_revenue' // Revenue from core sales (Trading A/C)
  | 'trading_cogs'    // Cost of goods sold / Direct costs (Trading A/C)
  | 'opex'            // Operating expenses / Indirect costs (P&L A/C)
  | 'asset'           // Current or non-current assets (Balance Sheet)
  | 'liability'       // Current or non-current liabilities (Balance Sheet)
  | 'equity';         // Founder's capital, drawings, equity (Balance Sheet)

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;         // e.g. "Software SaaS", "Freelance Services", "Raw Materials"
  accountingType: AccountingType;
  date: string;             // YYYY-MM-DD
  description: string;      // Details
  vendor?: string;          // Extracted from bill
  billScanned?: boolean;    // Flag if scanned
  billFileName?: string;    // Name of file
  
  // Advanced fields from Founder Finance PRD
  paymentMethod?: string;   // 'Cash' | 'Bank Transfer' | 'Credit Card' | 'UPI'
  isBusiness?: boolean;     // true for Business, false for Personal
  recurring?: string;       // 'None' | 'Weekly' | 'Monthly' | 'Yearly'
  notes?: string;           // Optional accountant notes
  tags?: string[];          // Optional labels/tags
  gstAmount?: number;       // GST Taxes portion
  taxAmount?: number;       // Direct tax / withholdings
  invoiceNumber?: string;   // For scanned invoices / billing
  dueDate?: string;         // Invoice due date (if outstanding)
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalOpex: number;
  netProfit: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  type: 'income' | 'expense';
  accountingType: AccountingType;
  percentage: number;
}

export interface BalanceSheetData {
  assets: { name: string; amount: number }[];
  liabilities: { name: string; amount: number }[];
  equity: { name: string; amount: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number; // dynamically added from Net Profit
  isBalanced: boolean;
  difference: number;
}
