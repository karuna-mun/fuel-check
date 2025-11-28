import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SummaryStats } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';

interface DashboardProps {
  stats: SummaryStats;
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  colorClass: string;
  subText?: string;
}> = ({ title, value, icon, colorClass, subText }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      {subText && <p className="text-xs text-slate-400 mt-2">{subText}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass} text-white`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const chartData = [
    { name: 'Matched', value: stats.matchedCount },
    { name: 'Unmatched', value: stats.unmatchedCount },
    { name: 'Mismatch', value: stats.mismatchCount },
  ];

  // Filter out zero values for cleaner chart
  const activeData = chartData.filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="ความแม่นยำ (Accuracy)" 
          value={`${stats.accuracy.toFixed(1)}%`}
          icon={<CheckCircle2 size={24} />}
          colorClass="bg-blue-500"
          subText="อัตราส่วนรายการที่ตรงกันทั้งหมด"
        />
        <StatCard 
          title="จับคู่สำเร็จ (Matched)" 
          value={stats.matchedCount}
          icon={<CheckCircle2 size={24} />}
          colorClass="bg-green-500"
        />
        <StatCard 
          title="ยอดเงินไม่ตรง (Mismatch)" 
          value={stats.mismatchCount}
          icon={<AlertTriangle size={24} />}
          colorClass="bg-amber-500"
        />
        <StatCard 
          title="ข้อมูลหาย (Unmatched)" 
          value={stats.unmatchedCount}
          icon={<XCircle size={24} />}
          colorClass="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
             <FileSpreadsheet className="text-slate-500" size={20}/>
             ภาพรวมข้อมูล (Overview)
           </h3>
           <div className="grid grid-cols-2 gap-8 mt-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-500 mb-2">รายการ Bank ทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-700">{stats.totalBank}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-500 mb-2">รายการ Book ทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-700">{stats.totalBook}</p>
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">สถานะการตรวจสอบ</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {activeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;