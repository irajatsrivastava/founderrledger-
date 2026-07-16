import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, AccountingType } from '../types';
import { Sparkles, Plus, Calendar, DollarSign, Tag, ArrowRight, CornerDownLeft, Loader2, Info, ChevronDown, ChevronUp, Landmark, Shield, CreditCard, Tag as TagIcon } from 'lucide-react';

interface TransactionFormProps {
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  // Input fields state
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountingType, setAccountingType] = useState<AccountingType>('opex');

  // Advanced fields from Founder Finance PRD
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [isBusiness, setIsBusiness] = useState<boolean>(true);
  const [recurring, setRecurring] = useState<string>('None');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [gstAmount, setGstAmount] = useState<string>('');
  const [taxAmount, setTaxAmount] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');

  // Manual suggestion handler (e.g. auto categorizing as the description is typed)
  const handleAiAutoCategorize = async () => {
    if (!description || description.trim().length < 3) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount) || 0,
          type
        })
      });
      const data = await response.json();
      if (!data.error) {
        setCategory(data.category);
        setAccountingType(data.accountingType as AccountingType);
        setType(data.transactionType as 'income' | 'expense');
        setAiFeedback(data.explanation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Quick Chat Log parsing entire phrase
  const handleQuickAiLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiFeedback('');
    try {
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiPrompt,
          type: aiPrompt.toLowerCase().includes('received') || aiPrompt.toLowerCase().includes('earned') || aiPrompt.toLowerCase().includes('payout') || aiPrompt.toLowerCase().includes('sales') ? 'income' : 'expense'
        })
      });
      
      const data = await response.json();
      if (!data.error) {
        // Try to regex parse out any dollar amount if not returned or parse standard
        const moneyRegex = /\$?(\d+(?:\.\d{2})?)/;
        const match = aiPrompt.match(moneyRegex);
        if (match && match[1]) {
          setAmount(match[1]);
        }
        
        // Try to extract date
        const dateRegex = /(\d{4}-\d{2}-\d{2})/;
        const dateMatch = aiPrompt.match(dateRegex);
        if (dateMatch && dateMatch[1]) {
          setDate(dateMatch[1]);
        } else {
          setDate(new Date().toISOString().split('T')[0]);
        }

        setDescription(aiPrompt);
        setCategory(data.category);
        setAccountingType(data.accountingType as AccountingType);
        setType(data.transactionType as 'income' | 'expense');
        setAiFeedback(`✨ AI Auto-Filled: ${data.explanation}`);
        setAiPrompt('');
      } else {
        setAiFeedback('Could not understand. Please fill manually or refine the wording.');
      }
    } catch (err) {
      console.error(err);
      setAiFeedback('Error connecting to Gemini. Please enter manually.');
    } finally {
      setAiLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
    setAccountingType('opex');
    setAiFeedback('');
    setPaymentMethod('Bank Transfer');
    setIsBusiness(true);
    setRecurring('None');
    setNotes('');
    setTags('');
    setGstAmount('');
    setTaxAmount('');
    setInvoiceNumber('');
    setDueDate('');
    setShowAdvanced(false);
  };

  // Submit finalized manual/ai transaction
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid numeric amount.');
      return;
    }
    if (!category.trim()) {
      alert('Please provide a category.');
      return;
    }
    if (!description.trim()) {
      alert('Please provide a description.');
      return;
    }

    onAddTransaction({
      amount: parsedAmount,
      type,
      category: category.trim(),
      accountingType,
      date,
      description: description.trim(),
      paymentMethod,
      isBusiness,
      recurring,
      notes: notes.trim() || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      gstAmount: parseFloat(gstAmount) || undefined,
      taxAmount: parseFloat(taxAmount) || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      dueDate: dueDate || undefined
    });

    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick conversational AI Assist Input Box */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-16 h-16 text-indigo-500" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="bg-indigo-50 border border-indigo-100 p-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 font-display">AI Quick-Log Assistant</h3>
        </div>
        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
          Type transaction details in natural speech. Gemini will auto-fill your ledger parameters:
        </p>

        <form onSubmit={handleQuickAiLogSubmit} className="relative">
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 pr-12 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans"
            placeholder="e.g., Spent $85 on marketing on Facebook ads"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={aiLoading}
          />
          <button
            type="submit"
            className="absolute right-2 top-2 p-1.5 rounded-xl bg-black hover:bg-slate-900 active:scale-95 text-white transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </form>

        <div className="mt-2 text-[9px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1 font-medium">
          <span>💡 Try: "Received $4500 from premium client sales"</span>
          <span>•</span>
          <span>"Spent $150 on hardware equipment"</span>
        </div>
      </div>

      {/* 2. Structured Ledger Logger Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,0,0,0.02)] space-y-4">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 font-display">
          <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
          Ledger Entry Parameters
        </h3>

        {/* Transaction Flow Selector */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setType('expense')}
            className={`py-2.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm shadow-rose-100 font-extrabold'
                : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
          >
            Outflow (Expense / Asset)
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setType('income')}
            className={`py-2.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm shadow-emerald-100 font-extrabold'
                : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
          >
            Inflow (Sales / Capital)
          </motion.button>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-slate-400" /> Amount
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-mono transition-all duration-200 shadow-xs"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Date
            </label>
            <input
              type="date"
              required
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 font-mono transition-all duration-200 shadow-xs"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center">
              Description
            </label>
            {description.length > 3 && (
              <button
                type="button"
                onClick={handleAiAutoCategorize}
                disabled={aiLoading}
                className="text-[9px] text-indigo-600 hover:text-indigo-700 font-sans flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 font-bold"
              >
                <Sparkles className="w-2.5 h-2.5" /> Auto-Categorize Description
              </button>
            )}
          </div>
          <input
            type="text"
            required
            placeholder="e.g., AWS EC2 Hosting and Serverless Functions"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 shadow-xs"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleAiAutoCategorize}
          />
        </div>

        {/* Category & Accounting Type */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" /> Category
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Server Hosting"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 shadow-xs"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              Classification
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 shadow-xs"
              value={accountingType}
              onChange={(e) => setAccountingType(e.target.value as AccountingType)}
            >
              <optgroup label="Trading Account (Direct)">
                <option value="trading_revenue">Direct Trading Revenue</option>
                <option value="trading_cogs">Direct Trading COGS</option>
              </optgroup>
              <optgroup label="Profit & Loss (Overhead)">
                <option value="opex">Operating Expenses (OpEx)</option>
              </optgroup>
              <optgroup label="Balance Sheet">
                <option value="asset">Business Asset</option>
                <option value="liability">Business Liability</option>
                <option value="equity">Capital Equity</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* AI feedback indicator */}
        {aiFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3 flex gap-2 items-start text-[10px] text-slate-600 shadow-xs"
          >
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold">{aiFeedback}</p>
          </motion.div>
        )}

        {/* Collapsible Advanced Ledger Parameters (from Founder Finance PRD) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Advanced Ledger Parameters (PRD Compliance)
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3 pt-3 px-1"
              >
                {/* Row 1: Payment Method & Scope */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Payment Mode
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] text-slate-800 focus:outline-none focus:border-indigo-500"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Bank Transfer">Bank Transfer / ACH</option>
                      <option value="Credit Card">Corporate Card</option>
                      <option value="Cash">Petty Cash</option>
                      <option value="UPI">UPI Payment</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Entity Scope
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-50 border border-slate-100 p-0.5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setIsBusiness(true)}
                        className={`py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                          isBusiness ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-400'
                        }`}
                      >
                        Biz
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBusiness(false)}
                        className={`py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                          !isBusiness ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-400'
                        }`}
                      >
                        Pers.
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Recurring Frequency & Tags */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Recurring Frequency
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] text-slate-800 focus:outline-none focus:border-indigo-500"
                      value={recurring}
                      onChange={(e) => setRecurring(e.target.value)}
                    >
                      <option value="None">One-Time (None)</option>
                      <option value="Weekly">Weekly Auto-Debit</option>
                      <option value="Monthly">Monthly SaaS/Rent</option>
                      <option value="Yearly">Yearly Licensing</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Tags (Comma Separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Q3-Opex, Team-Tools"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 3: Tax breakdown (GST + Tax portion) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      GST/VAT Portion ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 15.30"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] text-slate-800 focus:outline-none"
                      value={gstAmount}
                      onChange={(e) => setGstAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Direct Tax Portion ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 4.50"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] text-slate-800 focus:outline-none"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 4: Invoice ref & Due Date */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Invoice/Ref Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-904"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] text-slate-800 focus:outline-none"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Invoice Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1 px-2 text-[11px] text-slate-800 focus:outline-none"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Accountant Notes text box */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Memo / Auditor Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide description details, payment context or GAAP overrides here..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2.5 text-[11px] text-slate-800 focus:outline-none resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit action */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-md shadow-indigo-500/10 border border-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Finalize & Log to Ledger
        </motion.button>
      </form>
    </div>
  );
};
