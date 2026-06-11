import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Printer, GraduationCap, Award } from 'lucide-react';
import { CardSkeleton } from '../../components/shared/Skeleton';
import { formatDate } from '../../utils/formatters';

interface ChildResultItem {
  id: number;
  marksObtained: string;
  grade: string;
  exam: { id: number; name: string };
  subject: { name: string; code: string };
}

export const ParentResults: React.FC = () => {
  const [childIndex, setChildIndex] = useState(0);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // Fetch parent children
  const { data: children, isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ['parentChildrenResult'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/parent');
      return response.data.children;
    }
  });

  const activeChild = children?.[childIndex];

  // Fetch results for selected child
  const { data: results, isLoading: resultsLoading } = useQuery<ChildResultItem[]>({
    queryKey: ['parentChildResults', activeChild?.studentId],
    queryFn: async () => {
      const response = await axios.get(`/api/results/student/${activeChild.studentId}`);
      return response.data;
    },
    enabled: !!activeChild?.studentId
  });

  // Extract unique exams for selection dropdown
  const uniqueExams = results 
    ? Array.from(new Set(results.map(r => JSON.stringify(r.exam)))).map(s => JSON.parse(s))
    : [];

  // Automatically select first exam if none selected
  if (!selectedExamId && uniqueExams.length > 0) {
    setSelectedExamId(uniqueExams[0].id);
  }

  const activeResults = results?.filter(r => r.exam.id === selectedExamId) || [];

  const handlePrintCard = () => {
    if (!activeChild?.studentId || !selectedExamId) return;
    window.open(`/results/report-card/${activeChild.studentId}/${selectedExamId}`, '_blank');
  };

  if (childrenLoading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Academic Report Cards</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Review your child's final scoresheets and download grades.</p>
        </div>

        <div className="flex space-x-3">
          {children && children.length > 1 && (
            <select 
              className="text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 cursor-pointer shadow-sm"
              value={childIndex} 
              onChange={e => {
                setChildIndex(parseInt(e.target.value));
                setSelectedExamId(null);
              }}
            >
              {children.map((c: any, idx: number) => <option key={c.studentId} value={idx}>{c.name}</option>)}
            </select>
          )}

          {uniqueExams.length > 0 && (
            <>
              <select
                className="text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 cursor-pointer shadow-sm"
                value={selectedExamId || ''}
                onChange={e => setSelectedExamId(parseInt(e.target.value))}
              >
                {uniqueExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>

              <button 
                onClick={handlePrintCard}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md shadow-primary-light"
              >
                <Printer size={14} />
                <span>Print Report Card</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Roster list */}
      {resultsLoading ? (
        <div className="h-64 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
      ) : activeResults.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                  <th className="p-3 font-bold text-slate-400">Subject</th>
                  <th className="p-3 font-bold text-slate-500 text-center">Marks Obtained</th>
                  <th className="p-3 font-bold text-slate-500 text-center">Grade Letter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {activeResults.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/20">
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{res.subject.name}</td>
                    <td className="p-3 text-center font-extrabold text-slate-800 dark:text-white">{res.marksObtained} / 100</td>
                    <td className="p-3 text-center"><span className="bg-primary-light text-primary px-2.5 py-0.5 rounded-lg font-bold">{res.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-slate-400 text-sm text-center py-12">No exam results recorded.</p>
      )}
    </div>
  );
};
export default ParentResults;
