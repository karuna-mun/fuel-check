import React, { useState } from 'react';
import { Upload, RefreshCw, FileText, ChevronRight } from 'lucide-react';
import { BankTransaction, BookTransaction, ReconciliationResult, SummaryStats, MatchStatus } from './types';
import { parseBankCSV, parseBookCSV } from './services/parser';
import { reconcileData } from './services/reconcile';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';

const App: React.FC = () => {
  const [bankData, setBankData] = useState<BankTransaction[]>([]);
  const [bookData, setBookData] = useState<BookTransaction[]>([]);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'report'>('upload');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'bank' | 'book') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (type === 'bank') {
        const parsed = parseBankCSV(text);
        setBankData(parsed);
      } else {
        const parsed = parseBookCSV(text);
        setBookData(parsed);
      }
    };
    reader.readAsText(file);
  };

  const runReconciliation = () => {
    if (bankData.length === 0 || bookData.length === 0) {
      alert("กรุณาอัปโหลดไฟล์ทั้ง Bank และ Book ก่อนทำการประมวลผล");
      return;
    }

    const recResults = reconcileData(bankData, bookData);
    setResults(recResults);

    // Calculate Stats
    const matched = recResults.filter(r => r.status === MatchStatus.MATCHED).length;
    
    // Issues include: Amount Diff, Date Diff
    const mismatch = recResults.filter(r => 
      r.status === MatchStatus.AMOUNT_MISMATCH || 
      r.status === MatchStatus.DATE_MISMATCH
    ).length;

    const missingBook = recResults.filter(r => r.status === MatchStatus.MISSING_IN_BOOK).length;
    const missingBank = recResults.filter(r => r.status === MatchStatus.MISSING_IN_BANK).length;
    
    setStats({
      totalBank: bankData.length,
      totalBook: bookData.length,
      matchedCount: matched,
      mismatchCount: mismatch,
      unmatchedCount: missingBook + missingBank,
      accuracy: (matched / recResults.length) * 100
    });

    setActiveTab('report');
  };

  const FileCard = ({ title, count, type }: { title: string, count: number, type: 'bank' | 'book' }) => (
    <div className={`p-6 rounded-xl border-2 border-dashed ${count > 0 ? 'border-green-300 bg-green-50' : 'border-slate-300 bg-slate-50'} transition-all text-center`}>
      <div className="flex justify-center mb-4">
        <div className={`p-3 rounded-full ${count > 0 ? 'bg-green-100 text-green-600' : 'bg-white text-slate-400'}`}>
          <FileText size={32} />
        </div>
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">{title} CSV</h3>
      <p className="text-sm text-slate-500 mb-4">{count > 0 ? `โหลดแล้ว ${count} รายการ` : 'ยังไม่ได้อัปโหลด'}</p>
      
      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
        <Upload size={16} className="mr-2" />
        เลือกไฟล์
        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, type)} />
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <RefreshCw size={20} />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AutoReconcile Pro
            </h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              1. อัปโหลดข้อมูล
            </button>
            <span className="flex items-center text-slate-300"><ChevronRight size={16}/></span>
             <button 
              disabled={!stats}
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'report' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'}`}
            >
              2. ผลการตรวจสอบ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">เริ่มการกระทบยอดบัญชี</h2>
              <p className="text-slate-500">อัปโหลดไฟล์ CSV จากธนาคาร (Bank Statement) และระบบบัญชี (General Ledger) เพื่อเริ่มกระบวนการตรวจสอบอัตโนมัติ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <FileCard title="Bank Statement" count={bankData.length} type="bank" />
              <FileCard title="Book (GL)" count={bookData.length} type="book" />
            </div>

            <div className="text-center">
              <button
                onClick={runReconciliation}
                disabled={bankData.length === 0 || bookData.length === 0}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
              >
                <RefreshCw size={20} className="mr-2 animate-spin-slow" />
                ประมวลผลข้อมูล (Reconcile)
              </button>
            </div>
            
            {(bankData.length > 0 || bookData.length > 0) && (
                 <div className="mt-8 p-4 bg-orange-50 text-orange-800 rounded-lg text-sm text-center border border-orange-100">
                    <p className="font-semibold mb-1">💡 โหมดเข้มงวด (Strict Mode):</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      <li>ยึดเลข Invoice เป็นหลัก (ถ้าไม่ตรง = Missing ทันที)</li>
                      <li>ตรวจสอบความถูกต้องของยอดเงินและวันที่อย่างละเอียด</li>
                    </ul>
                 </div>
            )}
          </div>
        )}

        {activeTab === 'report' && stats && (
          <div className="space-y-8">
            <Dashboard stats={stats} />
            <TransactionTable results={results} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;