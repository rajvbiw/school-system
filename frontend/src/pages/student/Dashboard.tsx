import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BookOpen, Calendar, CreditCard, Award, CheckCircle } from 'lucide-react';
import { CardSkeleton } from '../../components/shared/Skeleton';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface StudentDashboardData {
  className: string;
  attendancePercentage: number;
  upcomingExams: { id: number; name: string; startDate: string; type: string }[];
  pendingFees: number;
  recentResults: { id: number; marksObtained: string; grade: string; exam: { name: string }; subject: { name: string } }[];
}

export const StudentDashboard: React.FC = () => {
  const { data, isLoading } = useQuery<StudentDashboardData>({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/student');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  const attendance = data?.attendancePercentage || 100;
  const exams = data?.upcomingExams || [];
  const pendingFees = data?.pendingFees || 0;
  const results = data?.recentResults || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Student Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Class: {data?.className || 'N/A'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Gauge Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2 w-full border-b border-slate-50 dark:border-slate-700/60 pb-3">
            <CheckCircle className="text-slate-400" size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Ratio</h3>
          </div>
          <div className="relative flex items-center justify-center h-32 w-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="50" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
              <circle 
                cx="64" 
                cy="64" 
                r="50" 
                stroke="var(--primary-color, #3B82F6)" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={314}
                strokeDashoffset={314 - (314 * attendance) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-2xl font-extrabold text-slate-800 dark:text-white font-sans">{attendance}%</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase">Present Attendance</p>
        </div>

        {/* Fees Invoices Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-700/60 pb-3">
            <CreditCard className="text-slate-400" size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Balance Pending</h3>
          </div>
          <div className="py-2">
            <h2 className={`text-3xl font-extrabold font-sans ${pendingFees > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {formatCurrency(pendingFees)}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
              {pendingFees > 0 ? 'Fees payment is pending. Please clear invoices.' : 'All fee structure items cleared.'}
            </p>
          </div>
          <div className="border-t border-slate-50 dark:border-slate-700/60 pt-3 flex justify-end">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Academic Term 2026</span>
          </div>
        </div>

        {/* Upcoming Exams Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-700/60 pb-3">
            <Calendar className="text-slate-400" size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Exams</h3>
          </div>
          <div className="space-y-3">
            {exams.length > 0 ? (
              exams.map(ex => (
                <div key={ex.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{ex.name}</p>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{ex.type} test</p>
                  </div>
                  <span className="font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">{formatDate(ex.startDate)}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-4 text-center">No upcoming test records.</p>
            )}
          </div>
        </div>

      </div>

      {/* Recent Marks */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-700 pb-3">
          <Award className="text-slate-400" size={18} />
          <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans">Recent Test Marks</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {results.length > 0 ? (
            results.map(res => (
              <div key={res.id} className="py-4 flex justify-between items-center text-sm first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-200">{res.subject.name}</p>
                  <p className="text-slate-400 text-xs">{res.exam.name}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-extrabold text-slate-800 dark:text-white text-md">{res.marksObtained} / 100</span>
                  <span className="bg-primary-light text-primary px-2.5 py-1 rounded-lg text-xs font-bold uppercase">{res.grade}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">No exam results recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
