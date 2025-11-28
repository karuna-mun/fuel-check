import { BankTransaction, BookTransaction, MatchStatus, ReconciliationResult } from '../types';

// Helper to normalize date strings (e.g., "1/9/2025" -> "1/9/2025", "01/09/2025" -> "1/9/2025")
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parts[2];
  return `${d}/${m}/${y}`;
};

export const reconcileData = (
  bankData: BankTransaction[],
  bookData: BookTransaction[]
): ReconciliationResult[] => {
  const results: ReconciliationResult[] = [];
  const usedBookIndices = new Set<number>();
  const matchedBankIndices = new Set<number>();

  // --- PASS 1: Strict Matching by Invoice Number ---
  // Index Book Data by Invoice No for efficient lookup
  const bookMapById = new Map<string, number[]>();
  
  bookData.forEach((item, index) => {
    const key = item.description?.trim();
    if (!key) return;
    if (!bookMapById.has(key)) {
      bookMapById.set(key, []);
    }
    bookMapById.get(key)?.push(index);
  });

  // Iterate Bank Data
  bankData.forEach((bankItem, bankIndex) => {
    const key = bankItem.invoice_number?.trim();
    const candidateIndices = bookMapById.get(key);
    
    let bestMatchIndex = -1;

    if (candidateIndices && candidateIndices.length > 0) {
      // Filter out indices that have already been matched
      const availableIndices = candidateIndices.filter(i => !usedBookIndices.has(i));
      
      if (availableIndices.length > 0) {
        // Priority 1: Exact Amount Match AND Date Match
        const perfectMatch = availableIndices.find(i => 
          Math.abs(bookData[i].amount - bankItem.total_amount) < 0.01 &&
          normalizeDate(bookData[i].posting_date) === normalizeDate(bankItem.transaction_date)
        );

        if (perfectMatch !== undefined) {
           bestMatchIndex = perfectMatch;
        } else {
           // Priority 2: Exact Amount Match (Date might be wrong)
           const amountMatch = availableIndices.find(i => 
             Math.abs(bookData[i].amount - bankItem.total_amount) < 0.01
           );
           
           if (amountMatch !== undefined) {
             bestMatchIndex = amountMatch;
           } else {
             // Priority 3: Just take the first available ID match (Amount/Date might be wrong)
             bestMatchIndex = availableIndices[0];
           }
        }
      }
    }

    if (bestMatchIndex !== -1) {
      // MATCH FOUND (Strict Invoice ID)
      usedBookIndices.add(bestMatchIndex);
      matchedBankIndices.add(bankIndex);
      
      const bookItem = bookData[bestMatchIndex];
      const amountDiff = bankItem.total_amount - bookItem.amount;
      const dateDiffers = normalizeDate(bankItem.transaction_date) !== normalizeDate(bookItem.posting_date);

      let status = MatchStatus.MATCHED;
      let note = '';

      if (Math.abs(amountDiff) >= 0.01) {
        status = MatchStatus.AMOUNT_MISMATCH;
        note = `ยอดเงินต่างกัน ${amountDiff.toLocaleString()}`;
      } else if (dateDiffers) {
        status = MatchStatus.DATE_MISMATCH;
        note = `วันที่ต่างกัน: Bank ${bankItem.transaction_date} vs Book ${bookItem.posting_date}`;
      }

      results.push({
        id: `match-${key}-${bankIndex}`,
        bankTrans: bankItem,
        bookTrans: bookItem,
        status: status,
        amountDiff: amountDiff,
        note: note
      });
    } else {
      // NO MATCH FOUND (MISSING IN BOOK)
      // If candidates exist but all are used, it's a Duplicate/Overuse case
      const idExistsInBook = candidateIndices && candidateIndices.length > 0;
      
      results.push({
        id: `missing-book-${bankIndex}`,
        bankTrans: bankItem,
        status: MatchStatus.MISSING_IN_BOOK,
        amountDiff: bankItem.total_amount,
        note: idExistsInBook ? 'Invoice ซ้ำ (คู่ทั้งหมดถูกใช้ไปแล้ว)' : 'ไม่พบเลข Invoice นี้ใน Book'
      });
    }
  });

  // --- PASS 2: Find Missing in Bank (Remaining Book Items) ---
  bookData.forEach((bookItem, index) => {
    if (!usedBookIndices.has(index)) {
      results.push({
        id: `missing-bank-${index}`,
        bookTrans: bookItem,
        status: MatchStatus.MISSING_IN_BANK,
        amountDiff: -bookItem.amount,
        note: 'ไม่พบเลข Invoice นี้ใน Bank'
      });
    }
  });

  return results;
};