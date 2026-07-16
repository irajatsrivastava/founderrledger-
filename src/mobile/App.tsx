import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert 
} from 'react-native';
import { Transaction } from './types';
import { SpendingCharts } from './components/SpendingCharts';
import { TransactionForm } from './components/TransactionForm';
import { BillScanner } from './components/BillScanner';
import { FinancialStatements } from './components/FinancialStatements';

// Initial Mock Ledger data (exact matches from Founder Ledger Sample Data)
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    description: 'Stripe SaaS Subscription Billing',
    amount: 14850,
    type: 'income',
    category: 'SaaS Subscription Rev',
    accountingType: 'trading_revenue',
    date: '2026-07-15',
    paymentMethod: 'Bank Transfer',
    isBusiness: true,
  },
  {
    id: 'tx-2',
    description: 'AWS Production Cluster Hosting',
    amount: 3240,
    type: 'expense',
    category: 'Cloud Server SaaS',
    accountingType: 'opex',
    date: '2026-07-14',
    paymentMethod: 'Credit Card',
    isBusiness: true,
  },
  {
    id: 'tx-3',
    description: 'Enterprise Licensing Sales',
    amount: 8500,
    type: 'income',
    category: 'API Licensing',
    accountingType: 'trading_revenue',
    date: '2026-07-14',
    paymentMethod: 'Bank Transfer',
    isBusiness: true,
  },
  {
    id: 'tx-4',
    description: 'Silicon Valley Legal Fees',
    amount: 1500,
    type: 'expense',
    category: 'Legal Fees',
    accountingType: 'opex',
    date: '2026-07-13',
    paymentMethod: 'Bank Transfer',
    isBusiness: true,
  },
  {
    id: 'tx-5',
    description: 'GPU Compute Clusters',
    amount: 4500,
    type: 'expense',
    category: 'Cloud Server SaaS',
    accountingType: 'trading_cogs',
    date: '2026-07-12',
    paymentMethod: 'Bank Transfer',
    isBusiness: true,
  },
];

type ActiveTab = 'dashboard' | 'statements' | 'add' | 'scan' | 'ledger';

