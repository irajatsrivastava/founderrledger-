import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Calendar, Eye } from 'lucide-react';

interface SpendingChartsProps {
  transactions: Transaction[];
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({ transactions }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; income: number; expense: number } | null>(null);

  // Group transactions by date for the timeline
  const timelineData = useMemo(() => {
    const datesMap: { [key: string]: { income: number; expense: number } } = {};
    
    // Initialize current month's days (July 2026, days 1 to 15)
    for (let i = 1; i <= 15; i++) {
      const dayStr = `2026-07-${i.toString().padStart(2, '0')}`;
      datesMap[dayStr] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const amt = t.amount;
      const isIncome = t.type === 'income';
      const dateKey = t.date;

      if (!datesMap[dateKey]) {
        datesMap[dateKey] = { income: 0, expense: 0 };
      }

      if (isIncome) {
        datesMap[dateKey].income += amt;
      } else {
        datesMap[dateKey].expense += amt;
      }
    });

    return Object.entries(datesMap)
      .map(([date, val]) => ({
        date,
        day: parseInt(date.split('-')[2]),
        income: val.income,
        expense: val.expense
      }))
      .sort((a, b) => a.day - b.day);
  }, [transactions]);

  // Max values for scaling SVG
  const maxAmount = useMemo(() => {
    const vals = timelineData.flatMap(d => [d.income, d.expense]);
    const maxVal = Math.max(...vals, 1000);
    return Math.ceil(maxVal / 1000) * 1000; // Round up to nearest thousand
  }, [timelineData]);

  // Expenses breakdown by category
  const categoryBreakdown = useMemo(() => {
    const catMap: { [key: string]: { amount: number; type: 'income' | 'expense'; accountingType: string } } = {};
    let totalExpenseAmount = 0;

    transactions.forEach(t => {
      if (t.type === 'expense') {
        totalExpenseAmount += t.amount;
        if (!catMap[t.category]) {
          catMap[t.category] = { amount: 0, type: 'expense', accountingType: t.accountingType };
        }
        catMap[t.category].amount += t.amount;
      }
    });

    return Object.entries(catMap)
      .map(([category, val]) => ({
        category,
        amount: val.amount,
        percentage: totalExpenseAmount > 0 ? (val.amount / totalExpenseAmount) * 100 : 0,
        accountingType: val.accountingType
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // SVG dimensions for the Cash Flow Timeline
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 20;

  const points = useMemo(() => {
    if (timelineData.length === 0) return { incomePath: '', expensePath: '', incomeDots: [], expenseDots: [] };

    const getX = (index: number) => {
      return paddingX + (index / (timelineData.length - 1)) * (svgWidth - paddingX * 2);
    };

    const getY = (amount: number) => {
      if (maxAmount === 0) return svgHeight - paddingY;
      return svgHeight - paddingY - (amount / maxAmount) * (svgHeight - paddingY * 2);
    };

    const incomeCoordinates = timelineData.map((d, i) => ({ x: getX(i), y: getY(d.income), data: d }));
    const expenseCoordinates = timelineData.map((d, i) => ({ x: getX(i), y: getY(d.expense), data: d }));

    const buildPath = (coords: { x: number; y: number }[]) => {
      if (coords.length === 0) return '';
      return `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(' ');
    };

    const buildAreaPath = (coords: { x: number; y: number }[]) => {
      if (coords.length === 0) return '';
      const startX = coords[0].x;
      const endX = coords[coords.length - 1].x;
      const bottomY = svgHeight - paddingY;
      return `${buildPath(coords)} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
    };

    return {
      incomePath: buildPath(incomeCoordinates),
      incomeArea: buildAreaPath(incomeCoordinates),
      expensePath: buildPath(expenseCoordinates),
      expenseArea: buildAreaPath(expenseCoordinates),
      incomeDots: incomeCoordinates,
      expenseDots: expenseCoordinates
    };
  }, [timelineData, maxAmount]);

  return (
    <div id="analytics-section" className="space-y-4">
      
      {/* Interactive Timeline Chart with Spring Entrance */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden relative"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 font-display">Cash Flow Timeline</h3>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 font-sans">Corporate capital activity dynamics</p>
          </div>
          <div className="flex items-center gap-2.5 text-[9px]">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse"></span>
              Inflow
            </span>
            <span className="flex items-center gap-1.5 text-rose-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block"></span>
              Outflow
            </span>
          </div>
        </div>

        {/* Dynamic Tooltip on Hover/Tap */}
        <div className="h-8 mb-1.5 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {hoveredPoint ? (
              <motion.div 
                key="tooltip"
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="flex items-center justify-between w-full text-[10px] bg-slate-950 text-white px-3 py-1.5 rounded-full shadow-sm"
              >
                <span className="flex items-center gap-1 font-bold font-display">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  July {hoveredPoint.date.split('-')[2]}
                </span>
                <div className="flex gap-3 font-mono font-bold">
                  <span className="text-emerald-400">In: +${hoveredPoint.income.toLocaleString()}</span>
                  <span className="text-rose-400">Out: -${hoveredPoint.expense.toLocaleString()}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] text-slate-400 text-center italic flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> Tap coordinates below to audit daily values
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom SVG Line/Area Chart */}
        <div className="relative select-none w-full">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
          >
            {/* Gradients */}
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#e2e8f0" strokeWidth="1" />

            {/* Grid labels */}
            <text x={paddingX - 10} y={paddingY + 3} textAnchor="end" fill="#94a3b8" className="text-[7.5px] font-mono font-semibold">${maxAmount.toLocaleString()}</text>
            <text x={paddingX - 10} y={svgHeight / 2 + 3} textAnchor="end" fill="#94a3b8" className="text-[7.5px] font-mono font-semibold">${(maxAmount / 2).toLocaleString()}</text>
            <text x={paddingX - 10} y={svgHeight - paddingY + 3} textAnchor="end" fill="#94a3b8" className="text-[7.5px] font-mono font-semibold">$0</text>

            {/* Area under curves */}
            {points.incomeArea && (
              <motion.path 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                d={points.incomeArea} 
                fill="url(#incomeGrad)" 
              />
            )}
            {points.expenseArea && (
              <motion.path 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                d={points.expenseArea} 
                fill="url(#expenseGrad)" 
              />
            )}

            {/* Income line with draw-in effect */}
            {points.incomePath && (
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                d={points.incomePath} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {/* Expense line with draw-in effect */}
            {points.expensePath && (
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.15 }}
                d={points.expensePath} 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {/* Interactive dot nodes */}
            {points.incomeDots.map((pt, i) => (
              <g key={`in-${i}`}>
                {hoveredPoint?.date === pt.data.date && (
                  <circle cx={pt.x} cy={pt.y} r="8" fill="#10b981" fillOpacity="0.25" className="transition-all duration-150" />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-150 transition-transform duration-100"
                  onMouseEnter={() => setHoveredPoint(pt.data)}
                  onTouchStart={() => setHoveredPoint(pt.data)}
                />
              </g>
            ))}

            {points.expenseDots.map((pt, i) => (
              <g key={`ex-${i}`}>
                {hoveredPoint?.date === pt.data.date && (
                  <circle cx={pt.x} cy={pt.y} r="8" fill="#ef4444" fillOpacity="0.25" className="transition-all duration-150" />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#ef4444"
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-150 transition-transform duration-100"
                  onMouseEnter={() => setHoveredPoint(pt.data)}
                  onTouchStart={() => setHoveredPoint(pt.data)}
                />
              </g>
            ))}

            {/* Date labels under the chart */}
            {timelineData.map((d, i) => {
              if (i % Math.ceil(timelineData.length / 5) !== 0 && i !== timelineData.length - 1) return null;
              const xPos = paddingX + (i / (timelineData.length - 1)) * (svgWidth - paddingX * 2);
              return (
                <text
                  key={`lbl-${i}`}
                  x={xPos}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  fill="#94a3b8"
                  className="text-[7.5px] font-mono font-extrabold"
                >
                  {d.day}
                </text>
              );
            })}
          </svg>
        </div>
      </motion.div>

      {/* Expense Category Breakdown with Cascading Entry */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
        className="bg-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(0,0,0,0.02)] border border-slate-100"
      >
        <div className="flex items-center gap-1.5 mb-4">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-900 font-display">Outflow Distribution Breakdown</h3>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-[11px] text-slate-400">No expenditures recorded yet to distribute</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categoryBreakdown.map((item, idx) => {
              const colorClass = 
                item.accountingType === 'trading_cogs' ? 'bg-amber-500' :
                item.accountingType === 'asset' ? 'bg-indigo-600' :
                'bg-rose-500';

              const textBadgeColor = 
                item.accountingType === 'trading_cogs' ? 'text-amber-700 border-amber-100 bg-amber-50' :
                item.accountingType === 'asset' ? 'text-indigo-700 border-indigo-100 bg-indigo-50' :
                'text-rose-700 border-rose-100 bg-rose-50';

              return (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.15, type: "spring", stiffness: 150, damping: 20 }}
                  className="group flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-800 font-bold">{item.category}</span>
                      <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${textBadgeColor} font-bold font-mono`}>
                        {item.accountingType === 'trading_cogs' ? 'COGS' : item.accountingType === 'asset' ? 'Asset' : 'OpEx'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="text-slate-900 font-extrabold">${item.amount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({item.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  
                  {/* Progress bar with spring animation */}
                  <div className="w-full bg-[#F3F4F6] h-2 rounded-full overflow-hidden relative border border-slate-100/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 15, delay: idx * 0.05 + 0.2 }}
                      className={`h-full rounded-full ${colorClass}`}
                    ></motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
