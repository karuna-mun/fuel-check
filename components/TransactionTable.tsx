import React, { useState } from 'react';
import { MatchStatus, ReconciliationResult } from '../types';
import { Search, Filter, CalendarClock } from 'lucide-react';

interface TransactionTableProps {
  results: ReconciliationResult[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ results }) => {
  const [filter, setFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filteredData = results.filter(item => {
    const matchesFilter = filter === 'ALL' || item.status === filter;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      item.bankTrans?.invoice_number.toLowerCase().includes(searchLower) ||
      item.bookTrans?.description.toLowerCase().includes(searchLower) ||
      item.bankTrans?.total_amount.toString().includes(searchLower) ||
      item.bookTrans?.amount.toString().includes(searchLower) ||
      false;

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.MATCHED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">ถูกต้อง (Matched)</span>;
      case MatchStatus.AMOUNT_MISMATCH:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">ยอดไม่ตรง (Diff)</span>;
      case MatchStatus.DATE_MISMATCH:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><CalendarClock size={12} className="mr-1"/> วันที่ไม่ตรง</span>;
      case MatchStatus.MISSING_IN_BOOK:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">ไม่พบใน Book</span>;
      case MatchStatus.MISSING_IN_BANK:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">ไม่พบใน Bank</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-800">รายการธุรกรรม (Transactions)</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="ค้นหา Invoice, ยอดเงิน..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="border border-slate-200 rounded-lg text-sm py-2 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="ALL">ทั้งหมด (All)</option>
              <option value={MatchStatus.MATCHED}>ถูกต้อง (Matched)</option>
              <option value={MatchStatus.DATE_MISMATCH}>วันที่ไม่ตรง (Date Diff)</option>
              <option value={MatchStatus.AMOUNT_MISMATCH}>ยอดไม่ตรง (Amount Diff)</option>
              <option value={MatchStatus.MISSING_IN_BOOK}>Missing in Book</option>
              <option value={MatchStatus.MISSING_IN_BANK}>Missing in Bank</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="p-4 border-b">สถานะ (Status)</th>
              <th className="p-4 border-b">วันที่ (Date)</th>
              <th className="p-4 border-b">Invoice / Ref</th>
              <th className="p-4 border-b text-right">ยอด Bank</th>
              <th className="p-4 border-b text-right">ยอด Book</th>
              <th className="p-4 border-b text-right">ผลต่าง (Diff)</th>
              <th className="p-4 border-b">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="p-4 whitespace-nowrap font-medium text-slate-800">
                     <div className="flex flex-col">
                        <span>{row.bankTrans?.transaction_date || '-'}</span>
                        {row.status === MatchStatus.DATE_MISMATCH && (
                           <span className="text-purple-600 text-xs">Book: {row.bookTrans?.posting_date}</span>
                        )}
                        {!row.bankTrans && <span>{row.bookTrans?.posting_date}</span>}
                     </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                       <span className="font-mono text-slate-700 font-medium">{row.bankTrans?.invoice_number || row.bookTrans?.description}</span>
                       <span className="text-xs text-slate-400 truncate max-w-[150px]">{row.bankTrans?.product}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-600">
                    {row.bankTrans ? row.bankTrans.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-600">
                    {row.bookTrans ? row.bookTrans.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className={`p-4 text-right font-mono font-bold ${Math.abs(row.amountDiff) > 0.01 ? 'text-red-500' : 'text-slate-300'}`}>
                    {Math.abs(row.amountDiff) > 0.01 ? (row.amountDiff > 0 ? `+${row.amountDiff.toLocaleString()}` : row.amountDiff.toLocaleString()) : '-'}
                  </td>
                  <td className="p-4 text-xs text-slate-500 max-w-[200px]">
                    {row.note}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  ไม่พบข้อมูลที่ค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;