export default function MobileApp() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this GAAP ledger record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setTransactions(prev => prev.filter(t => t.id !== id))
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. Header Area */}
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop' }} 
            style={styles.avatar} 
          />
          <View style={styles.headerMeta}>
            <Text style={styles.headerSub}>VENTURE HUB</Text>
            <Text style={styles.headerTitle}>FounderLedger Mobile</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.statusChip}>
          <Text style={styles.statusChipText}>LTE LIVE</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Primary Screen Switchboard */}
      <View style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Net Available Cash Card */}
            <View style={styles.mainCashCard}>
              <Text style={styles.cashLabel}>Available Net Cash (USD)</Text>
              <Text style={styles.cashValue}>${metrics.currentBankCash.toLocaleString()}</Text>
              
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { 
                  width: `${Math.min(100, metrics.tradingRevenue > 0 ? (metrics.currentBankCash / metrics.tradingRevenue) * 100 : 100)}%` 
                }]} />
              </View>
              
              <View style={styles.cashFooter}>
                <Text style={styles.cashFooterText}>Spent: ${(metrics.tradingCogs + metrics.opex).toLocaleString()}</Text>
                <Text style={styles.cashFooterText}>Turnover: ${metrics.tradingRevenue.toLocaleString()}</Text>
              </View>
            </View>

            {/* Quick Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Net Profit</Text>
                <Text style={[styles.metricValue, metrics.netProfit >= 0 ? styles.positiveText : styles.negativeText]}>
                  ${metrics.netProfit.toLocaleString()}
                </Text>
                <Text style={styles.metricSub}>GAAP Margin</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Manufacturing COGS</Text>
                <Text style={styles.metricValue}>${metrics.tradingCogs.toLocaleString()}</Text>
                <Text style={styles.metricSub}>Direct Cost</Text>
              </View>
            </View>

            {/* AI Diagnosis Panel */}
            <View style={styles.diagnosisCard}>
              <Text style={styles.diagnosisTitle}>AI Financial Diagnosis</Text>
              <Text style={styles.diagnosisBody}>
                {metrics.netProfit > 0 
                  ? `Your GAAP operating net profit margin rests beautifully at ${(metrics.netProfit / (metrics.tradingRevenue || 1) * 100).toFixed(0)}%. Cash-flow ratios indicate healthy short-term solvency.`
                  : "Overhead burden exceeds top-line sales velocity. Consider cutting recurring SaaS or infrastructure opex heads immediately."}
              </Text>
            </View>

            {/* Spending Charts component */}
            <SpendingCharts transactions={transactions} />
          </ScrollView>
        )}

        {activeTab === 'statements' && (
          <FinancialStatements transactions={transactions} />
        )}

        {activeTab === 'add' && (
          <TransactionForm onAddTransaction={(tx) => {
            handleAddTransaction(tx);
            setActiveTab('dashboard');
          }} />
        )}

        {activeTab === 'scan' && (
          <BillScanner 
            onAddTransaction={handleAddTransaction}
            onScanComplete={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'ledger' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.ledgerHeaderRow}>
              <Text style={styles.ledgerTitle}>Recorded Entries ({transactions.length})</Text>
              <TouchableOpacity onPress={() => {
                Alert.alert('Reset Ledger', 'Wipe all transaction records?', [
                  { text: 'Cancel' },
                  { text: 'Reset', onPress: () => setTransactions(INITIAL_TRANSACTIONS) }
                ]);
              }}>
                <Text style={styles.ledgerResetBtn}>Seed Preset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ledgerList}>
              {transactions.map(tx => (
                <View key={tx.id} style={styles.ledgerRow}>
                  <View style={styles.ledgerRowMeta}>
                    <Text style={styles.ledgerRowDesc}>{tx.description}</Text>
                    <View style={styles.ledgerRowBadges}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{tx.category}</Text>
                      </View>
                      <Text style={styles.ledgerRowDate}>{tx.date}</Text>
                    </View>
                  </View>
                  <View style={styles.ledgerRowAmountCol}>
                    <Text style={[styles.ledgerRowAmount, tx.type === 'income' ? styles.positiveText : styles.neutralText]}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteTransaction(tx.id)}>
                      <Text style={styles.ledgerDelete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* 3. Bottom Pill Navigation */}
      <View style={styles.navBar}>
        {([
          { id: 'dashboard', label: 'Overview' },
          { id: 'statements', label: 'GAAP F/S' },
          { id: 'add', label: 'Add Tx' },
          { id: 'scan', label: 'OCR' },
          { id: 'ledger', label: 'Ledger' },
        ] as const).map(tab => {
          const isSelected = activeTab === tab.id;
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={[styles.navBtn, isSelected && styles.navBtnActive]} 
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.navBtnText, isSelected && styles.navBtnTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerMeta: {
    justifyContent: 'center',
  },
  headerSub: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statusChip: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  mainCashCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cashLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  cashValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  cashFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cashFooterText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 9,
    color: '#64748b',
  },
  positiveText: {
    color: '#10b981',
  },
  negativeText: {
    color: '#ef4444',
  },
  neutralText: {
    color: '#0f172a',
  },
  diagnosisCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
  },
  diagnosisTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34d399',
    textTransform: 'uppercase',
  },
  diagnosisBody: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 6,
    lineHeight: 15,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ledgerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  ledgerResetBtn: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  ledgerList: {
    gap: 10,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  ledgerRowMeta: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  ledgerRowDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
  },
  ledgerRowBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 8,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  ledgerRowDate: {
    fontSize: 9,
    color: '#94a3b8',
  },
  ledgerRowAmountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ledgerRowAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ledgerDelete: {
    fontSize: 9,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
  },
  navBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  navBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  navBtnTextActive: {
    color: '#ffffff',
  },
});
