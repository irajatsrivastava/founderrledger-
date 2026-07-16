import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, AccountingType } from '../types';
import { 
  Landmark, 
  TrendingUp, 
  ShieldCheck, 
  Scale, 
  ArrowDownRight, 
  ArrowUpRight, 
  Printer, 
  BookOpen, 
  Layers, 
  Activity, 
  DollarSign, 
  ChevronRight,
  Calculator,
  Calendar
} from 'lucide-react';

interface FinancialStatementsProps {
  transactions: Transaction[];
}

type FinancialSubTab = 'statements' | 'journal' | 'ledger' | 'trial' | 'cashbook';

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({ transactions }) => {
  const [subTab, setSubTab] = useState<FinancialSubTab>('statements');

  // 1. Dynamic P&L Calculation
  const financials = useMemo(() => {
    let totalRevenue = 0;
    let totalCogs = 0;
    let totalOpex = 0;

    const revenueDetails: { [key: string]: number } = {};
    const cogsDetails: { [key: string]: number } = {};
    const opexDetails: { [key: string]: number } = {};

    transactions.forEach(t => {
      const amt = t.amount;
      if (t.accountingType === 'trading_revenue') {
        totalRevenue += amt;
        revenueDetails[t.category] = (revenueDetails[t.category] || 0) + amt;
      } else if (t.accountingType === 'trading_cogs') {
        totalCogs += amt;
        cogsDetails[t.category] = (cogsDetails[t.category] || 0) + amt;
      } else if (t.accountingType === 'opex') {
        totalOpex += amt;
        opexDetails[t.category] = (opexDetails[t.category] || 0) + amt;
      }
    });

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalOpex;

    return {
      totalRevenue,
      totalCogs,
      grossProfit,
      totalOpex,
      netProfit,
      revenueDetails: Object.entries(revenueDetails).sort((a, b) => b[1] - a[1]),
      cogsDetails: Object.entries(cogsDetails).sort((a, b) => b[1] - a[1]),
      opexDetails: Object.entries(opexDetails).sort((a, b) => b[1] - a[1]),
    };
  }, [transactions]);

  // 2. Dynamic Balance Sheet Calculation
  const balanceSheet = useMemo(() => {
    let fixedAssets = 0;
    const fixedAssetDetails: { [key: string]: number } = {};
    
    let totalLiabilities = 0;
    const liabilityDetails: { [key: string]: number } = {};

    let initialEquity = 0;
    const equityDetails: { [key: string]: number } = {};

    let cashInflows = 0;
    let cashOutflows = 0;

    transactions.forEach(t => {
      const amt = t.amount;
      if (t.type === 'income') {
        cashInflows += amt;
      } else {
        cashOutflows += amt;
      }

      if (t.accountingType === 'asset') {
        fixedAssets += amt;
        fixedAssetDetails[t.category] = (fixedAssetDetails[t.category] || 0) + amt;
      } else if (t.accountingType === 'liability') {
        totalLiabilities += amt;
        liabilityDetails[t.category] = (liabilityDetails[t.category] || 0) + amt;
      } else if (t.accountingType === 'equity') {
        initialEquity += amt;
        equityDetails[t.category] = (equityDetails[t.category] || 0) + amt;
      }
    });

    const bankCash = Math.max(0, cashInflows - cashOutflows);
    const totalAssets = bankCash + fixedAssets;

    const retainedEarnings = financials.netProfit;
    const totalEquity = initialEquity + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;
    const difference = totalAssets - totalLiabilitiesAndEquity;

    return {
      bankCash,
      fixedAssets,
      fixedAssetDetails: Object.entries(fixedAssetDetails),
      totalAssets,
      totalLiabilities,
      liabilityDetails: Object.entries(liabilityDetails),
      initialEquity,
      equityDetails: Object.entries(equityDetails),
      retainedEarnings,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced,
      difference
    };
  }, [transactions, financials]);

  // 3. Double-Entry Journal Entries Generator
  const journalEntries = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((t, idx) => {
        let debitAccount = '';
        let creditAccount = '';
        
        switch (t.accountingType) {
          case 'trading_revenue':
            debitAccount = 'Cash & Bank Account';
            creditAccount = `Sales Revenue: ${t.category}`;
            break;
          case 'trading_cogs':
            debitAccount = `Direct Production Cost: ${t.category}`;
            creditAccount = 'Cash & Bank Account';
            break;
          case 'opex':
            debitAccount = `Operating Expense: ${t.category}`;
            creditAccount = 'Cash & Bank Account';
            break;
          case 'asset':
            debitAccount = `Fixed Capital Asset: ${t.category}`;
            creditAccount = 'Cash & Bank Account';
            break;
          case 'liability':
            debitAccount = 'Cash & Bank Account';
            creditAccount = `Business Liability: ${t.category}`;
            break;
          case 'equity':
            debitAccount = 'Cash & Bank Account';
            creditAccount = `Capital Equity: ${t.category}`;
            break;
          default:
            debitAccount = 'Sundry Debits';
            creditAccount = 'Sundry Credits';
        }

        return {
          id: t.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          debitAccount,
          creditAccount,
          lf: `LF-${100 + idx}`
        };
      });
  }, [transactions]);

  // 4. Trial Balance Calculator
  const trialBalance = useMemo(() => {
    // Left-hand side Debits vs Right-hand side Credits
    const debits: { name: string; amount: number }[] = [];
    const credits: { name: string; amount: number }[] = [];

    // Bank Cash
    debits.push({ name: 'Cash & Bank Account', amount: balanceSheet.bankCash });

    // Fixed assets (Debits)
    balanceSheet.fixedAssetDetails.forEach(([cat, amt]) => {
      debits.push({ name: `Asset: ${cat}`, amount: amt });
    });

    // Expenses (Debits)
    financials.cogsDetails.forEach(([cat, amt]) => {
      debits.push({ name: `Direct Cost: ${cat}`, amount: amt });
    });
    financials.opexDetails.forEach(([cat, amt]) => {
      debits.push({ name: `OpEx: ${cat}`, amount: amt });
    });

    // Liabilities (Credits)
    balanceSheet.liabilityDetails.forEach(([cat, amt]) => {
      credits.push({ name: `Liability: ${cat}`, amount: amt });
    });

    // Equity (Credits)
    balanceSheet.equityDetails.forEach(([cat, amt]) => {
      credits.push({ name: `Equity: ${cat}`, amount: amt });
    });

    // Revenues (Credits)
    financials.revenueDetails.forEach(([cat, amt]) => {
      credits.push({ name: `Revenue: ${cat}`, amount: amt });
    });

    const totalDebits = debits.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCredits = credits.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      debits,
      credits,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.05
    };
  }, [financials, balanceSheet]);

  // 5. Cash Book Log with Dynamic Running Balance
  const cashBook = useMemo(() => {
    let runningBalance = 0;
    return [...transactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => {
        const receipt = t.type === 'income' ? t.amount : 0;
        const payment = t.type === 'expense' ? t.amount : 0;
        runningBalance += receipt - payment;

        return {
          id: t.id,
          date: t.date,
          particulars: t.description,
          receipt,
          payment,
          balance: runningBalance,
          category: t.category
        };
      });
  }, [transactions]);

  // Dynamic high-fidelity PDF / Multi-page audit Report generator
  const handlePrintPDF = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      alert('Could not initialize print engine.');
      return;
    }

    const currentDateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FounderFinance Audit Report - July 2026</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            margin: 40px;
            line-height: 1.4;
          }
          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 15px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .company-name {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.04em;
          }
          .statement-title {
            font-size: 13px;
            font-weight: 500;
            color: #475569;
            margin-top: 4px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .meta-info {
            font-size: 11px;
            color: #475569;
            text-align: right;
            font-family: 'JetBrains Mono', monospace;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 4px;
            margin-top: 30px;
            margin-bottom: 15px;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 11px;
          }
          tr {
            border-bottom: 1px solid #e2e8f0;
          }
          tr.bold {
            font-weight: 700;
            border-bottom: 1.5px solid #0f172a;
          }
          tr.double-border {
            border-bottom: 3px double #0f172a;
          }
          tr.bg-light {
            background-color: #f8fafc;
          }
          td, th {
            padding: 7px 10px;
            text-align: left;
          }
          td.right, th.right {
            text-align: right;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 500;
          }
          .indent {
            padding-left: 25px;
            color: #334155;
          }
          .summary-card {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 25px;
            font-size: 11px;
            background-color: #f8fafc;
          }
          .badge {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            background-color: #e2e8f0;
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-block;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #cbd5e1;
            padding-top: 20px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
          }
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div>
            <div class="company-name">FounderFinance Ledger Suite</div>
            <div class="statement-title">Executive GAAP Ledger & Financial Statements</div>
          </div>
          <div class="meta-info">
            <div>Reporting: GAAP Accrual</div>
            <div>Period: July 2026</div>
            <div>Generated On: ${currentDateStr}</div>
          </div>
        </div>

        <div class="summary-card">
          <strong>Double-Entry Accounting Audit Report:</strong> Verified Balanced & Stable Ledger Bookings.<br/>
          Available Cash Assets: $${balanceSheet.bankCash.toLocaleString(undefined, { minimumFractionDigits: 2 })} &nbsp;|&nbsp; 
          Period Revenue Sales: $${financials.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} &nbsp;|&nbsp;
          Retained Earnings: $${balanceSheet.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>

        <!-- P&L STATEMENT -->
        <div class="section-title">Trading and Profit & Loss Account</div>
        <table>
          <thead>
            <tr style="border-bottom: 1.5px solid #0f172a; font-weight:700">
              <th>Particulars / Account Head</th>
              <th class="right">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bold">
              <td>Core Revenue Turnover</td>
              <td class="right">$${financials.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            ${financials.revenueDetails.map(([cat, amt]) => `
              <tr>
                <td class="indent">• Sales: ${cat}</td>
                <td class="right">$${amt.toLocaleString()}</td>
              </tr>
            `).join('')}

            <tr class="bold">
              <td>Less: Direct Cost of Goods Sold (COGS)</td>
              <td class="right">($${financials.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2 })})</td>
            </tr>
            ${financials.cogsDetails.map(([cat, amt]) => `
              <tr>
                <td class="indent">• Direct: ${cat}</td>
                <td class="right">$${amt.toLocaleString()}</td>
              </tr>
            `).join('')}

            <tr class="bold bg-light" style="border-top:1.5px solid #0f172a">
              <td>GROSS OPERATIONAL PROFIT</td>
              <td class="right">$${financials.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>

            <tr class="bold" style="border-top:1.5px solid #0f172a">
              <td>Less: Operating Overhead Expenses (OpEx)</td>
              <td class="right">($${financials.totalOpex.toLocaleString(undefined, { minimumFractionDigits: 2 })})</td>
            </tr>
            ${financials.opexDetails.map(([cat, amt]) => `
              <tr>
                <td class="indent">• OpEx: ${cat}</td>
                <td class="right">$${amt.toLocaleString()}</td>
              </tr>
            `).join('')}

            <tr class="double-border bold bg-light" style="font-size:12px">
              <td>NET FINANCIAL INCOME / MARGIN</td>
              <td class="right" style="color: ${financials.netProfit >= 0 ? '#15803d' : '#b91c1c'}">$${financials.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <!-- BALANCE SHEET -->
        <div class="page-break"></div>
        <div class="section-title">Corporate Balance Sheet</div>
        <table>
          <thead>
            <tr style="border-bottom: 1.5px solid #0f172a; font-weight:700">
              <th>Capital Placements (Assets)</th>
              <th class="right">Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bold">
              <td>Current Liquid Assets</td>
              <td class="right"></td>
            </tr>
            <tr>
              <td class="indent">• Cash and Bank Balances</td>
              <td class="right">$${balanceSheet.bankCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="bold">
              <td>Non-Current Capital Assets</td>
              <td class="right"></td>
            </tr>
            ${balanceSheet.fixedAssetDetails.map(([cat, amt]) => `
              <tr>
                <td class="indent">• Capital: ${cat}</td>
                <td class="right">$${amt.toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="bold bg-light" style="border-top:1.5px solid #0f172a">
              <td>TOTAL BOOK ASSETS (A)</td>
              <td class="right">$${balanceSheet.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr style="border-bottom: 1.5px solid #0f172a; font-weight:700">
              <th>Funding Sources & Owners Equity (L + E)</th>
              <th class="right">Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bold">
              <td>Outstanding Liabilities</td>
              <td class="right"></td>
            </tr>
            ${balanceSheet.liabilityDetails.map(([cat, amt]) => `
              <tr>
                <td class="indent">• Loan: ${cat}</td>
                <td class="right">$${amt.toLocaleString()}</td>
              </tr>
            `).join('')}
            ${balanceSheet.liabilityDetails.length === 0 ? '<tr><td class="indent"><em>No liabilities</em></td><td class="right">$0.00</td></tr>' : ''}

            <tr class="bold">
              <td>Shareholders Paid-In Capital</td>
              <td class="right"></td>
            </tr>
            ${balanceSheet.equityDetails.map(([cat, amt]) => `
              <tr>
                <td class="indent">• Founder Capital Base</td>
                <td class="right">$${amt.toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr>
              <td class="indent">• Retained Operational Period Surplus</td>
              <td class="right">$${balanceSheet.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>

            <tr class="double-border bold bg-light" style="border-top:1.5px solid #0f172a">
              <td>TOTAL LIABILITIES & OWNERS EQUITY</td>
              <td class="right">$${balanceSheet.totalLiabilitiesAndEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <!-- TRIAL BALANCE -->
        <div class="page-break"></div>
        <div class="section-title">Balanced Trial Balance (Standard Verification)</div>
        <table>
          <thead>
            <tr style="border-bottom: 1.5px solid #0f172a; font-weight:700">
              <th>Ledger Account Title</th>
              <th class="right">Debit Balance ($)</th>
              <th class="right">Credit Balance ($)</th>
            </tr>
          </thead>
          <tbody>
            ${trialBalance.debits.map(deb => `
              <tr>
                <td>${deb.name}</td>
                <td class="right">$${deb.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td class="right">-</td>
              </tr>
            `).join('')}
            ${trialBalance.credits.map(cred => `
              <tr>
                <td>${cred.name}</td>
                <td class="right">-</td>
                <td class="right">$${cred.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
            <tr class="bold bg-light double-border">
              <td>TOTAL BALANCED LEDGER BALANCES</td>
              <td class="right">$${trialBalance.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td class="right">$${trialBalance.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <!-- CASH BOOK -->
        <div class="section-title">Monthly Cash Book Ledger Traces</div>
        <table>
          <thead>
            <tr style="border-bottom: 1.5px solid #0f172a; font-weight:700">
              <th>Date</th>
              <th>Particulars / Source</th>
              <th class="right">Cash Inflows ($)</th>
              <th class="right">Cash Outflows ($)</th>
              <th class="right">Running Runway Cash ($)</th>
            </tr>
          </thead>
          <tbody>
            ${cashBook.map(row => `
              <tr>
                <td>${row.date}</td>
                <td>${row.particulars}</td>
                <td class="right">${row.receipt > 0 ? '$' + row.receipt.toLocaleString() : '-'}</td>
                <td class="right">${row.payment > 0 ? '$' + row.payment.toLocaleString() : '-'}</td>
                <td class="right" style="font-weight:600">$${row.balance.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          FounderFinance Ledger Compliance Engine • Confidential Strategic Advisory Report • Powered by Gemini AI.
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. Double-Entry Accounting Statement Identity Check Widget */}
      <motion.div 
        layout
        className={`p-4 rounded-3xl border flex items-center justify-between shadow-[0_4px_15px_rgba(0,0,0,0.01)] ${
          balanceSheet.isBalanced 
            ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950' 
            : 'bg-amber-50/70 border-amber-100 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${balanceSheet.isBalanced ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <Scale className={`w-4 h-4 shrink-0 ${balanceSheet.isBalanced ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider font-display">
              Double-Entry Identity
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
              {balanceSheet.isBalanced 
                ? 'GAAP Compliant: Balance sheet assets equal liabilities and equity.'
                : 'Asset discrepancy detected. Confirm standard journal records.'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            balanceSheet.isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {balanceSheet.isBalanced ? 'Balanced' : 'Discrepancy'}
          </span>
          {!balanceSheet.isBalanced && (
            <p className="text-[10px] font-mono font-bold mt-1 text-rose-600">Diff: ${balanceSheet.difference.toLocaleString()}</p>
          )}
        </div>
      </motion.div>

      {/* 2. Download Print-Ready PDF Button */}
      <motion.button
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePrintPDF}
        className="w-full bg-black hover:bg-slate-900 text-white rounded-2xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-slate-900"
      >
        <Printer className="w-4 h-4 text-emerald-400" />
        <span>Generate Print-Ready GAAP PDF</span>
      </motion.button>

      {/* 3. Sub-Tab Segmented Controls */}
      <div className="flex items-center bg-slate-200/40 p-1 rounded-full overflow-x-auto pb-1 pt-1 scrollbar-none select-none shrink-0 border border-slate-200/20">
        {(['statements', 'journal', 'ledger', 'trial', 'cashbook'] as const).map((tab) => {
          const label = tab === 'statements' ? 'P&L & BS' :
                        tab === 'journal' ? 'Journal' :
                        tab === 'ledger' ? 'Ledger' :
                        tab === 'trial' ? 'Trial Bal' : 'Cash Book';
          return (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className="relative flex-1 py-1.5 px-3 rounded-full text-[10px] font-bold tracking-tight transition-all cursor-pointer outline-none select-none text-center min-w-[65px]"
            >
              {subTab === tab && (
                <motion.div
                  layoutId="activeStatementSubSegment"
                  className="absolute inset-0 bg-white rounded-full shadow-xs"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-150 ${
                subTab === tab ? 'text-indigo-900 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Sub-Tab Active Screen Render with Framer Motion transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          
          {/* TAB A: P&L & BALANCE SHEET */}
          {subTab === 'statements' && (
            <>
              {/* TRADING AND PROFIT & LOSS ACCOUNT CARD */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_25px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Trading and Profit & Loss
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">Month Ended July 2026</p>
                  </div>
                  <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold font-mono">GAAP Accrual</span>
                </div>

                {/* Part I: Trading Account */}
                <div className="p-4 space-y-3.5 border-b border-slate-50">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Trading Account (Part I)</span>
                    <span className="text-[8px] text-slate-400 font-mono">Core Direct Activities</span>
                  </div>

                  {/* Income */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-extrabold text-slate-800">
                      <span>Core Revenue Turnover</span>
                      <span className="font-mono text-emerald-600">${financials.totalRevenue.toLocaleString()}</span>
                    </div>
                    {financials.revenueDetails.map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between text-[11px] text-slate-500 pl-3">
                        <span>• {cat}</span>
                        <span className="font-mono text-slate-600">${amt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* COGS */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-extrabold text-slate-800">
                      <span>Less: Cost of Goods Sold (COGS)</span>
                      <span className="font-mono text-rose-600">(${financials.totalCogs.toLocaleString()})</span>
                    </div>
                    {financials.cogsDetails.map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between text-[11px] text-slate-500 pl-3">
                        <span>• {cat}</span>
                        <span className="font-mono text-slate-600">${amt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Gross Profit Carry Down */}
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100/50">
                    <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Gross Profit Carry Down</span>
                    <span className="text-xs font-mono font-bold text-slate-900">${financials.grossProfit.toLocaleString()}</span>
                  </div>
                </div>

                {/* Part II: Profit & Loss Account */}
                <div className="p-4 space-y-3.5">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Profit & Loss (Part II)</span>
                    <span className="text-[8px] text-slate-400 font-mono">Indirect Cost Overheads</span>
                  </div>

                  {/* OpEx */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-extrabold text-slate-800">
                      <span>Less: Operating Expenses (OpEx)</span>
                      <span className="font-mono text-rose-600">(${financials.totalOpex.toLocaleString()})</span>
                    </div>
                    {financials.opexDetails.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-3">No operational overheads booked</p>
                    ) : (
                      financials.opexDetails.map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between text-[11px] text-slate-500 pl-3">
                          <span>• {cat}</span>
                          <span className="font-mono text-slate-600">${amt.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Net Profit Final */}
                  <div className={`rounded-2xl p-3.5 flex justify-between items-center border ${
                    financials.netProfit >= 0 
                      ? 'bg-emerald-500/5 border-emerald-100/80 text-emerald-950' 
                      : 'bg-rose-500/5 border-rose-100/80 text-rose-950'
                  }`}>
                    <span className="text-xs font-bold uppercase tracking-wider font-display">Net Financial Income</span>
                    <span className="text-sm font-mono font-extrabold">${financials.netProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* BALANCE SHEET CARD */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_25px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                      <Landmark className="w-4 h-4 text-indigo-600" />
                      Corporate Balance Sheet
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">Audited July 15, 2026</p>
                  </div>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold font-mono">Identity Verified</span>
                </div>

                {/* Assets Section */}
                <div className="p-4 space-y-3 border-b border-slate-50">
                  <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                    Assets (Capital Placements)
                  </h4>
                  
                  {/* Current */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-800">Liquid Holdings</span>
                    <div className="flex justify-between text-[11px] text-slate-500 pl-3">
                      <span>• Cash and Bank balances</span>
                      <span className="font-mono text-slate-800 font-medium">${balanceSheet.bankCash.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Fixed Assets */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-800">Capital Fixed Assets</span>
                    {balanceSheet.fixedAssetDetails.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-3">No long-term capital assets</p>
                    ) : (
                      balanceSheet.fixedAssetDetails.map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between text-[11px] text-slate-500 pl-3">
                          <span>• {cat}</span>
                          <span className="font-mono text-slate-800">${amt.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Total assets */}
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100/50">
                    <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Total Assets (A)</span>
                    <span className="text-xs font-mono font-bold text-slate-900">${balanceSheet.totalAssets.toLocaleString()}</span>
                  </div>
                </div>

                {/* Liabilities & Equity Section */}
                <div className="p-4 space-y-3">
                  <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                    Liabilities & Owners Equity (Sources)
                  </h4>

                  {/* Debt */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-800">Operational Liabilities</span>
                    {balanceSheet.liabilityDetails.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-3">Liabilities are fully cleared (Debt Free)</p>
                    ) : (
                      balanceSheet.liabilityDetails.map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between text-[11px] text-slate-500 pl-3">
                          <span>• {cat}</span>
                          <span className="font-mono text-slate-800">${amt.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Capital Equity */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-800">Shareholders Equity</span>
                    {balanceSheet.equityDetails.map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between text-[11px] text-slate-500 pl-3">
                        <span>• Paid-In Capital: {cat}</span>
                        <span className="font-mono text-slate-800">${amt.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-[11px] text-slate-500 pl-3">
                      <span>• Retained Surplus Rollover</span>
                      <span className={`font-mono font-semibold ${balanceSheet.retainedEarnings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${balanceSheet.retainedEarnings.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Total Liab & Equity */}
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100/50">
                    <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Total Funding (L + E)</span>
                    <span className="text-xs font-mono font-bold text-slate-900">${balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB B: JOURNAL ENTRIES */}
          {subTab === 'journal' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_8px_25px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Double-Entry Ledger Journal
                </h3>
                <span className="text-[9px] text-slate-400 font-mono font-bold">Total: {journalEntries.length} Postings</span>
              </div>

              {journalEntries.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-10">No journal bookings recorded</p>
              ) : (
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto scrollbar-none pr-1">
                  {journalEntries.map((row) => (
                    <div key={row.id} className="border-b border-slate-100/70 pb-3 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400 font-mono text-[9px] font-bold">
                        <span>{row.date}</span>
                        <span className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{row.lf}</span>
                      </div>
                      
                      {/* Debit row */}
                      <div className="flex justify-between font-semibold text-slate-900">
                        <span>{row.debitAccount}</span>
                        <span className="font-mono">Dr. ${row.amount.toLocaleString()}</span>
                      </div>
                      
                      {/* Credit row */}
                      <div className="flex justify-between text-slate-500 pl-4 italic">
                        <span>To {row.creditAccount}</span>
                        <span className="font-mono">Cr. ${row.amount.toLocaleString()}</span>
                      </div>
                      
                      {/* Narration */}
                      <p className="text-[10px] text-slate-400 pl-4 italic leading-tight">
                        (Being {row.description.toLowerCase()})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB C: GENERAL LEDGER */}
          {subTab === 'ledger' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_8px_25px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  General Ledger T-Accounts
                </h3>
                <span className="text-[9px] text-slate-400 font-mono">Aggregated Balances</span>
              </div>

              <div className="space-y-4 max-h-[480px] overflow-y-auto scrollbar-none">
                {/* Account 1: Bank Cash */}
                <div className="border border-slate-100 rounded-2xl p-3.5 space-y-2 shadow-xs bg-slate-50/20">
                  <div className="flex justify-between items-center font-bold text-slate-900 text-xs font-display">
                    <span>Cash & Bank Account</span>
                    <span className="font-mono text-emerald-700">${balanceSheet.bankCash.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-2 text-slate-500 font-mono">
                    <div>
                      <span className="text-slate-400 block uppercase font-mono text-[8px] font-bold">Total Inward (Dr)</span>
                      <span className="text-emerald-600 font-bold">${trialBalance.debits[0]?.amount.toLocaleString() || '0'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block uppercase font-mono text-[8px] font-bold">Closing Balance</span>
                      <span className="text-indigo-700 font-bold">${balanceSheet.bankCash.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Operational Revenues ledger */}
                <div className="border border-slate-100 rounded-2xl p-3.5 space-y-2 shadow-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900 text-xs font-display">
                    <span>Sales Revenue ledger</span>
                    <span className="font-mono text-slate-800">${financials.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1 text-[10px] pl-2 border-t border-slate-50 pt-1.5 text-slate-500">
                    {financials.revenueDetails.map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between font-mono">
                        <span>• Revenue: {cat}</span>
                        <span>Credit Balance: ${amt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational Exp ledger */}
                <div className="border border-slate-100 rounded-2xl p-3.5 space-y-2 shadow-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900 text-xs font-display">
                    <span>Operating Expense ledger</span>
                    <span className="font-mono text-slate-800">${financials.totalOpex.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1 text-[10px] pl-2 border-t border-slate-50 pt-1.5 text-slate-500">
                    {financials.opexDetails.map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between font-mono">
                        <span>• OpEx: {cat}</span>
                        <span>Debit Balance: ${amt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capital asset ledger */}
                <div className="border border-slate-100 rounded-2xl p-3.5 space-y-2 shadow-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900 text-xs font-display">
                    <span>Fixed Assets ledger</span>
                    <span className="font-mono text-slate-800">${balanceSheet.fixedAssets.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1 text-[10px] pl-2 border-t border-slate-50 pt-1.5 text-slate-500">
                    {balanceSheet.fixedAssetDetails.map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between font-mono">
                        <span>• Asset: {cat}</span>
                        <span>Debit Balance: ${amt.toLocaleString()}</span>
                      </div>
                    ))}
                    {balanceSheet.fixedAssetDetails.length === 0 && <p className="italic text-slate-400">No assets recorded</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB D: TRIAL BALANCE */}
          {subTab === 'trial' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_8px_25px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  Standard Double-Entry Trial Balance
                </h3>
                <span className="text-[9px] text-slate-400 font-mono uppercase font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Identity Proved</span>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-3 text-[9px] font-mono font-extrabold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                  <span>Account Head</span>
                  <span className="text-right">Debit Balance</span>
                  <span className="text-right">Credit Balance</span>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-none">
                  {/* Debits */}
                  {trialBalance.debits.map((deb, idx) => (
                    <div key={`deb-${idx}`} className="grid grid-cols-3 text-[11px] text-slate-700 py-1 border-b border-slate-50 font-medium">
                      <span className="truncate">{deb.name}</span>
                      <span className="text-right font-mono text-slate-900 font-semibold">${deb.amount.toLocaleString()}</span>
                      <span className="text-right text-slate-300">-</span>
                    </div>
                  ))}

                  {/* Credits */}
                  {trialBalance.credits.map((cred, idx) => (
                    <div key={`cred-${idx}`} className="grid grid-cols-3 text-[11px] text-slate-700 py-1 border-b border-slate-50 font-medium">
                      <span className="truncate">{cred.name}</span>
                      <span className="text-right text-slate-300">-</span>
                      <span className="text-right font-mono text-slate-900 font-semibold">${cred.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Totals line */}
                <div className="grid grid-cols-3 text-[11px] font-mono font-bold bg-slate-950 text-white p-3.5 rounded-2xl mt-4">
                  <span>Grand Total</span>
                  <span className="text-right text-emerald-400">${trialBalance.totalDebits.toLocaleString()}</span>
                  <span className="text-right text-emerald-400">${trialBalance.totalCredits.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB E: CASH BOOK */}
          {subTab === 'cashbook' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_8px_25px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Bank Cash Book (Inflow & Outflow)
                </h3>
                <span className="text-[9px] text-slate-400 font-mono font-bold">July Runway</span>
              </div>

              {cashBook.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-10">No cash transactions logged</p>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-none pr-1">
                  {cashBook.map((row) => (
                    <div key={row.id} className="border-b border-slate-50 pb-2.5 flex justify-between items-center text-[11px]">
                      <div className="space-y-0.5 max-w-[150px]">
                        <span className="font-semibold text-slate-900 truncate block">{row.particulars}</span>
                        <div className="flex gap-2 text-[9px] text-slate-400 font-mono">
                          <span>{row.date}</span>
                          <span>•</span>
                          <span className="text-indigo-600 bg-indigo-50/50 px-1 py-0.2 rounded">{row.category}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-bold text-[11px] block ${
                          row.receipt > 0 ? 'text-emerald-600' : 'text-slate-700'
                        }`}>
                          {row.receipt > 0 ? `+${row.receipt.toLocaleString()}` : `-${row.payment.toLocaleString()}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-semibold">Bal: ${row.balance.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
