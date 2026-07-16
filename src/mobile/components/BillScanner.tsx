import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { Transaction } from '../types';

interface BillScannerProps {
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onScanComplete: () => void;
}

export const BillScanner: React.FC<BillScannerProps> = ({ onAddTransaction, onScanComplete }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    vendor: string;
    amount: string;
    category: string;
    invoiceNumber: string;
    gstAmount: string;
    date: string;
  } | null>(null);

  // Simulated bill scan
  const handleSelectSample = (sampleType: 'aws' | 'stripe') => {
    setImageUri(sampleType === 'aws' ? 'aws_invoice' : 'stripe_invoice');
    setIsScanning(true);
    setExtractedData(null);

    setTimeout(() => {
      setIsScanning(false);
      if (sampleType === 'aws') {
        setExtractedData({
          vendor: 'Amazon Web Services Inc.',
          amount: '1432.50',
          category: 'Cloud Server SaaS',
          invoiceNumber: 'AWS-90812-US',
          gstAmount: '114.60',
          date: '2026-07-12'
        });
      } else {
        setExtractedData({
          vendor: 'Stripe Payments Ltd',
          amount: '89.00',
          category: 'API Licensing',
          invoiceNumber: 'ST-901-REG-C',
          gstAmount: '7.12',
          date: '2026-07-14'
        });
      }
      Alert.alert('Scan Complete', 'AI parsed invoice metadata successfully!');
    }, 2500);
  };

  const handleConfirmBooking = () => {
    if (!extractedData) return;

    onAddTransaction({
      description: `Bill from ${extractedData.vendor}`,
      amount: parseFloat(extractedData.amount),
      type: 'expense',
      category: extractedData.category,
      accountingType: 'opex',
      date: extractedData.date,
      vendor: extractedData.vendor,
      billScanned: true,
      billFileName: `${extractedData.vendor.toLowerCase().replace(/ /g, '_')}_invoice.pdf`,
      invoiceNumber: extractedData.invoiceNumber,
      gstAmount: parseFloat(extractedData.gstAmount),
    });

    setImageUri(null);
    setExtractedData(null);
    onScanComplete();
    Alert.alert('Booked', 'Ledger transaction created successfully!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 1. Header advice */}
      <View style={styles.adviceCard}>
        <Text style={styles.adviceTitle}>AI Invoice Parsing Engine</Text>
        <Text style={styles.adviceBody}>
          Capture bills, receipts, or contracts. The OCR parser will automatically extract financial figures, VAT breakdowns, dates, and assign GAAP codes.
        </Text>
      </View>

      {/* 2. Upload / Selector Arena */}
      {!imageUri && (
        <View style={styles.scanArena}>
          <Text style={styles.arenaTitle}>Select Invoice to scan</Text>
          <Text style={styles.arenaSubtitle}>Simulate receipt OCR parser scanning</Text>
          
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.sampleBtn} onPress={() => handleSelectSample('aws')}>
              <Text style={styles.sampleBtnText}>Scan AWS Invoice ($1,432.50)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sampleBtn} onPress={() => handleSelectSample('stripe')}>
              <Text style={styles.sampleBtnText}>Scan Stripe Receipt ($89.00)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Scanning State */}
      {isScanning && (
        <View style={styles.scanningCard}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.scanningText}>OCR Parsing Document Metadata...</Text>
          <Text style={styles.scanningSub}>Analyzing with Gemini Flash API</Text>
        </View>
      )}

      {/* 4. Extracted Meta Data Confirmation Card */}
      {extractedData && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsHeader}>Confirm Extracted Metadata</Text>
          
          <View style={styles.dataGrid}>
            <View style={styles.dataField}>
              <Text style={styles.fieldLabel}>Extracted Vendor</Text>
              <Text style={styles.fieldValue}>{extractedData.vendor}</Text>
            </View>

            <View style={styles.dataField}>
              <Text style={styles.fieldLabel}>Total Amount (USD)</Text>
              <Text style={[styles.fieldValue, { fontWeight: '800', color: '#10b981' }]}>${extractedData.amount}</Text>
            </View>

            <View style={styles.dataField}>
              <Text style={styles.fieldLabel}>Account Category</Text>
              <Text style={styles.fieldValue}>{extractedData.category}</Text>
            </View>

            <View style={styles.dataField}>
              <Text style={styles.fieldLabel}>Invoice Reference ID</Text>
              <Text style={styles.fieldValue}>{extractedData.invoiceNumber}</Text>
            </View>

            <View style={styles.dataField}>
              <Text style={styles.fieldLabel}>GST/VAT Direct Portion</Text>
              <Text style={styles.fieldValue}>${extractedData.gstAmount}</Text>
            </View>

            <View style={styles.dataField}>
              <Text style={styles.fieldLabel}>Invoice Issued Date</Text>
              <Text style={styles.fieldValue}>{extractedData.date}</Text>
            </View>
          </View>

          <View style={styles.resultsActionRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmBooking}>
              <Text style={styles.confirmBtnText}>Accept & Book Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setImageUri(null); setExtractedData(null); }}>
              <Text style={styles.cancelBtnText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  adviceCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 16,
  },
  adviceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a5b4fc',
    textTransform: 'uppercase',
  },
  adviceBody: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
    marginTop: 4,
  },
  scanArena: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
    gap: 8,
  },
  arenaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  arenaSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 12,
  },
  btnRow: {
    width: '100%',
    gap: 8,
  },
  sampleBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sampleBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  scanningCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  scanningText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  scanningSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  resultsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  dataGrid: {
    gap: 10,
  },
  dataField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  fieldLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '700',
  },
  resultsActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
});
