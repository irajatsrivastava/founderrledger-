import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Alert
} from 'react-native';
import { Transaction, AccountingType } from '../types';

interface TransactionFormProps {
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountingType, setAccountingType] = useState<AccountingType>('opex');

  // Advanced compliance ledger options
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [isBusiness, setIsBusiness] = useState(true);
  const [recurring, setRecurring] = useState('None');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [gstAmount, setGstAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto category presets
  const categories = type === 'income' 
    ? ['SaaS Subscription Rev', 'Freelance Consulting', 'API Licensing', 'Angel Funding', 'Tax Rebate']
    : ['Cloud Server SaaS', 'AI API Tokens', 'Direct Manufacturing', 'Legal Fees', 'Marketing Ads', 'Office Rent'];

  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
    // Autofill accountingType based on standard logic
    if (type === 'income') {
      if (cat === 'Angel Funding') setAccountingType('equity');
      else setAccountingType('trading_revenue');
    } else {
      if (cat === 'Direct Manufacturing') setAccountingType('trading_cogs');
      else if (cat === 'Cloud Server SaaS' || cat === 'AI API Tokens') setAccountingType('opex');
      else setAccountingType('opex');
    }
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a valid description or ledger memo.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please specify a positive numeric booking amount.');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Error', 'Please select or type an account category.');
      return;
    }

    const tags = tagsInput
      ? tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    onAddTransaction({
      description,
      amount: parsedAmount,
      type,
      category,
      accountingType,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      isBusiness,
      recurring,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      gstAmount: gstAmount ? parseFloat(gstAmount) : undefined,
      taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      dueDate: dueDate.trim() || undefined
    });

    // Reset Form
    setDescription('');
    setAmount('');
    setCategory('');
    setNotes('');
    setTagsInput('');
    setGstAmount('');
    setTaxAmount('');
    setInvoiceNumber('');
    setDueDate('');
    Alert.alert('Success', 'Ledger entry booked successfully!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 1. Inflow/Outflow Selector Segment */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentBtn, type === 'income' && styles.segmentBtnActiveIncome]}
          onPress={() => {
            setType('income');
            setAccountingType('trading_revenue');
            setCategory('');
          }}
        >
          <Text style={[styles.segmentText, type === 'income' && styles.segmentTextActive]}>Inflow (Revenue)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentBtn, type === 'expense' && styles.segmentBtnActiveExpense]}
          onPress={() => {
            setType('expense');
            setAccountingType('opex');
            setCategory('');
          }}
        >
          <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>Outflow (Expense)</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Amount Input Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Booking Ledger Amount (USD)</Text>
        <View style={styles.amountInputRow}>
          <Text style={styles.currencyPrefix}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor="#cbd5e1"
          />
        </View>
      </View>

      {/* 3. Narrative Input Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Transaction Narrative / Particulars</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Acme Corp monthly licensing"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* 4. Category Presets & Picker */}
      <View style={styles.card}>
        <Text style={styles.label}>Select Category Presets</Text>
        <View style={styles.presetContainer}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.presetBtn, category === cat && styles.presetBtnActive]}
              onPress={() => handleSelectCategory(cat)}
            >
              <Text style={[styles.presetText, category === cat && styles.presetTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Custom Category / Account Head</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Or enter custom category"
          value={category}
          onChangeText={setCategory}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* 5. GAAP Accounting Classification */}
      <View style={styles.card}>
        <Text style={styles.label}>GAAP Accrual Classification</Text>
        <View style={styles.classificationGrid}>
          {([
            { code: 'trading_revenue', title: 'Trading Revenue', side: 'Credit' },
            { code: 'trading_cogs', title: 'Trading COGS', side: 'Debit' },
            { code: 'opex', title: 'Operating Expense', side: 'Debit' },
            { code: 'asset', title: 'Capital Asset', side: 'Debit' },
            { code: 'liability', title: 'Outstanding Liability', side: 'Credit' },
            { code: 'equity', title: 'Paid-In Capital', side: 'Credit' }
          ] as const).map((item) => {
            const isSelected = accountingType === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.classBtn, isSelected && styles.classBtnActive]}
                onPress={() => setAccountingType(item.code)}
              >
                <Text style={[styles.classBtnText, isSelected && styles.classBtnTextActive]}>{item.title}</Text>
                <Text style={styles.classBtnSub}>Balance: {item.side}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Toggle Advanced Ledger Fields */}
      <TouchableOpacity 
        style={styles.advancedToggle} 
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? 'Hide Regulatory & Compliance Details' : 'Show Regulatory & Compliance Details (Optional)'}
        </Text>
      </TouchableOpacity>

      {/* Advanced Compliance Fields */}
      {showAdvanced && (
        <View style={styles.advancedContainer}>
          {/* Payment Method */}
          <View style={styles.card}>
            <Text style={styles.label}>Settlement Payment Method</Text>
            <View style={styles.optionRow}>
              {['Bank Transfer', 'Credit Card', 'Cash', 'UPI'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.optionBtn, paymentMethod === method && styles.optionBtnActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.optionBtnText, paymentMethod === method && styles.optionBtnActiveText]}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Business vs Personal */}
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Business Allocation Scope</Text>
                <Text style={styles.switchDesc}>Toggle off to classify as draw/personal expense</Text>
              </View>
              <Switch
                value={isBusiness}
                onValueChange={setIsBusiness}
                trackColor={{ false: '#cbd5e1', true: '#818cf8' }}
                thumbColor={isBusiness ? '#4f46e5' : '#f4f4f5'}
              />
            </View>
          </View>

          {/* Recurring Frequency */}
          <View style={styles.card}>
            <Text style={styles.label}>Accrual Recurring Frequency</Text>
            <View style={styles.optionRow}>
              {['None', 'Weekly', 'Monthly', 'Yearly'].map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.optionBtn, recurring === freq && styles.optionBtnActive]}
                  onPress={() => setRecurring(freq)}
                >
                  <Text style={[styles.optionBtnText, recurring === freq && styles.optionBtnActiveText]}>{freq}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Invoice References */}
          <View style={styles.card}>
            <Text style={styles.label}>Invoice Number / Audit ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. INV-2026-9041"
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholderTextColor="#94a3b8"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Accrual Settlement Due Date</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD (e.g. 2026-07-31)"
              value={dueDate}
              onChangeText={setDueDate}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Taxes & Withholdings */}
          <View style={styles.card}>
            <Text style={styles.label}>GST / VAT Direct Tax Portion ($)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={gstAmount}
              onChangeText={setGstAmount}
              placeholderTextColor="#cbd5e1"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Direct withholding / Corporate Income Tax ($)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={taxAmount}
              onChangeText={setTaxAmount}
              placeholderTextColor="#cbd5e1"
            />
          </View>

          {/* Tags & Notes */}
          <View style={styles.card}>
            <Text style={styles.label}>Metadata Audit Tags (comma separated)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. server-cost, marketing-ads, production"
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholderTextColor="#94a3b8"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Internal Accountant Ledger Notes</Text>
            <TextInput
              style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Enter optional narrative details..."
              multiline
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
      )}

      {/* Book Transaction Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Book GAAP Double-Entry Ledger Entry</Text>
      </TouchableOpacity>
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
    gap: 12,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActiveIncome: {
    backgroundColor: '#10b981',
  },
  segmentBtnActiveExpense: {
    backgroundColor: '#ef4444',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    padding: 0,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  presetBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetBtnActive: {
    backgroundColor: '#4f46e5',
  },
  presetText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#ffffff',
  },
  classificationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  classBtn: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
  },
  classBtnActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#e0e7ff',
  },
  classBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  classBtnTextActive: {
    color: '#4f46e5',
  },
  classBtnSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  advancedToggle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  advancedToggleText: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '700',
  },
  advancedContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: '#4f46e5',
  },
  optionBtnText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  optionBtnActiveText: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  switchDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
