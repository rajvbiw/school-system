import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, BookOpen, User } from 'lucide-react';

interface TimetableSlot {
  id: number;
  dayOfWeek: number; // 1 to 6 (Mon-Sat)
  startTime: string;
  endTime: string;
  subject: { name: string; code: string; teacherId: number };
  classId: number;
}

export const Timetable: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState('1');

  // Fetch classes dropdown
  const { data: classes } = useQuery<any[]>({
    queryKey: ['timetableClasses'],
    queryFn: async () => {
      return [
        { id: 1, name: 'Grade 9-A' },
        { id: 2, name: 'Grade 10-A' },
        { id: 3, name: 'Grade 11-A' },
        { id: 4, name: 'Grade 12-A' },
        { id: 5, name: 'Grade 8-C' }
      ];
    }
  });

  // Fetch timetable for selected class
  const { data: timetableSlots, isLoading } = useQuery<TimetableSlot[]>({
    queryKey: ['timetable', selectedClassId],
    queryFn: async () => {
      const response = await axios.get('/api/timetable', {
        params: { class_id: selectedClassId }
      });
      return response.data;
    },
    enabled: !!selectedClassId
  });

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SLOTS = ['09:00 - 09:45', '10:00 - 10:45', '11:00 - 11:45', '12:00 - 12:45'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Class Timetables</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Weekly schedule and classroom periods registry.</p>
        </div>

        {/* Dropdown class filter */}
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm">
          <BookOpen size={16} className="text-slate-400" />
          <select 
            className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)}
          >
            {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Grid Layout */}
      {isLoading ? (
        <div className="h-80 bg-white dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 font-semibold text-sm">
          Loading schedule data...
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700">
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
                    <tr key={dayIdx} className="hover:bg-slate-50/20 transition-colors">
                      <td className="p-4 font-bold text-sm text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/60 flex items-center space-x-2">
                        <CalendarIcon size={14} className="text-primary" />
                        <span>{dayName}</span>
                      </td>
                      
                      {SLOTS.map((slot, slotIdx) => {
                        const slotStartTime = slot.split(' - ')[0];
                        // Find matching subject slot for this day and start hour
                        const matchingSlot = timetableSlots?.find(s => 
                          s.dayOfWeek === dayOfWeekNum && s.startTime.startsWith(slotStartTime)
                        );

                        return (
                          <td key={slotIdx} className="p-4 text-center">
                            {matchingSlot ? (
                              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-3 rounded-xl space-y-1 transform hover:scale-[1.02] transition-transform shadow-sm">
                                <p className="font-bold text-xs text-primary">{matchingSlot.subject.name}</p>
                                <p className="text-[10px] font-semibold text-slate-400">{matchingSlot.subject.code}</p>
                                <div className="flex items-center justify-center space-x-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                  <User size={10} />
                                  <span>Faculty</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-slate-600 font-medium">Free Period</span>
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
export default Timetable;
