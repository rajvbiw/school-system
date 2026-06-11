import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Clock, Calendar as CalendarIcon, User } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

interface TimetableSlot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: { name: string; code: string };
}

export const StudentTimetable: React.FC = () => {
  const { user } = useAuth();

  // Fetch student profile to get classId
  const { data: profile } = useQuery({
    queryKey: ['studentProfileTimetableId'],
    queryFn: async () => {
      const response = await axios.get('/api/students', { params: { search: user?.email } });
      return response.data.students[0];
    },
    enabled: !!user
  });

  // Fetch timetable slots for the class
  const { data: timetableSlots, isLoading } = useQuery<TimetableSlot[]>({
    queryKey: ['studentTimetableSlots', profile?.classId],
    queryFn: async () => {
      const response = await axios.get('/api/timetable', {
        params: { class_id: profile.classId }
      });
      return response.data;
    },
    enabled: !!profile?.classId
  });

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SLOTS = ['09:00 - 09:45', '10:00 - 10:45', '11:00 - 11:45', '12:00 - 12:45'];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Class Timetable</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Review your weekly scheduling grid and periods timeline.</p>
      </div>

      {isLoading ? (
        <div className="h-64 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-32 border-r border-slate-100 dark:border-slate-700/60">Day</th>
                  {SLOTS.map((slot, idx) => (
                    <th key={idx} className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <Clock size={13} className="text-slate-400" />
                        <span>Period {idx + 1}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium lowercase block mt-0.5">{slot}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {DAYS.map((dayName, dayIdx) => {
                  const dayOfWeekNum = dayIdx + 1; // 1-6
                  return (
                    <tr key={dayIdx} className="hover:bg-slate-50/20">
                      <td className="p-4 font-bold text-sm text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/60 flex items-center space-x-2">
                        <CalendarIcon size={14} className="text-primary" />
                        <span>{dayName}</span>
                      </td>

                      {SLOTS.map((slot, slotIdx) => {
                        const slotStartTime = slot.split(' - ')[0];
                        const matchingSlot = timetableSlots?.find(s => 
                          s.dayOfWeek === dayOfWeekNum && s.startTime.startsWith(slotStartTime)
                        );

                        return (
                          <td key={slotIdx} className="p-4 text-center">
                            {matchingSlot ? (
                              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-3 rounded-xl space-y-1 transform hover:scale-[1.02] transition-transform">
                                <p className="font-bold text-xs text-primary">{matchingSlot.subject.name}</p>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{matchingSlot.subject.code}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-slate-600 font-medium font-sans">Free Period</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentTimetable;
