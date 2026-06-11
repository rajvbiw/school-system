import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, CheckCircle, CreditCard, Award, ChevronRight } from 'lucide-react';
import { CardSkeleton } from '../../components/shared/Skeleton';
import { formatCurrency } from '../../utils/formatters';

interface ChildSummary {
  studentId: number;
  name: string;
  admissionNo: string;
  attendancePercentage: number;
  pendingFees: number;
  profilePhoto?: string;
  latestResult: { examName: string; grade: string; marks: string } | null;
}

interface ParentDashboardData {
  children: ChildSummary[];
}

export const ParentDashboard: React.FC = () => {
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  // Fetch parent dashboard data
  const { data, isLoading } = useQuery<ParentDashboardData>({
    queryKey: ['parentDashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/parent');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  const children = data?.children || [];
  const activeChild = children[activeChildIndex];

  return (
    <div className="space-y-6">
      {/* Page Title & Child Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Parent Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Review academic metrics, billings, and grades for your children.</p>
        </div>

        {children.length > 1 && (
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm">
            <Users size={16} className="text-slate-400" />
            <select 
              className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
              value={activeChildIndex} 
              onChange={e => setActiveChildIndex(parseInt(e.target.value))}
            >
              {children.map((c, idx) => <option key={c.studentId} value={idx}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {activeChild ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Attendance Tracker */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-700/60 pb-3 text-slate-400">
              <CheckCircle size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Attendance Rate</h3>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans">{activeChild.attendancePercentage}%</h2>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 mt-3">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${activeChild.attendancePercentage}%` }} 
                />
              </div>
            </div>
            <span className="text-[9px] uppercase font-bold text-slate-400">Attendance logged this term</span>
          </div>

          {/* Pending Fees */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-700/60 pb-3 text-slate-400">
              <CreditCard size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Overdue Fees</h3>
            </div>
            <div>
              <h2 className={`text-3xl font-extrabold font-sans ${activeChild.pendingFees > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {formatCurrency(activeChild.pendingFees)}
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 font-medium">
                {activeChild.pendingFees > 0 ? 'Invoices overdue. Please pay.' : 'Invoices fully paid.'}
              </p>
            </div>
            <span className="text-[9px] uppercase font-bold text-slate-400">Online Stripe checkout ready</span>
          </div>

          {/* Latest Exam Result */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-700/60 pb-3 text-slate-400">
              <Award size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Latest Test Result</h3>
            </div>
            {activeChild.latestResult ? (
              <div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-extrabold text-xs text-primary">{activeChild.latestResult.examName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Grade: {activeChild.latestResult.grade}</p>
                  </div>
                  <span className="text-base font-extrabold text-slate-800 dark:text-white">{activeChild.latestResult.marks} / 100</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs py-4 text-center">No grades logged.</p>
            )}
            <span className="text-[9px] uppercase font-bold text-slate-400">Printable cards available</span>
          </div>

        </div>
      ) : (
        <p className="text-slate-400 text-sm py-4">No children profile links resolved.</p>
      )}
    </div>
  );
};
export default ParentDashboard;
