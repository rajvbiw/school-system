import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BookMarked, Users, Compass } from 'lucide-react';
import { CardSkeleton } from '../../components/shared/Skeleton';

interface ClassSubjectItem {
  id: number;
  name: string;
  code: string;
  class: { id: number; name: string; section: string; grade: string; roomNo?: string };
}

export const TeacherClasses: React.FC = () => {
  // Query to get classes/subjects assigned to teacher
  const { data: assignments, isLoading } = useQuery<ClassSubjectItem[]>({
    queryKey: ['teacherClasses'],
    queryFn: async () => {
      // Return a simulated query list based on seeded teachers mapping
      return [
        { id: 1, name: 'Mathematics', code: 'MATH101-Grade9', class: { id: 1, name: 'Grade 9', section: 'A', grade: 'Grade 9', roomNo: 'Room 101' } },
        { id: 2, name: 'Science', code: 'SCI101-Grade10', class: { id: 2, name: 'Grade 10', section: 'A', grade: 'Grade 10', roomNo: 'Room 102' } },
        { id: 3, name: 'English', code: 'ENG101-Grade11', class: { id: 3, name: 'Grade 11', section: 'A', grade: 'Grade 11', roomNo: 'Room 103' } }
      ];
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">My Classes</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Review your subject syllabi allocations and classroom sections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments && assignments.length > 0 ? (
          assignments.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-white font-sans">{item.class.name}-{item.class.section}</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{item.class.grade}</p>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <BookMarked size={20} />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center space-x-1.5 text-slate-500">
                  <Compass size={14} />
                  <span>{item.name} ({item.class.roomNo || 'N/A'})</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold">{item.code}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-sm py-4">No subject allotments configured.</p>
        )}
      </div>
    </div>
  );
};
export default TeacherClasses;
