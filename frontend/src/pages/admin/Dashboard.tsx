import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, BookOpen, GraduationCap, CreditCard, Activity, Sparkles } from 'lucide-react';
import { CardSkeleton } from '../../components/shared/Skeleton';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface AdminDashboardData {
  stats: {
    students: number;
    teachers: number;
    classes: number;
    feesCollected: number;
  };
  charts: {
    monthlyFees: { month: string; totalCollected: string }[];
    attendancePie: { status: string; count: number }[];
  };
  activities: { id: number; type: string; title: string; description: string; date: string }[];
}

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<AdminDashboardData>({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/admin');
      return response.data;
    }
  });

  const { data: aiReport } = useQuery<any>({
    queryKey: ['adminDashboardAiReport'],
    queryFn: async () => {
      const response = await api.get('/api/academic/ai-performance-analysis');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-80 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-2xl">
        Failed to load dashboard statistics. Make sure the backend server is running.
      </div>
    );
  }

  const { stats, charts, activities } = data;

  // Pie Chart Color Palette
  const COLORS = {
    present: '#10B981', // green
    absent: '#EF4444',  // red
    late: '#F59E0B',    // orange
    holiday: '#3B82F6', // blue
  };

  const formattedPieData = charts.attendancePie.map(item => ({
    name: item.status.toUpperCase(),
    value: item.count,
    color: (COLORS as any)[item.status] || '#94a3b8'
  }));

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Teachers', value: stats.teachers, icon: GraduationCap, color: 'bg-emerald-500' },
    { label: 'Active Classes', value: stats.classes, icon: BookOpen, color: 'bg-violet-500' },
    { label: 'Fees Collected', value: formatCurrency(stats.feesCollected), icon: CreditCard, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
          Analytics overview for Springfield Academy.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-extrabold text-slate-700 dark:text-white font-sans">{card.value}</h3>
              </div>
              <div className={`p-4 rounded-xl text-white ${card.color} shadow-lg shadow-current/10`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Fee Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans">Monthly Fee Collection</h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyFees} margin={{ left: -10 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="totalCollected" fill="var(--primary-color, #3B82F6)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
          <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans">Attendance Distribution</h3>
          <div className="h-72 w-full text-xs flex flex-col items-center justify-center">
            {formattedPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={formattedPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {formattedPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm">No attendance logged this month.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Performance Panel */}
      {aiReport && aiReport.belowAverageStudents && aiReport.belowAverageStudents.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles size={18} className="text-primary animate-pulse" />
              <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans">AI Performance Warnings</h3>
            </div>
            <Link 
              to="/admin/ai-insights" 
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center space-x-1"
            >
              <span>View Full Report</span>
              <span>&rarr;</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiReport.belowAverageStudents.slice(0, 4).map((student: any) => (
              <div 
                key={student.studentId} 
                className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800 rounded-xl space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{student.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{student.className}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    student.attendancePercentage >= 85 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                    'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400'
                  }`}>
                    Att: {student.attendancePercentage}%
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold italic">
                  "{student.aiInsights}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <Activity size={18} className="text-slate-400" />
          <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div key={act.id} className="py-4 flex justify-between items-center text-sm first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-200">{act.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{act.description}</p>
                </div>
                <span className="text-slate-400 text-xs font-semibold">{formatDate(act.date)}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">No recent activities logged.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
