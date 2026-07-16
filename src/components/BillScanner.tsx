import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Transaction, AccountingType } from '../types';
import { Upload, FileText, CheckCircle, Loader2, Sparkles, FileUp, AlertCircle, Edit2 } from 'lucide-react';

interface BillScannerProps {
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onScanComplete?: () => void;
}

interface ParsedBill {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  accountingType: AccountingType;
  transactionType: 'income' | 'expense';
  description: string;
}

export const BillScanner: React.FC<BillScannerProps> = ({ onAddTransaction, onScanComplete }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedBill | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading steps animation
  const loadingMessages = [
    'Scanning document structure with Optical OCR...',
    'Interpreting raw text fields with Gemini-3.5 Vision...',
    'Isolating billing entities, line items, and totals...',
    'Assigning corresponding business categories & tax codes...',
    'Mapping costs into direct Trading COGS or indirect OpEx overhead...',
    'Drafting perfect ledger balanced entries...'
  ];

  const cycleLoadingSteps = (intervalIdRef: { current: NodeJS.Timeout | null }) => {
    setLoadingStep(0);
    intervalIdRef.current = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 2800);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError('');
    setParsedData(null);
    setFileName(file.name);

    const intervalIdRef = { current: null as NodeJS.Timeout | null };
    cycleLoadingSteps(intervalIdRef);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        if (!base64Url) {
          setError('Could not parse uploaded file.');
          setLoading(false);
          if (intervalIdRef.current) clearInterval(intervalIdRef.current);
          return;
        }

        try {
          const response = await fetch('/api/parse-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Url,
              mimeType: file.type || 'image/jpeg',
              fileName: file.name
            })
          });

          const data = await response.json();
          if (response.ok && !data.error) {
            setParsedData({
              vendor: data.vendor || 'Unknown Supplier',
              amount: parseFloat(data.amount) || 0,
              date: data.date || new Date().toISOString().split('T')[0],
              category: data.category || 'General Expense',
              accountingType: (data.accountingType || 'opex') as AccountingType,
              transactionType: (data.transactionType || 'expense') as 'income' | 'expense',
              description: data.description || 'Uploaded Invoice'
            });
          } else {
            setError(data.error || 'Gemini billing scanner could not read this document format.');
          }
        } catch (apiErr: any) {
          setError('Failed to reach AI billing server. Verify internet connection.');
        } finally {
          setLoading(false);
          if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        }
      };

      reader.onerror = () => {
        setError('File read error.');
        setLoading(false);
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Error uploading file.');
      setLoading(false);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmLog = () => {
    if (!parsedData) return;
    
    // Add transaction
    onAddTransaction({
      amount: parsedData.amount,
      type: parsedData.transactionType,
      category: parsedData.category,
      accountingType: parsedData.accountingType,
      date: parsedData.date,
      description: `${parsedData.vendor}: ${parsedData.description}`,
      vendor: parsedData.vendor,
      billScanned: true,
      billFileName: fileName
    });

    // Reset Scanner view
    setParsedData(null);
    setFileName('');
    if (onScanComplete) onScanComplete();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 border border-indigo-100 p-1.5 rounded-lg">
              <Upload className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 font-display">AI Bill & Invoice Scanner</h3>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">Any Format Accepted</span>
        </div>

        {/* Drag and Drop Zone */}
        {!loading && !parsedData && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            
            <div className="bg-white border border-slate-100 p-4 rounded-full mb-3 text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
              <FileUp className="w-6 h-6" />
            </div>

            <p className="text-xs font-bold text-slate-800">Drag & drop your bill here</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
              Supports JPEG, PNG, HEIC, or PDF invoice files up to 10MB
            </p>
            
            <button
              type="button"
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-xs"
            >
              Browse Files
            </button>
          </div>
        )}

        {/* AI Processing Screen */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 min-h-[220px]">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border-2 border-indigo-500/10 animate-ping"></div>
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            
            <p className="text-xs font-bold text-indigo-600 animate-pulse flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-bounce" /> Gemini visual auditing...
            </p>
            
            <p className="text-[10px] text-slate-400 text-center mt-3 max-w-xs h-8 px-2 transition-all duration-300 font-sans italic leading-relaxed">
              "{loadingMessages[loadingStep]}"
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-xs text-rose-800 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Processing Failed</p>
              <p className="text-[11px] text-rose-700">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-[10px] font-bold underline text-rose-600 block pt-1"
              >
                Try upload again
              </button>
            </div>
          </div>
        )}

        {/* Inspection View / parsed result review card */}
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 relative">
              <div className="flex justify-between items-start border-b border-slate-200/60 pb-2.5">
                <div>
                  <h4 className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider">Document Audited</h4>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{fileName}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{parsedData.date}</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-indigo-100 bg-indigo-50 text-indigo-600 mt-1 font-mono">
                    {parsedData.accountingType.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Amount focus */}
              <div className="flex justify-between items-center py-2 bg-white px-3 rounded-xl border border-slate-100 shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium">Extracted Total Due</span>
                <span className="text-base font-mono font-bold text-slate-900">${parsedData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Data parameters list */}
              <div className="space-y-2 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Creditor / Vendor:</span>
                  <span className="font-bold text-slate-800">{parsedData.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Suggested Category:</span>
                  <span className="font-bold text-slate-800">{parsedData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Item Summary:</span>
                  <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">{parsedData.description}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setParsedData(null); setFileName(''); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Discard Upload
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirmLog}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm & Log Transaction
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
