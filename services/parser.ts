import { BankTransaction, BookTransaction } from '../types';

// Helper to handle CSV lines with quoted values like "1,000.00"
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const cleanAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  // Remove quotes and commas, then parse
  return parseFloat(amountStr.replace(/["',]/g, ''));
};

export const parseBankCSV = (csvContent: string): BankTransaction[] => {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  const headers = parseCSVLine(lines[0].toLowerCase().replace(/^\ufeff/, '')); // Remove BOM if present

  const transactions: BankTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, index) => {
      row[h.trim()] = values[index]?.trim() || '';
    });

    transactions.push({
      account_no: row['account_no'],
      transaction_date: row['transaction_date'],
      time: row['time'],
      invoice_number: row['invoice_number'],
      product: row['product'],
      total_amount: cleanAmount(row['total_amount']),
      original_row: row,
    });
  }
  return transactions;
};

export const parseBookCSV = (csvContent: string): BookTransaction[] => {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  const headers = parseCSVLine(lines[0].toLowerCase().replace(/^\ufeff/, ''));

  const transactions: BookTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, index) => {
      row[h.trim()] = values[index]?.trim() || '';
    });

    transactions.push({
      document_no: row['document_no'],
      posting_date: row['posting_date'],
      description: row['description'],
      amount: cleanAmount(row['amount']),
      original_row: row,
    });
  }
  return transactions;
};