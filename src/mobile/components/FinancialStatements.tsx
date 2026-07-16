import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert
} from 'react-native';
import { Transaction, AccountingType } from '../types';

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

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.05;
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
            debitAccount = `Direct Production: ${t.category}`;
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
    const debits: { name: string; amount: number }[] = [];
    const credits: { name: string; amount: number }[] = [];

    debits.push({ name: 'Cash & Bank Account', amount: balanceSheet.bankCash });

    balanceSheet.fixedAssetDetails.forEach(([cat, amt]) => {
      debits.push({ name: `Asset: ${cat}`, amount: amt });
    });

    financials.cogsDetails.forEach(([cat, amt]) => {
      debits.push({ name: `Direct Cost: ${cat}`, amount: amt });
    });
    financials.opexDetails.forEach(([cat, amt]) => {
      debits.push({ name: `OpEx: ${cat}`, amount: amt });
    });

    balanceSheet.liabilityDetails.forEach(([cat, amt]) => {
      credits.push({ name: `Liability: ${cat}`, amount: amt });
    });

    balanceSheet.equityDetails.forEach(([cat, amt]) => {
      credits.push({ name: `Equity: ${cat}`, amount: amt });
    });

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
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.1
    };
  }, [financials, balanceSheet]);

  // 5. Cash Book Log
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      
      {/* GAAP Balance Identity Banner */}
      <View style={[styles.identityBanner, balanceSheet.isBalanced ? styles.bannerBalanced : styles.bannerDiscrepancy]}>
        <View>
          <Text style={styles.bannerTitle}>Double-Entry Identity</Text>
          <Text style={styles.bannerSubtitle}>
            {balanceSheet.isBalanced 
              ? 'GAAP Compliant: Balance sheet assets equal liabilities and equity.'
              : 'Asset discrepancy detected. Confirm standard journal records.'}
          </Text>
        </View>
        <View style={styles.bannerStatusGroup}>
          <View style={[styles.statusBadge, balanceSheet.isBalanced ? styles.statusBadgeBalanced : styles.statusBadgeDiscrepancy]}>
            <Text style={styles.statusBadgeText}>{balanceSheet.isBalanced ? 'Balanced' : 'Discrepancy'}</Text>
          </View>
          {!balanceSheet.isBalanced && (
            <Text style={styles.discrepancyText}>Diff: ${balanceSheet.difference.toLocaleString()}</Text>
          )}
        </View>
      </View>

      {/* Segmented Controller Tab Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabsContainer} contentContainerStyle={styles.subTabsContent}>
        {(['statements', 'journal', 'ledger', 'trial', 'cashbook'] as const).map((tab) => {
          const label = tab === 'statements' ? 'P&L & BS' :
                        tab === 'journal' ? 'Journal' :
                        tab === 'ledger' ? 'Ledger' :
                        tab === 'trial' ? 'Trial Bal' : 'Cash Book';
          const isSelected = subTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setSubTab(tab)}
              style={[styles.subTabBtn, isSelected && styles.subTabBtnActive]}
            >
              <Text style={[styles.subTabBtnText, isSelected && styles.subTabBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* TAB SCREEN CONTENT CONTAINER */}
      <View style={styles.subTabScreen}>
        
        {/* STATEMENTS VIEW */}
        {subTab === 'statements' && (
          <View style={styles.statementsView}>
            {/* 1. Trading and Profit & Loss */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Trading and Profit & Loss Account</Text>
                <Text style={styles.cardHeaderBadge}>GAAP ACCRUAL</Text>
              </View>
              
              <View style={styles.statementSection}>
                <Text style={styles.sectionHeading}>Trading Account (Part I)</Text>
                
                <View style={styles.dataRowBold}>
                  <Text style={styles.dataRowLabelBold}>Core Revenue Turnover</Text>
                  <Text style={[styles.dataRowValueBold, { color: '#10b981' }]}>${financials.totalRevenue.toLocaleString()}</Text>
                </View>
                {financials.revenueDetails.map(([cat, amt]) => (
                  <View key={cat} style={styles.dataRowIndent}>
                    <Text style={styles.dataRowLabelIndent}>• Sales: {cat}</Text>
                    <Text style={styles.dataRowValueIndent}>${amt.toLocaleString()}</Text>
                  </View>
                ))}

                <View style={[styles.dataRowBold, { marginTop: 12 }]}>
                  <Text style={styles.dataRowLabelBold}>Less: Cost of Goods Sold (COGS)</Text>
                  <Text style={[styles.dataRowValueBold, { color: '#ef4444' }]}>(${financials.totalCogs.toLocaleString()})</Text>
                </View>
                {financials.cogsDetails.map(([cat, amt]) => (
                  <View key={cat} style={styles.dataRowIndent}>
                    <Text style={styles.dataRowLabelIndent}>• Direct: {cat}</Text>
                    <Text style={styles.dataRowValueIndent}>${amt.toLocaleString()}</Text>
                  </View>
                ))}

                <View style={styles.carryDownRow}>
                  <Text style={styles.carryDownLabel}>Gross Profit Carry Down</Text>
                  <Text style={styles.carryDownValue}>${financials.grossProfit.toLocaleString()}</Text>
                </View>
              </View>

              <View style={[styles.statementSection, { marginTop: 16 }]}>
                <Text style={styles.sectionHeading}>Profit & Loss Account (Part II)</Text>
                
                <View style={styles.dataRowBold}>
                  <Text style={styles.dataRowLabelBold}>Less: Operating Expenses (OpEx)</Text>
                  <Text style={[styles.dataRowValueBold, { color: '#ef4444' }]}>(${financials.totalOpex.toLocaleString()})</Text>
                </View>
                {financials.opexDetails.map(([cat, amt]) => (
                  <View key={cat} style={styles.dataRowIndent}>
                    <Text style={styles.dataRowLabelIndent}>• OpEx: {cat}</Text>
                    <Text style={styles.dataRowValueIndent}>${amt.toLocaleString()}</Text>
                  </View>
                ))}

                <View style={[styles.carryDownRow, { backgroundColor: financials.netProfit >= 0 ? '#ecfdf5' : '#fef2f2', borderColor: financials.netProfit >= 0 ? '#a7f3d0' : '#fecaca' }]}>
                  <Text style={[styles.carryDownLabel, { color: '#0f172a' }]}>Net Financial Income</Text>
                  <Text style={[styles.carryDownValue, { color: financials.netProfit >= 0 ? '#059669' : '#dc2626' }]}>${financials.netProfit.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* 2. Balance Sheet */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Corporate Balance Sheet</Text>
                <Text style={[styles.cardHeaderBadge, { backgroundColor: '#e0e7ff', color: '#4f46e5' }]}>BALANCE SHEET</Text>
              </View>

              <View style={styles.statementSection}>
                <Text style={styles.sectionHeading}>Assets (Capital Placements)</Text>
                <View style={styles.dataRowBold}>
                  <Text style={styles.dataRowLabelBold}>Liquid Holdings (Bank Cash)</Text>
                  <Text style={styles.dataRowValueBold}>${balanceSheet.bankCash.toLocaleString()}</Text>
                </View>
                {balanceSheet.fixedAssetDetails.map(([cat, amt]) => (
                  <View key={cat} style={styles.dataRowIndent}>
                    <Text style={styles.dataRowLabelIndent}>• Capital: {cat}</Text>
                    <Text style={styles.dataRowValueIndent}>${amt.toLocaleString()}</Text>
                  </View>
                ))}
                <View style={styles.carryDownRow}>
                  <Text style={styles.carryDownLabel}>Total Book Assets (A)</Text>
                  <Text style={styles.carryDownValue}>${balanceSheet.totalAssets.toLocaleString()}</Text>
                </View>
              </View>

              <View style={[styles.statementSection, { marginTop: 16 }]}>
                <Text style={styles.sectionHeading}>Funding Sources & Owner's Equity</Text>
                {balanceSheet.liabilityDetails.map(([cat, amt]) => (
                  <View key={cat} style={styles.dataRowIndent}>
                    <Text style={styles.dataRowLabelIndent}>• Outstanding Loan: {cat}</Text>
                    <Text style={styles.dataRowValueIndent}>${amt.toLocaleString()}</Text>
                  </View>
                ))}
                {balanceSheet.equityDetails.map(([cat, amt]) => (
                  <View key={cat} style={styles.dataRowIndent}>
                    <Text style={styles.dataRowLabelIndent}>• Paid-In Capital: {cat}</Text>
                    <Text style={styles.dataRowValueIndent}>${amt.toLocaleString()}</Text>
                  </View>
                ))}
                <View style={styles.dataRowIndent}>
                  <Text style={styles.dataRowLabelIndent}>• Retained Period Surplus</Text>
                  <Text style={[styles.dataRowValueIndent, { color: balanceSheet.retainedEarnings >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }]}>
                    ${balanceSheet.retainedEarnings.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.carryDownRow}>
                  <Text style={styles.carryDownLabel}>Total Funding (L + E)</Text>
                  <Text style={styles.carryDownValue}>${balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* JOURNAL VIEW */}
        {subTab === 'journal' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ledger Journal Bookings</Text>
            {journalEntries.length === 0 ? (
              <Text style={styles.emptyText}>No journal bookings recorded</Text>
            ) : (
              <View style={styles.listContainer}>
                {journalEntries.map((row) => (
                  <View key={row.id} style={styles.journalRow}>
                    <View style={styles.journalHeader}>
                      <Text style={styles.journalDate}>{row.date}</Text>
                      <View style={styles.lfBadge}>
                        <Text style={styles.lfBadgeText}>{row.lf}</Text>
                      </View>
                    </View>
                    <View style={styles.journalAccountDr}>
                      <Text style={styles.accountDrText}>{row.debitAccount}</Text>
                      <Text style={styles.accountAmountText}>Dr. ${row.amount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.journalAccountCr}>
                      <Text style={styles.accountCrText}>To {row.creditAccount}</Text>
                      <Text style={styles.accountAmountText}>Cr. ${row.amount.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.narrationText}>(Being {row.description.toLowerCase()})</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* GENERAL LEDGER VIEW */}
        {subTab === 'ledger' && (
          <View style={styles.statementsView}>
            {/* Cash & Bank T-Account */}
            <View style={styles.card}>
              <Text style={styles.tAccountTitle}>Cash & Bank Account Ledger</Text>
              <View style={styles.tAccountGrid}>
                <View style={styles.tAccountColumn}>
                  <Text style={styles.tAccountColHeader}>Debits (Dr)</Text>
                  <Text style={styles.tAccountAmount}>+${trialBalance.debits[0]?.amount.toLocaleString() || '0'}</Text>
                </View>
                <View style={styles.tAccountDivider} />
                <View style={styles.tAccountColumn}>
                  <Text style={styles.tAccountColHeader}>Closing (Cr)</Text>
                  <Text style={[styles.tAccountAmount, { color: '#4f46e5' }]}>${balanceSheet.bankCash.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Sales Revenues Ledger */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.tAccountTitle}>Sales Revenues Ledger</Text>
              {financials.revenueDetails.map(([cat, amt]) => (
                <View key={cat} style={styles.dataRow}>
                  <Text style={styles.dataRowLabel}>• {cat}</Text>
                  <Text style={styles.dataRowValue}>Credit Bal: ${amt.toLocaleString()}</Text>
                </View>
              ))}
            </View>

            {/* Operating Expense Ledger */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.tAccountTitle}>Operating Expenses Ledger</Text>
              {financials.opexDetails.map(([cat, amt]) => (
                <View key={cat} style={styles.dataRow}>
                  <Text style={styles.dataRowLabel}>• {cat}</Text>
                  <Text style={styles.dataRowValue}>Debit Bal: ${amt.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TRIAL BALANCE VIEW */}
        {subTab === 'trial' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Double-Entry Trial Balance</Text>
            
            <View style={styles.trialGridHeader}>
              <Text style={styles.trialGridHeaderTitle}>Account Head</Text>
              <Text style={styles.trialGridHeaderVal}>Debit ($)</Text>
              <Text style={styles.trialGridHeaderVal}>Credit ($)</Text>
            </View>

            <View style={styles.listContainer}>
              {trialBalance.debits.map((deb, idx) => (
                <View key={`deb-${idx}`} style={styles.trialGridRow}>
                  <Text style={styles.trialRowTitle}>{deb.name}</Text>
                  <Text style={styles.trialRowVal}>${deb.amount.toLocaleString()}</Text>
                  <Text style={[styles.trialRowVal, { color: '#cbd5e1' }]}>-</Text>
                </View>
              ))}

              {trialBalance.credits.map((cred, idx) => (
                <View key={`cred-${idx}`} style={styles.trialGridRow}>
                  <Text style={styles.trialRowTitle}>{cred.name}</Text>
                  <Text style={[styles.trialRowVal, { color: '#cbd5e1' }]}>-</Text>
                  <Text style={styles.trialRowVal}>${cred.amount.toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <View style={styles.trialGridFooter}>
              <Text style={styles.trialFooterTitle}>Grand Total</Text>
              <Text style={styles.trialFooterVal}>${trialBalance.totalDebits.toLocaleString()}</Text>
              <Text style={styles.trialFooterVal}>${trialBalance.totalCredits.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* CASH BOOK VIEW */}
        {subTab === 'cashbook' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bank Cash Book Ledger</Text>
            {cashBook.length === 0 ? (
              <Text style={styles.emptyText}>No cash transactions logged</Text>
            ) : (
              <View style={styles.listContainer}>
                {cashBook.map((row) => (
                  <View key={row.id} style={styles.cashBookRow}>
                    <View style={styles.cashBookMeta}>
                      <Text style={styles.cashBookDesc}>{row.particulars}</Text>
                      <Text style={styles.cashBookSub}>{row.date} • {row.category}</Text>
                    </View>
                    <View style={styles.cashBookValues}>
                      <Text style={styles.cashBookBalance}>Bal: ${row.balance.toLocaleString()}</Text>
                      <Text style={[styles.cashBookAmount, row.receipt > 0 ? { color: '#10b981' } : { color: '#dc2626' }]}>
                        {row.receipt > 0 ? `+${row.receipt.toLocaleString()}` : `-${row.payment.toLocaleString()}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  identityBanner: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  bannerBalanced: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  bannerDiscrepancy: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  bannerSubtitle: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
    maxWidth: '75%',
    lineHeight: 14,
  },
  bannerStatusGroup: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeBalanced: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeDiscrepancy: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#047857',
  },
  discrepancyText: {
    fontSize: 9,
    color: '#b91c1c',
    fontWeight: 'bold',
    marginTop: 4,
  },
  subTabsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  subTabsContent: {
    gap: 8,
  },
  subTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subTabBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  subTabBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  subTabBtnTextActive: {
    color: '#ffffff',
  },
  subTabScreen: {
    marginTop: 4,
  },
  statementsView: {
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardHeaderBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#047857',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statementSection: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4f46e5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dataRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dataRowLabelBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  dataRowValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  dataRowIndent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingVertical: 2,
  },
  dataRowLabelIndent: {
    fontSize: 11,
    color: '#475569',
  },
  dataRowValueIndent: {
    fontSize: 11,
    color: '#64748b',
  },
  carryDownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  carryDownLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  carryDownValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 40,
    fontStyle: 'italic',
  },
  listContainer: {
    gap: 12,
  },
  journalRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    gap: 4,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  journalDate: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  lfBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lfBadgeText: {
    fontSize: 8,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  journalAccountDr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountDrText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  accountAmountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  journalAccountCr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  accountCrText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#475569',
  },
  narrationText: {
    fontSize: 9,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingLeft: 12,
    marginTop: 2,
  },
  tAccountTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
    marginBottom: 10,
  },
  tAccountGrid: {
    flexDirection: 'row',
  },
  tAccountColumn: {
    flex: 1,
    paddingVertical: 6,
    gap: 4,
  },
  tAccountDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  tAccountColHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tAccountAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dataRowLabel: {
    fontSize: 11,
    color: '#475569',
  },
  dataRowValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
  },
  trialGridHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f172a',
    paddingBottom: 6,
    marginBottom: 8,
  },
  trialGridHeaderTitle: {
    flex: 2,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  trialGridHeaderVal: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  trialGridRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  trialRowTitle: {
    flex: 2,
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  trialRowVal: {
    flex: 1,
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'right',
  },
  trialGridFooter: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  trialFooterTitle: {
    flex: 2,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  trialFooterVal: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34d399',
    textAlign: 'right',
  },
  cashBookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cashBookMeta: {
    gap: 2,
  },
  cashBookDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  cashBookSub: {
    fontSize: 9,
    color: '#94a3b8',
  },
  cashBookValues: {
    alignItems: 'flex-end',
    gap: 2,
  },
  cashBookBalance: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  cashBookAmount: {
    fontSize: 11,
    fontWeight: '700',
  },
});
