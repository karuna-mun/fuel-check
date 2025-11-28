export interface BankTransaction {
  account_no: string;
  transaction_date: string; // DD/MM/YYYY
  time: string;
  invoice_number: string;
  product: string;
  total_amount: number;
  original_row: Record<string, string>;
}

export interface BookTransaction {
  document_no: string;
  posting_date: string; // DD/MM/YYYY
  description: string; // Often matches invoice_number
  amount: number;
  original_row: Record<string, string>;
}

export enum MatchStatus {
  MATCHED = 'MATCHED',
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  DATE_MISMATCH = 'DATE_MISMATCH',
  MISSING_IN_BOOK = 'MISSING_IN_BOOK',
  MISSING_IN_BANK = 'MISSING_IN_BANK',
}

export interface ReconciliationResult {
  id: string; // Unique ID for the row
  bankTrans?: BankTransaction;
  bookTrans?: BookTransaction;
  status: MatchStatus;
  amountDiff: number;
  note?: string;
}

export interface SummaryStats {
  totalBank: number;
  totalBook: number;
  matchedCount: number;
  unmatchedCount: number;
  mismatchCount: number;
  accuracy: number;
}