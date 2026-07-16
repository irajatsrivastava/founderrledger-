import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Line, Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Transaction } from '../types';

interface SpendingChartsProps {
  transactions: Transaction[];
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({ transactions }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const timelineData = useMemo(() => {
    const datesMap: { [key: string]: { income: number; expense: number } } = {};
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

  const maxAmount = useMemo(() => {
    const vals = timelineData.flatMap(d => [d.income, d.expense]);
    const maxVal = Math.max(...vals, 1000);
    return Math.ceil(maxVal / 1000) * 1000;
  }, [timelineData]);

  const categoryBreakdown = useMemo(() => {
    const catMap: { [key: string]: { amount: number; accountingType: string } } = {};
    let totalExpenseAmount = 0;

    transactions.forEach(t => {
      if (t.type === 'expense') {
        totalExpenseAmount += t.amount;
        if (!catMap[t.category]) {
          catMap[t.category] = { amount: 0, accountingType: t.accountingType };
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

  const screenWidth = Dimensions.get('window').width - 32;
  const svgWidth = screenWidth > 0 ? screenWidth : 340;
  const svgHeight = 180;
  const paddingX = 45;
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

    const incomeCoordinates = timelineData.map((d, i) => ({ x: getX(i), y: getY(d.income), data: d, index: i }));
    const expenseCoordinates = timelineData.map((d, i) => ({ x: getX(i), y: getY(d.expense), data: d, index: i }));

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
  }, [timelineData, maxAmount, svgWidth]);

  return (
    <View style={styles.container}>
      {/* 1. Cash Flow Timeline Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Cash Flow Timeline</Text>
            <Text style={styles.cardSubtitle}>Corporate capital activity dynamics</Text>
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.legendText, { color: '#10b981' }]}>Inflow</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.legendText, { color: '#ef4444' }]}>Outflow</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Tooltip */}
        <View style={styles.tooltipContainer}>
          {hoveredIndex !== null ? (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipTitle}>July {timelineData[hoveredIndex].day}</Text>
              <View style={styles.tooltipValues}>
                <Text style={styles.tooltipInflow}>In: +${timelineData[hoveredIndex].income.toLocaleString()}</Text>
                <Text style={styles.tooltipOutflow}>Out: -${timelineData[hoveredIndex].expense.toLocaleString()}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.tooltipPlaceholder}>Tap coordinates below to audit daily values</Text>
          )}
        </View>

        {/* Custom SVG Graph */}
        <View style={styles.svgContainer}>
          <Svg width={svgWidth} height={svgHeight}>
            <Defs>
              <LinearGradient id="mobileIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </LinearGradient>
              <LinearGradient id="mobileExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Grid Lines */}
            <Line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />
            <Line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />
            <Line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#e2e8f0" strokeWidth="1" />

            {/* Grid labels */}
            <SvgText x={paddingX - 10} y={paddingY + 3} textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="600" fontFamily="System">${maxAmount}</SvgText>
            <SvgText x={paddingX - 10} y={svgHeight / 2 + 3} textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="600" fontFamily="System">${maxAmount / 2}</SvgText>
            <SvgText x={paddingX - 10} y={svgHeight - paddingY + 3} textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="600" fontFamily="System">$0</SvgText>

            {/* Areas */}
            {points.incomeArea ? <Path d={points.incomeArea} fill="url(#mobileIncomeGrad)" /> : null}
            {points.expenseArea ? <Path d={points.expenseArea} fill="url(#mobileExpenseGrad)" /> : null}

            {/* Paths */}
            {points.incomePath ? <Path d={points.incomePath} fill="none" stroke="#10b981" strokeWidth="2.5" /> : null}
            {points.expensePath ? <Path d={points.expensePath} fill="none" stroke="#ef4444" strokeWidth="2.5" /> : null}

            {/* Interactive Dot Nodes */}
            {points.incomeDots.map((pt, i) => (
              <Circle
                key={`in-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === pt.index ? 6 : 4}
                fill={hoveredIndex === pt.index ? "#10b981" : "#ffffff"}
                stroke="#10b981"
                strokeWidth={hoveredIndex === pt.index ? 3 : 2}
                onPress={() => setHoveredIndex(pt.index)}
              />
            ))}

            {points.expenseDots.map((pt, i) => (
              <Circle
                key={`ex-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === pt.index ? 6 : 4}
                fill={hoveredIndex === pt.index ? "#ef4444" : "#ffffff"}
                stroke="#ef4444"
                strokeWidth={hoveredIndex === pt.index ? 3 : 2}
                onPress={() => setHoveredIndex(pt.index)}
              />
            ))}

            {/* Date Labels */}
            {timelineData.map((d, i) => {
              if (i % 3 !== 0 && i !== timelineData.length - 1) return null;
              const xPos = paddingX + (i / (timelineData.length - 1)) * (svgWidth - paddingX * 2);
              return (
                <SvgText
                  key={`lbl-${i}`}
                  x={xPos}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {d.day}
                </SvgText>
              );
            })}
          </Svg>
        </View>
      </View>

      {/* 2. Outflow distribution Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Outflow Distribution Breakdown</Text>
        {categoryBreakdown.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenditures recorded yet to distribute</Text>
          </View>
        ) : (
          <View style={styles.breakdownList}>
            {categoryBreakdown.map((item, idx) => {
              const barColor = 
                item.accountingType === 'trading_cogs' ? '#f59e0b' :
                item.accountingType === 'asset' ? '#4f46e5' :
                '#ef4444';

              const labelBadgeStyle = 
                item.accountingType === 'trading_cogs' ? styles.badgeCogs :
                item.accountingType === 'asset' ? styles.badgeAsset :
                styles.badgeOpex;

              return (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemMeta}>
                    <View style={styles.itemLabelGroup}>
                      <Text style={styles.itemCategory}>{item.category}</Text>
                      <View style={[styles.badge, labelBadgeStyle]}>
                        <Text style={styles.badgeText}>
                          {item.accountingType === 'trading_cogs' ? 'COGS' : item.accountingType === 'asset' ? 'ASSET' : 'OPEX'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemValueGroup}>
                      <Text style={styles.itemAmount}>${item.amount.toLocaleString()}</Text>
                      <Text style={styles.itemPercent}>({item.percentage.toFixed(0)}%)</Text>
                    </View>
                  </View>
                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${item.percentage}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'System',
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '700',
  },
  tooltipContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tooltip: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tooltipTitle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tooltipValues: {
    flexDirection: 'row',
    gap: 12,
  },
  tooltipInflow: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tooltipOutflow: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tooltipPlaceholder: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  breakdownList: {
    marginTop: 12,
    gap: 12,
  },
  itemRow: {
    gap: 6,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  badgeCogs: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  badgeAsset: {
    backgroundColor: '#e0e7ff',
    borderColor: '#c7d2fe',
  },
  badgeOpex: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  itemValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemPercent: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'System',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
