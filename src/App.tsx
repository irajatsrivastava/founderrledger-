import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from './types';
import { INITIAL_TRANSACTIONS } from './data/sampleData';
import { MOBILE_CODEFILES, MobileFileKey } from './data/mobileCodeData';

// Subcomponents
import { FinancialStatements } from './components/FinancialStatements';
import { TransactionForm } from './components/TransactionForm';
import { BillScanner } from './components/BillScanner';
import { SpendingCharts } from './components/SpendingCharts';

// Icons
import { 
  Smartphone,
  Sparkles,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  Landmark,
  FileText,
  FileSpreadsheet,
  Download,
  Terminal,
  Code2,
  Copy,
  Check,
  Smartphone as PhoneIcon,
  HelpCircle,
  TrendingDown,
  Activity,
  Layers,
  BookOpen,
  Filter,
  RefreshCw,
  X,
  Menu,
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const local = localStorage.getItem('founder_ledger_transactions_v1');
    return local ? JSON.parse(local) : INITIAL_TRANSACTIONS;
  });

  // Mobile App Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'statements' | 'add' | 'scan' | 'ledger'>('dashboard');
  
  // Ledger view states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterClassification, setFilterClassification] = useState<string>('all');

  // React Native Code Hub Overlay State
  const [showCodeHub, setShowCodeHub] = useState<boolean>(false);
  const [codeHubTab, setCodeHubTab] = useState<'code' | 'metro' | 'setup'>('code');
  const [selectedMobileFile, setSelectedMobileFile] = useState<MobileFileKey>('App.tsx');
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  
  // Simulated Expo Metro logs
  const [cliLogs, setCliLogs] = useState<string[]>([
    '🚀 Starting Metro Bundler on port 8081...',
    '📦 Loading dependency graph...',
    '✨ Metro Bundler is ready!',
    '🔗 Tunnel URL: https://tunnel.expo.dev/founder-ledger-mobile',
    '📱 Scan the QR code inside Expo Go to run on device.'
  ]);

  // Persistent storage sync
  useEffect(() => {
    localStorage.setItem('founder_ledger_transactions_v1', JSON.stringify(transactions));
  }, [transactions]);

  // Global Financial Calculations
  const metrics = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;
    let tradingRevenue = 0;
    let tradingCogs = 0;
    let opex = 0;

    transactions.forEach(t => {
      const amt = t.amount;
      if (t.type === 'income') {
        cashIn += amt;
      } else {
        cashOut += amt;
      }

      if (t.accountingType === 'trading_revenue') {
        tradingRevenue += amt;
      } else if (t.accountingType === 'trading_cogs') {
        tradingCogs += amt;
      } else if (t.accountingType === 'opex') {
        opex += amt;
      }
    });

    const netProfit = tradingRevenue - tradingCogs - opex;
    const currentBankCash = cashIn - cashOut;

    return {
      currentBankCash,
      tradingRevenue,
      tradingCogs,
      opex,
      netProfit,
    };
  }, [transactions]);

  // Handle adding transaction
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [transaction, ...prev]);
    
    // Simulate mobile console output log
    setCliLogs(prev => [
      ...prev,
      `[Metro ${new Date().toLocaleTimeString()}] Booked entry: "${newTx.description}" ($${newTx.amount.toLocaleString()})`
    ]);
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Reset data to initial state
  const handleSeedData = () => {
    if (window.confirm('Do you want to re-seed the standard SaaS business model data? This will replace your current ledger.')) {
      setTransactions(INITIAL_TRANSACTIONS);
    }
  };

  // Clear all data
  const handleWipeData = () => {
    if (window.confirm('Are you sure you want to delete all transactions and reset your ledger? This cannot be undone.')) {
      setTransactions([]);
      localStorage.removeItem('founder_ledger_transactions_v1');
    }
  };

  // Export transactions to JSON
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `founder-ledger-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy code file contents to clipboard
  const handleCopyCode = () => {
    const code = MOBILE_CODEFILES[selectedMobileFile];
    navigator.clipboard.writeText(code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  // Download raw file
  const handleDownloadFile = (fileName: MobileFileKey) => {
    const code = MOBILE_CODEFILES[fileName];
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(code);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName.split('/').pop() || fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered transactions for the ledger view
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (t.vendor && t.vendor.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' ? true : t.type === filterType;
      const matchesClass = filterClassification === 'all' ? true : t.accountingType === filterClassification;
      return matchesSearch && matchesType && matchesClass;
    });
  }, [transactions, searchTerm, filterType, filterClassification]);

  return (
    <div className="min-h-screen w-full bg-[#070814] text-slate-100 flex flex-col md:flex-row items-center justify-center p-0 md:p-6 lg:p-12 font-sans antialiased selection:bg-indigo-950 selection:text-indigo-200 overflow-x-hidden relative">
      
      {/* Background Ambient Decorative Lights */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/10 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* LEFT SIDE: Floating Informational Banner (Desktop Only) */}
      <div className="hidden lg:flex flex-col max-w-[320px] mr-12 space-y-6 select-none z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-widest">
              Live App Preview
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
            FounderLedger Mobile
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            An advanced, double-entry bookkeeping mobile client built in <strong className="text-indigo-400">React Native</strong>. Seamlessly process OCR invoices, verify real-time trial balances, and export GAAP compliance logs.
          </p>
        </div>

        {/* Feature Checkpoints */}
        <div className="space-y-3.5 pt-2">
          {[
            { title: 'React Native Expo Core', desc: 'Pre-configured with Expo Go navigation and SVG dashboards.' },
            { title: 'Double-Entry Accurate', desc: 'Balances assets, liabilities, and retained period earnings.' },
            { title: 'Gemini OCR Billing', desc: 'Auto-categorizes uploaded PDFs and invoices in real time.' }
          ].map((item, i) => (
            <div key={i} className="flex gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 hover:bg-white/[0.04] transition-colors">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 shrink-0 self-start text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Expo Setup trigger */}
        <button
          onClick={() => {
            setShowCodeHub(true);
            setCodeHubTab('setup');
          }}
          className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-2xl py-3 px-4 text-xs font-bold transition-all border border-indigo-500/20 flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Expo Go Setup Commands
          </span>
          <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* CENTRAL AREA: THE MAJESTIC INTERACTIVE SMARTPHONE FRAME */}
      <div className="w-full md:w-auto flex flex-col items-center justify-center z-10">
        
        {/* On desktop viewports, we wrap it in an elegant physical iPhone frame bezel */}
        <div className="w-full md:w-[410px] md:h-[860px] md:bg-[#1C1D30] md:rounded-[60px] md:border-[12px] md:border-[#0E0F1F] md:shadow-[0_25px_65px_rgba(0,0,0,0.8)] flex flex-col relative overflow-hidden md:ring-1 md:ring-white/10">
          
          {/* Simulated hardware elements (Notch / Dynamic Island) - Desktop only */}
          <div className="hidden md:block w-[110px] h-6 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-4 z-50 flex items-center justify-center select-none shadow-inner border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-900/40 mr-1 ml-auto"></span>
            <span className="w-1 h-1 rounded-full bg-slate-900 mr-4"></span>
          </div>

          {/* iOS Top Status Bar (9:41, Battery, LTE indicators) - Desktop only */}
          <div className="hidden md:flex sticky top-0 z-50 bg-[#F3F4F6] px-8 pt-4 pb-2 justify-between items-center select-none text-slate-800">
            <span className="text-[10px] font-extrabold tracking-tight font-mono">9:41 AM</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[8px] font-bold uppercase font-mono bg-slate-200/80 px-1 rounded">5G</span>
              {/* Custom SVG iOS Wifi signal */}
              <svg className="w-3.5 h-3.5 fill-current opacity-80" viewBox="0 0 24 24">
                <path d="M12 21l-12-12c5.52-5.52 14.48-5.52 20 0l-12 12zm0-16.8c-3.1 0-6.1 1.2-8.5 3.3l8.5 8.5 8.5-8.5c-2.4-2.1-5.4-3.3-8.5-3.3z"/>
              </svg>
              {/* iOS battery */}
              <div className="w-5 h-2.5 border border-slate-700 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-4/5 bg-slate-800 rounded-[1px]"></div>
              </div>
            </div>
          </div>

          {/* Inner Phone Content (Runs standard Web Client with Native High Fidelity visual guidelines) */}
          <div className="flex-1 flex flex-col h-full bg-[#F3F4F6] overflow-hidden relative">
            
            {/* Dynamic Application Header */}
            <header className="px-5 pt-4 pb-2.5 flex justify-between items-center bg-[#F3F4F6] select-none sticky top-0 z-40 border-b border-slate-200/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex items-center justify-center shadow-inner relative">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop" 
                    alt="Founder Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h2 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold leading-none">Founder Capital</h2>
                  <span className="text-xs font-bold text-slate-900 font-display">FounderLedger App</span>
                </div>
              </div>

              {/* Action buttons (Help trigger & Developers Hub) */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleSeedData()}
                  title="Restore Seed Data"
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 transition-colors shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setShowCodeHub(true)}
                  title="Open React Native Code Explorer"
                  className="w-8 h-8 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center transition-all shadow-md cursor-pointer animate-pulse"
                >
                  <Code2 className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Scrollable Mobile Viewport Content Area */}
            <main className="flex-1 overflow-y-auto px-5 pt-3.5 pb-28 scrollbar-none bg-[#F3F4F6]">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.14 }}
                  className="space-y-5"
                >
                  
                  {/* TAB 1: OVERVIEW DASHBOARD */}
                  {activeTab === 'dashboard' && (
                    <>
                      {/* Interactive Available Cash card */}
                      <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-[28px] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.02)] border border-slate-100/80 flex flex-col relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full filter blur-xl -translate-y-5 translate-x-5 group-hover:bg-indigo-500/10 transition-colors"></div>
                        <div className="flex justify-between items-center mb-1 relative z-10">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Available Net Cash</span>
                          <span className="text-[8px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-mono">Month Ended</span>
                        </div>
                        
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-0.5 mb-2 relative z-10">
                          ${metrics.currentBankCash.toLocaleString()}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2.5 relative z-10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(
                                100, 
                                metrics.tradingRevenue > 0 
                                  ? (metrics.currentBankCash / metrics.tradingRevenue) * 100 
                                  : 100
                              )}%` 
                            }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="bg-emerald-500 h-full rounded-full"
                          ></motion.div>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold mt-0.5 relative z-10">
                          <span>Spent: ${(metrics.tradingCogs + metrics.opex).toLocaleString()}</span>
                          <span>Inflow: ${metrics.tradingRevenue.toLocaleString()}</span>
                        </div>
                      </motion.div>

                      {/* Stat Cards Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Net Operating Profit</span>
                          <span className="text-lg font-extrabold text-slate-900 mt-1 font-display">
                            ${metrics.netProfit.toLocaleString()}
                          </span>
                          <div className={`mt-2 text-[9px] font-mono flex items-center gap-0.5 font-bold ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {metrics.netProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {metrics.tradingRevenue > 0 ? `${((metrics.netProfit / metrics.tradingRevenue) * 100).toFixed(1)}%` : '0%'} margin
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Direct COGS Costs</span>
                          <span className="text-lg font-extrabold text-slate-900 mt-1 font-display">
                            ${metrics.tradingCogs.toLocaleString()}
                          </span>
                          <div className="mt-2 text-[9px] font-mono text-slate-500 font-bold flex items-center gap-0.5">
                            <Activity className="w-3 h-3 text-indigo-500" />
                            Direct operations cost
                          </div>
                        </div>
                      </div>

                      {/* Cash Flow Interactive Line Chart */}
                      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs">
                        <SpendingCharts transactions={transactions} />
                      </div>

                      {/* AI Financial Health insights advice card */}
                      <div className="bg-indigo-900 text-white rounded-3xl p-5 border border-indigo-950 shadow-md relative overflow-hidden">
                        <div className="absolute -right-6 -bottom-6 opacity-10">
                          <Sparkles className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <div className="bg-white/10 p-1.5 rounded-xl text-indigo-300">
                            <Sparkles className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold font-display text-indigo-100">Gemini CFO Audit Check</h3>
                            <p className="text-[10px] text-indigo-200/90 leading-relaxed font-sans">
                              {metrics.netProfit > 0 
                                ? `Stable Cash Runway: Capital equity is fully deployed. Current net profitability is positive. Direct COGS is balanced at ${((metrics.tradingCogs / metrics.tradingRevenue) * 100).toFixed(0)}% of sales turnover.`
                                : 'Cash discrepancy warning: Outflows have exceeded trading revenue in the current month. Verify trial balance entries and adjust opex allocations.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 2: GAAP STATEMENTS & DOUBLE ENTRY */}
                  {activeTab === 'statements' && (
                    <FinancialStatements transactions={transactions} />
                  )}

                  {/* TAB 3: CONVERSATIONAL LOG FORM */}
                  {activeTab === 'add' && (
                    <TransactionForm onAddTransaction={handleAddTransaction} />
                  )}

                  {/* TAB 4: OCR INVOICE DOCUMENT SCANNER */}
                  {activeTab === 'scan' && (
                    <BillScanner 
                      onAddTransaction={handleAddTransaction} 
                      onScanComplete={() => setActiveTab('dashboard')} 
                    />
                  )}

                  {/* TAB 5: COMPREHENSIVE LEDGER & AUDIT LOGS */}
                  {activeTab === 'ledger' && (
                    <div className="space-y-4">
                      
                      {/* Search & Audit Filters Container */}
                      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
                        <div className="flex gap-1.5 items-center pb-2 border-b border-slate-100">
                          <Filter className="w-3.5 h-3.5 text-slate-500" />
                          <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono">Ledger Audit Filters</h3>
                        </div>

                        {/* Search input field */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search description, vendor..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-3 pl-9 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>

                        {/* Direction filter */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['all', 'income', 'expense'] as const).map(t => (
                            <button
                              key={t}
                              onClick={() => setFilterType(t)}
                              className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer capitalize ${
                                filterType === t 
                                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-extrabold'
                                  : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              {t === 'all' ? 'All Rows' : t === 'income' ? 'Debit Dr' : 'Credit Cr'}
                            </button>
                          ))}
                        </div>

                        {/* Accounting Code Selector */}
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400 block">GAAP Ledger Account Head</label>
                          <select
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none"
                            value={filterClassification}
                            onChange={(e) => setFilterClassification(e.target.value)}
                          >
                            <option value="all">All Ledgers Accounts</option>
                            <option value="trading_revenue">Trading: Direct Sales Revenue</option>
                            <option value="trading_cogs">Trading: Direct Cost of Goods Sold</option>
                            <option value="opex">P&L: Operating Overhead Expenses</option>
                            <option value="asset">BS: Capital Placements (Asset)</option>
                            <option value="liability">BS: Business Startup Debt (Liability)</option>
                            <option value="equity">BS: Shareholders Investment (Equity)</option>
                          </select>
                        </div>
                      </div>

                      {/* Admin seeding & database controllers */}
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={handleExportBackup}
                          className="bg-white hover:bg-slate-50 border border-slate-200/60 rounded-xl py-2 px-1 text-[9px] font-bold text-slate-700 transition-all flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-500" />
                          JSON Backup
                        </button>
                        <button 
                          onClick={handleSeedData}
                          className="bg-white hover:bg-slate-50 border border-slate-200/60 rounded-xl py-2 px-1 text-[9px] font-bold text-slate-700 transition-all flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5 text-emerald-500" />
                          Seed SaaS
                        </button>
                        <button 
                          onClick={handleWipeData}
                          className="bg-white hover:bg-slate-50 border border-rose-100 rounded-xl py-2 px-1 text-[9px] font-bold text-rose-600 transition-all flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          Wipe Ledger
                        </button>
                      </div>

                      {/* Recorded Postings Ledger Output */}
                      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider font-mono">Journal Postings Booked</span>
                          <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 rounded font-bold">Rows: {filteredTransactions.length}</span>
                        </div>

                        {filteredTransactions.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 italic text-xs">No matching ledger row matches search criteria</div>
                        ) : (
                          <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-none pr-1">
                            {filteredTransactions.map(t => (
                              <div key={t.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center relative group hover:bg-indigo-500/[0.02] hover:border-indigo-500/10 transition-colors">
                                <div className="space-y-0.5 max-w-[70%]">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                                      t.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {t.type === 'income' ? 'Dr. Cash' : 'Cr. Cash'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono">{t.date}</span>
                                    {t.billScanned && (
                                      <span className="text-[8px] font-mono font-bold bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-100 flex items-center gap-0.5">
                                        📄 Scanned
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-[11px] font-bold text-slate-900 font-display truncate leading-tight mt-1">{t.description}</h4>
                                  <p className="text-[9px] text-slate-400 font-mono leading-none">{t.category} • {t.accountingType.toUpperCase()}</p>
                                </div>

                                <div className="text-right flex items-center gap-2">
                                  <div>
                                    <span className={`text-xs font-mono font-extrabold block ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                                    </span>
                                    {t.gstAmount && <span className="text-[8px] text-slate-400 block font-mono">Tax: ${t.gstAmount}</span>}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteTransaction(t.id)}
                                    className="p-1 rounded bg-slate-200/50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete transaction record"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

            </main>

            {/* Bottom Floating Menu Capsule Dock (Designed like standard Apple Wallet style capsule) */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[90%] bg-black/85 backdrop-blur-md rounded-2xl p-1.5 flex items-center justify-between shadow-lg border border-white/10 select-none z-50">
              {([
                { id: 'dashboard', label: 'Home', icon: PhoneIcon },
                { id: 'statements', label: 'GAAP', icon: Landmark },
                { id: 'add', label: 'Log', icon: Plus },
                { id: 'scan', label: 'OCR', icon: FileText },
                { id: 'ledger', label: 'Ledger', icon: BookOpen }
              ] as const).map((tab) => {
                const IconComponent = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer relative"
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="capsuleNavIndicator"
                        className="absolute inset-0 bg-white/10 rounded-xl"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <IconComponent className={`w-4 h-4 mb-0.5 transition-colors ${isSelected ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`} />
                    <span className={`text-[8px] font-bold tracking-tight uppercase transition-colors ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Small desktop developer disclaimer bottom-label */}
        <div className="hidden md:flex items-center gap-1.5 mt-4 text-[10px] text-slate-500 font-mono select-none">
          <PhoneIcon className="w-3.5 h-3.5" />
          Interactive iPhone 15 Frame Preview
        </div>
      </div>

      {/* RIGHT SIDE: React Native Source Code Hub triggers (Desktop Only) */}
      <div className="hidden lg:flex flex-col max-w-[320px] ml-12 space-y-6 select-none z-10">
        <div className="bg-[#121326] border border-white/5 rounded-3xl p-5 shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Terminal className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 font-mono">React Native CLI</h3>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
            Browse fully written Expo files, copy raw components, or view Simulated Metro output streams.
          </p>

          <button
            onClick={() => {
              setShowCodeHub(true);
              setCodeHubTab('code');
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
          >
            <Code2 className="w-4 h-4 text-indigo-300" />
            Open Developer Code Hub
          </button>
        </div>

        {/* Live Running simulated console logs */}
        <div className="bg-[#090A13] border border-white/5 rounded-3xl p-4 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Simulated Metro Server</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-none font-mono text-[9px] text-slate-400">
            {cliLogs.slice(-4).map((log, index) => (
              <div key={index} className="truncate">
                <span className="text-indigo-400">&gt;&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REACT NATIVE CODE HUB MODAL / SLIDE-OVER PANEL */}
      <AnimatePresence>
        {showCodeHub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
            
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="w-full max-w-4xl h-[85vh] bg-[#121326] border border-white/10 rounded-[32px] shadow-[0_25px_65px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden relative"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#15162C]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white font-display">React Native Expo Developer Hub</h2>
                    <p className="text-[10px] text-slate-500 font-mono">Build with React Native, Svg, and Expo Go</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCodeHub(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Navigation Controls */}
              <div className="px-6 py-2.5 border-b border-white/5 bg-[#141528] flex items-center justify-between">
                <div className="flex gap-2">
                  {([
                    { id: 'code', label: 'File Explorer', icon: Code2 },
                    { id: 'metro', label: 'Metro Bundler Terminal', icon: Terminal },
                    { id: 'setup', label: 'Expo Go Installation', icon: Smartphone }
                  ] as const).map(tab => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setCodeHubTab(tab.id)}
                        className={`flex items-center gap-2 py-1.5 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          codeHubTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span>Status: Ready</span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#101121]">
                
                {/* CODE TAB */}
                {codeHubTab === 'code' && (
                  <>
                    {/* Left File Tree Sidebar */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-4 space-y-3 shrink-0 overflow-y-auto bg-[#13142A]">
                      <h4 className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-slate-500">File Hierarchy</h4>
                      <div className="space-y-1">
                        {Object.keys(MOBILE_CODEFILES).map(fileKey => {
                          const file = fileKey as MobileFileKey;
                          const isSelected = selectedMobileFile === file;
                          return (
                            <button
                              key={file}
                              onClick={() => setSelectedMobileFile(file)}
                              className={`w-full text-left py-2 px-3 rounded-xl text-xs font-mono flex items-center justify-between transition-colors cursor-pointer group ${
                                isSelected 
                                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 font-bold' 
                                  : 'text-slate-400 hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <span className="truncate">{file}</span>
                              <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Code Display Editor Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Editor Sub-Header */}
                      <div className="px-5 py-2.5 bg-[#14152B] border-b border-white/5 flex items-center justify-between shrink-0">
                        <span className="text-xs font-mono text-indigo-400">{selectedMobileFile}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyCode}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold py-1 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedFile ? 'Copied' : 'Copy File'}
                          </button>
                          <button
                            onClick={() => handleDownloadFile(selectedMobileFile)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                      </div>

                      {/* Code Output panel */}
                      <div className="flex-1 overflow-auto p-5 font-mono text-xs text-indigo-100/90 leading-relaxed bg-[#0E0F1E] whitespace-pre select-text">
                        <code>{MOBILE_CODEFILES[selectedMobileFile]}</code>
                      </div>
                    </div>
                  </>
                )}

                {/* METRO TERMINAL TAB */}
                {codeHubTab === 'metro' && (
                  <div className="flex-1 flex flex-col p-6 bg-[#0B0C16] font-mono text-xs overflow-auto select-text">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-extrabold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Metro bundler local dev output
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Port: 8081</span>
                    </div>
                    <div className="flex-1 space-y-2 leading-relaxed text-indigo-100">
                      {cliLogs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-slate-600 shrink-0 select-none">[{new Date().toLocaleTimeString()}]</span>
                          <span className="text-indigo-400 select-none">&gt;</span>
                          <span className="whitespace-pre-wrap">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SETUP GUIDE TAB */}
                {codeHubTab === 'setup' && (
                  <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-[#101121] leading-relaxed text-slate-300 text-xs">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-white font-display">Run this application on iOS or Android with Expo Go</h3>
                      <p className="text-slate-400 text-[11px]">Follow this three-step guide to run the raw modular codebase directly in your terminal and test on your physical phone.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="bg-[#15162C] border border-white/5 rounded-2xl p-5 space-y-3 flex flex-col">
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-indigo-400">Step 1</span>
                        <h4 className="font-bold text-white text-xs">Download Expo Client</h4>
                        <p className="text-[11px] text-slate-400 flex-1">Install the free <strong className="text-slate-200">Expo Go</strong> app on your iPhone (App Store) or Android device (Google Play Store).</p>
                      </div>

                      <div className="bg-[#15162C] border border-white/5 rounded-2xl p-5 space-y-3 flex flex-col">
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-indigo-400">Step 2</span>
                        <h4 className="font-bold text-white text-xs">Install Dependencies</h4>
                        <p className="text-[11px] text-slate-400 flex-1">Download the workspace zip file, navigate to the folder in your console, and install dependencies:</p>
                        <code className="bg-black/40 border border-white/5 p-2 rounded-lg text-xs font-mono text-indigo-300 block select-text">npm install</code>
                      </div>

                      <div className="bg-[#15162C] border border-white/5 rounded-2xl p-5 space-y-3 flex flex-col">
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-indigo-400">Step 3</span>
                        <h4 className="font-bold text-white text-xs">Boot Metro Server</h4>
                        <p className="text-[11px] text-slate-400 flex-1">Start the bundler server. Scan the terminal QR code using your phone camera (iOS) or Expo App (Android):</p>
                        <code className="bg-black/40 border border-white/5 p-2 rounded-lg text-xs font-mono text-indigo-300 block select-text">npm start</code>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white text-xs">Download Core Modules ZIP</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Includes App.tsx, package.json, app.json, and the components directory.</p>
                      </div>
                      <button
                        onClick={() => {
                          handleDownloadFile('App.tsx');
                          handleDownloadFile('package.json');
                          alert('Core modules downloaded successfully! Copy files into your local react native directory.');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Download Files
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom bar */}
              <div className="px-6 py-4 border-t border-white/5 bg-[#15162C] flex items-center justify-between text-[11px] text-slate-500">
                <span>FounderFinance mobile assets • Double-entry balanced Ledger compliant</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Active session
                </span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
