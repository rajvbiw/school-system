import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

interface AttendanceLog {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday';
}

export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const activeMonth = currentDate.getMonth() + 1; // 1-12
  const activeYear = currentDate.getFullYear();

  // Fetch student profile first to get student.id
  const { data: profile } = useQuery({
    queryKey: ['studentProfileId'],
    queryFn: async () => {
      // Find logged in student record
      const response = await axios.get('/api/students', { params: { search: user?.email } });
      return response.data.students[0];
    },
    enabled: !!user
  });

  // Fetch attendance logs
  const { data: logs, isLoading } = useQuery<AttendanceLog[]>({
    queryKey: ['studentAttendanceLogs', profile?.id, activeMonth, activeYear],
    queryFn: async () => {
      const response = await axios.get(`/api/attendance/student/${profile.id}`, {
        params: { month: activeMonth, year: activeYear }
      });
      return response.data;
    },
    enabled: !!profile?.id
  });

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  // Build calendar blocks
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const totalDays = getDaysInMonth(activeMonth, activeYear);
  const firstDayIndex = new Date(activeYear, activeMonth - 1, 1).getDay(); // 0 (Sun) - 6 (Sat)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const COLORS = {
    present: 'bg-emerald-500 text-white shadow-emerald-500/10',
    absent: 'bg-red-500 text-white shadow-red-500/10',
    late: 'bg-amber-500 text-white shadow-amber-500/10',
    holiday: 'bg-blue-500 text-white shadow-blue-500/10',
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Attendance Record</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Monthly academic roll call calendar view.</p>
      </div>

      {/* Calendar Header selector */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm">
        <button onClick={prevMonth} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50">
          <ChevronLeft size={16} />
        </button>
        <span className="font-extrabold text-sm text-slate-700 dark:text-white uppercase tracking-wider">
          {monthNames[activeMonth - 1]} {activeYear}
        </span>
        <button onClick={nextMonth} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid container */}
      {isLoading ? (
        <div className="h-64 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
          {/* Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty blocks prior to start of month */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-10 w-10" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: totalDays }).map((_, dayIdx) => {
              const dayNum = dayIdx + 1;
              const dayStr = `${activeYear}-${String(activeMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              
              // Find matching attendance status
              const record = logs?.find(l => l.date === dayStr);
              const statusClass = record ? (COLORS as any)[record.status] : 'bg-slate-50 text-slate-400 border border-slate-100 dark:bg-slate-900 dark:border-slate-800';

              return (
                <div 
                  key={dayNum} 
                  className={`h-10 w-10 flex items-center justify-center rounded-xl text-xs font-bold shadow-sm ${statusClass}`}
                  title={record ? `Status: ${record.status.toUpperCase()}` : 'No class logged'}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>

          {/* Color legends */}
          <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-700/60 pt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center space-x-1"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /><span>Present</span></div>
            <div className="flex items-center space-x-1"><div className="w-2.5 h-2.5 bg-red-500 rounded-full" /><span>Absent</span></div>
            <div className="flex items-center space-x-1"><div className="w-2.5 h-2.5 bg-amber-500 rounded-full" /><span>Late</span></div>
            <div className="flex items-center space-x-1"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /><span>Holiday</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentAttendance;
