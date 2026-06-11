import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { GraduationCap, Award, Printer } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

interface StudentResult {
  id: number;
  marksObtained: string;
  grade: string;
  remarks?: string;
  exam: { id: number; name: string; type: string };
  subject: { name: string; code: string };
}

export const StudentResults: React.FC = () => {
  const { user } = useAuth();
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // Fetch student profile first to get student.id
  const { data: profile } = useQuery({
    queryKey: ['studentProfileResultId'],
    queryFn: async () => {
      const response = await axios.get('/api/students', { params: { search: user?.email } });
      return response.data.students[0];
    },
    enabled: !!user
  });

  // Fetch results
  const { data: results, isLoading } = useQuery<StudentResult[]>({
    queryKey: ['studentResults', profile?.id],
    queryFn: async () => {
      const response = await axios.get(`/api/results/student/${profile.id}`);
      return response.data;
    },
    enabled: !!profile?.id
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

  const chartData = activeResults.map(r => ({
    subject: r.subject.name,
    marks: parseFloat(r.marksObtained)
  }));

  const handlePrintReport = () => {
    if (!profile?.id || !selectedExamId) return;
    window.open(`/results/report-card/${profile.id}/${selectedExamId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Academic Results</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Review exam marksheets details and GPAs.</p>
        </div>

        {uniqueExams.length > 0 && (
          <div className="flex space-x-3">
            {/* Exam Selector */}
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm">
              <GraduationCap size={16} className="text-slate-400" />
              <select 
                className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
                value={selectedExamId || ''} 
                onChange={e => setSelectedExamId(parseInt(e.target.value))}
              >
                {uniqueExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
            </div>

            {/* Print Button */}
            <button 
              onClick={handlePrintReport}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-sm"
            >
              <Printer size={14} />
              <span>Print Card</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-64 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
      ) : activeResults.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table list */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Subjects Grades Sheet</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-3 font-bold text-slate-400">Subject</th>
                    <th className="p-3 font-bold text-slate-500 text-center">Marks Obtained</th>
                    <th className="p-3 font-bold text-slate-500 text-center">Grade</th>
                    <th className="p-3 font-bold text-slate-500 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {activeResults.map(res => (
                    <tr key={res.id} className="hover:bg-slate-50/20">
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{res.subject.name}</td>
                      <td className="p-3 text-center font-extrabold text-slate-800 dark:text-white">{res.marksObtained} / 100</td>
                      <td className="p-3 text-center"><span className="bg-primary-light text-primary px-2.5 py-0.5 rounded-lg font-bold">{res.grade}</span></td>
                      <td className="p-3 text-center font-medium text-slate-500">{res.remarks || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recharts chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Performance Graph</h3>
            <div className="h-60 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -10 }}>
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="marks" fill="var(--primary-color, #3B82F6)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-400 text-sm text-center py-12">No exam results recorded.</p>
      )}
    </div>
  );
};
export default StudentResults;
