import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Clock, ClipboardList, CheckCircle } from 'lucide-react';
import { CardSkeleton } from '../../components/shared/Skeleton';
import { formatDate } from '../../utils/formatters';

interface ScheduleSlot {
  id: number;
  startTime: string;
  endTime: string;
  subject: { name: string; code: string };
  class: { name: string; section: string };
}

interface AssignmentItem {
  id: number;
  title: string;
  dueDate: string;
  subject: { name: string };
}

interface TeacherDashboardData {
  todaySchedule: ScheduleSlot[];
  assignments: AssignmentItem[];
  attendanceSummary: {
    totalStudents: number;
    presentToday: number;
  };
}

export const TeacherDashboard: React.FC = () => {
  const { data, isLoading } = useQuery<TeacherDashboardData>({
    queryKey: ['teacherDashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/teacher');
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

  const schedule = data?.todaySchedule || [];
  const assignments = data?.assignments || [];
  const attendance = data?.attendanceSummary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Faculty Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Review your timetable schedule, assignments, and daily metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timetable Schedule */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Clock className="text-slate-400" size={18} />
            <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans">Today's Schedule</h3>
          </div>
          <div className="space-y-3">
            {schedule.length > 0 ? (
              schedule.map(slot => (
                <div key={slot.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-xs text-primary">{slot.subject.name} ({slot.subject.code})</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{slot.class.name}-{slot.class.section}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">{slot.startTime} - {slot.endTime}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-4 text-center">No classes scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <ClipboardList className="text-slate-400" size={18} />
            <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans">Active Assignments</h3>
          </div>
          <div className="space-y-3">
            {assignments.length > 0 ? (
              assignments.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-200">{item.title}</p>
                    <p className="text-slate-400 text-[10px] font-semibold">{item.subject.name}</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 uppercase">Due {formatDate(item.dueDate)}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-4 text-center">No assignments posted.</p>
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <CheckCircle className="text-slate-400" size={18} />
            <h3 className="text-md font-bold text-slate-800 dark:text-white font-sans">Attendance Tracker</h3>
          </div>
          {attendance ? (
            <div className="space-y-4 text-center py-6">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Present Ratio Today</p>
                <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white font-sans">{attendance.presentToday} / {attendance.totalStudents}</h2>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3.5 border border-slate-200/50">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${(attendance.presentToday / attendance.totalStudents) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-xs py-4 text-center">No class attendance logged today.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default TeacherDashboard;
