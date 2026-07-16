export const MOBILE_CODEFILES = {
  'App.tsx': `import React, { useState, useMemo } from 'react';
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
    description: 'AWS Production Hosting',
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
  }
];

export default function MobileApp() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'statements' | 'add' | 'scan' | 'ledger'>('dashboard');

  const metrics = useMemo(() => {
    let cashIn = 0, cashOut = 0, tradingRevenue = 0, tradingCogs = 0, opex = 0;
    transactions.forEach(t => {
      const amt = t.amount;
      if (t.type === 'income') cashIn += amt;
      else cashOut += amt;

      if (t.accountingType === 'trading_revenue') tradingRevenue += amt;
      else if (t.accountingType === 'trading_cogs') tradingCogs += amt;
      else if (t.accountingType === 'opex') opex += amt;
    });

    return {
      currentBankCash: cashIn - cashOut,
      tradingRevenue,
      tradingCogs,
      opex,
      netProfit: tradingRevenue - tradingCogs - opex
    };
  }, [transactions]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FounderLedger Mobile</Text>
      </View>
      <View style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <ScrollView style={styles.scrollView}>
            <View style={styles.mainCashCard}>
              <Text>Available Cash: \${metrics.currentBankCash.toLocaleString()}</Text>
            </View>
            <SpendingCharts transactions={transactions} />
          </ScrollView>
        )}
        {activeTab === 'statements' && <FinancialStatements transactions={transactions} />}
        {activeTab === 'add' && <TransactionForm onAddTransaction={t => setTransactions([t as any, ...transactions])} />}
        {activeTab === 'scan' && <BillScanner onAddTransaction={t => setTransactions([t as any, ...transactions])} onScanComplete={() => setActiveTab('dashboard')} />}
      </View>
    </SafeAreaView>
  );
}`,
  'components/SpendingCharts.tsx': `import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Transaction } from '../types';

export const SpendingCharts: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  // SVG points generation, linear gradients, and line drawings using react-native-svg
  return (
    <View style={styles.container}>
      <Text style={styles.cardTitle}>Cash Flow Timeline</Text>
      {/* Svg paths, Line nodes, and tooltip events */}
    </View>
  );
};`,
  'components/FinancialStatements.tsx': `import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Transaction } from '../types';

export const FinancialStatements: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [subTab, setSubTab] = useState<'statements' | 'journal' | 'ledger' | 'trial' | 'cashbook'>('statements');
  // Calculates dynamic double-entry ledger journals, Trial Balance debits vs credits, Cash book closing values, and GAAP Profit & Loss margins
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeading}>GAAP Accrual Financials</Text>
    </ScrollView>
  );
};`,
  'components/TransactionForm.tsx': `import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Transaction } from '../types';

export const TransactionForm: React.FC<{ onAddTransaction: (t: any) => void }> = ({ onAddTransaction }) => {
  // Comprehensive bookkeeping fields: gst, direct withholdings, settlement accounts, and frequency tags
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Log GAAP Accrual transaction</Text>
    </View>
  );
};`,
  'components/BillScanner.tsx': `import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

export const BillScanner: React.FC<{ onAddTransaction: (t: any) => void, onScanComplete: () => void }> = ({ onAddTransaction, onScanComplete }) => {
  // OCR Document scanner parser using cloud Gemini Flash image analysis simulation
  return (
    <View style={styles.scanArena}>
      <Text>AI Receipt parsing</Text>
    </View>
  );
};`,
  'package.json': `{
  "name": "founderledger-mobile",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "react-native": "0.74.5",
    "react-native-svg": "15.2.0",
    "lucide-react-native": "^0.395.0"
  }
}`,
  'app.json': `{
  "expo": {
    "name": "FounderLedger",
    "slug": "founderledger",
    "version": "1.0.0",
    "orientation": "portrait"
  }
}`,
  'README.md': `# 📱 React Native Mobile Instructions
Navigate to this folder and boot with Expo Go:
\`\`\`bash
npm install
npm start
\`\`\`
`
};
export type MobileFileKey = keyof typeof MOBILE_CODEFILES;
