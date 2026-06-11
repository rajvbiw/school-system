import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Sparkles, GraduationCap, Users, AlertTriangle, 
  TrendingDown, Search, ArrowRight, BookOpen, Clock 
} from 'lucide-react';

export const AIInsights: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch classes
  const { data: classes } = useQuery<any[]>({
    queryKey: ['adminClassesList'],
    queryFn: async () => {
      const response = await axios.get('/api/classes');
      return response.data;
    }
  });

  // Fetch AI insights data
  const { data: report, isLoading, isError } = useQuery<{
    classAverage: Record<string, number>;
    belowAverageStudents: any[];
  }>({
    queryKey: ['aiPerformanceAnalysis', selectedClassId],
    queryFn: async () => {
      const params = selectedClassId ? { classId: selectedClassId } : {};
      const response = await axios.get('/api/academic/ai-performance-analysis', { params });
      return response.data;
    }
  });

  const filteredStudents = report?.belowAverageStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight flex items-center gap-2">
            <Sparkles className="text-primary animate-pulse" size={28} />
            <span>AI Performance Insights</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            AI-driven diagnostic reports to identify below-average scores and target key areas for improvement.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or adm no..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm sm:w-48">
            <BookOpen size={16} className="text-slate-400" />
            <select 
              className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer w-full"
              value={selectedClassId} 
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes?.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 bg-white dark:bg-slate-800 rounded-3xl animate-pulse flex flex-col items-center justify-center text-slate-400 font-semibold gap-3">
          <Sparkles className="animate-spin text-primary" size={32} />
          <span>Generating AI diagnostic logs...</span>
        </div>
      ) : isError ? (
        <div className="p-8 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-900/50 flex flex-col items-center gap-2">
          <AlertTriangle size={24} />
          <h3 className="font-extrabold text-sm">Failed to generate insights</h3>
          <p className="text-xs font-medium">Please verify database seeds and exam marks entry.</p>
        </div>
      ) : (
        <>
          {/* Diagnostic Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric 1 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-3xl shadow-sm flex items-center space-x-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 text-orange-500 rounded-2xl">
                <Users size={20} />
              </div>
              <div>
                <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider block">Below-Avg Students</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5 block">
                  {report?.belowAverageStudents.length || 0} Students
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-3xl shadow-sm flex items-center space-x-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl">
                <TrendingDown size={20} />
              </div>
              <div>
                <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider block">Key Focus Subjects</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5 block truncate max-w-[200px]">
                  {Object.keys(report?.classAverage || {}).slice(0, 2).join(', ') || 'None'}
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100/40 dark:border-indigo-900/40 p-6 rounded-3xl shadow-sm flex items-center space-x-4">
              <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="text-indigo-400 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider block">AI Model State</span>
                <span className="text-2xl font-extrabold text-indigo-800 dark:text-indigo-100 mt-0.5 block">
                  Diagnostics Active
                </span>
              </div>
            </div>
          </div>

          {/* Class Baseline Averages */}
          {report?.classAverage && Object.keys(report.classAverage).length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
                <GraduationCap className="text-slate-400" size={18} />
                <span>Class Subject Baselines (Averages)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {Object.entries(report.classAverage).map(([subName, avg]) => (
                  <div key={subName} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-center">
                    <span className="text-slate-400 text-xs font-bold truncate block mb-1">{subName}</span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200">{avg}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Below Average Student Roster & AI recommendations */}
          <div className="space-y-6">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={18} />
              <span>Target Students Needing Support</span>
            </h3>

            {filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredStudents.map((student: any) => (
                  <div 
                    key={student.studentId} 
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                  >
                    {/* Left: Student Metadata */}
                    <div className="p-6 md:w-80 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 flex flex-col justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                          {student.className}
                        </span>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-lg mt-2">{student.name}</h4>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                          Adm No: {student.admissionNo}
                        </p>
                      </div>

                      {/* Attendance indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>Attendance</span>
                          </span>
                          <span>{student.attendancePercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              student.attendancePercentage >= 85 ? 'bg-emerald-500' :
                              student.attendancePercentage >= 75 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.attendancePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Middle: Deviations */}
                    <div className="p-6 flex-1 flex flex-col gap-4">
                      <div>
                        <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Performance Deviations</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {student.lowSubjects.map((sub: any, sIdx: number) => (
                            <div key={sIdx} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 rounded-2xl">
                              <div>
                                <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200 block">{sub.subjectName}</span>
                                <span className="text-xs text-slate-400 font-medium">Class Avg: {sub.classAverage}%</span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-sm text-red-600 dark:text-red-400 block">{sub.marks}%</span>
                                <span className="text-[10px] font-bold text-red-500 flex items-center justify-end">
                                  {sub.deviation}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendation block */}
                      <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30 p-4 rounded-2xl flex items-start space-x-3">
                        <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400 mt-1 flex-shrink-0 animate-pulse" />
                        <div className="space-y-1">
                          <span className="font-extrabold text-[10px] tracking-wider uppercase text-indigo-500 dark:text-indigo-400 block">AI Recommended Intervention</span>
                          <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed">
                            {student.aiInsights}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl text-center shadow-sm">
                <Sparkles size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">All Students Performing Well!</h4>
                <p className="text-slate-400 text-xs mt-1 font-medium">No students are currently scoring below the subject class averages.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default AIInsights;
