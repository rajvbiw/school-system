import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GraduationCap, BookOpen, Save, FileEdit } from 'lucide-react';

interface ResultRow {
  studentId: number;
  name: string;
  admissionNo: string;
  marksObtained?: number;
}

export const TeacherResults: React.FC = () => {
  const [examId, setExamId] = useState('1');
  const [subjectId, setSubjectId] = useState('1');
  const [localMarks, setLocalMarks] = useState<Record<number, number>>({});

  // Fetch exams list
  const { data: exams } = useQuery<any[]>({
    queryKey: ['teacherExamsList'],
    queryFn: async () => {
      const response = await axios.get('/api/exams');
      return response.data;
    }
  });

  // Fetch class students for marks entry
  // For fallback, we query class 1 students list
  const { data: students, isLoading } = useQuery<any[]>({
    queryKey: ['teacherExamStudents', subjectId],
    queryFn: async () => {
      const response = await axios.get('/api/students', { params: { classId: 1 } });
      return response.data.students;
    }
  });

  const uploadResultsMutation = useMutation({
    mutationFn: async (payload: any) => {
      await axios.post('/api/results/bulk', payload);
    },
    onSuccess: () => {
      toast.success('Subject marks uploaded successfully!');
      setLocalMarks({});
    },
    onError: () => {
      toast.error('Failed to upload marks sheet');
    }
  });

  const handleMarkChange = (studentId: number, val: string) => {
    const numeric = parseFloat(val);
    setLocalMarks(prev => ({
      ...prev,
      [studentId]: isNaN(numeric) ? 0 : numeric
    }));
  };

  const handleSave = () => {
    if (!students) return;

    // For simplicity of local typing, we extract state values
    const list = students.map(student => ({
      studentId: student.id,
      marksObtained: localMarks[student.id] !== undefined ? localMarks[student.id] : 0
    }));

    uploadResultsMutation.mutate({
      examId: parseInt(examId),
      subjectId: parseInt(subjectId),
      marksList: list
    });
  };

  const subjects = [
    { id: 1, name: 'Mathematics' },
    { id: 2, name: 'Science' },
    { id: 3, name: 'English' }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Record Grades</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Record marksheets details directly to student report cards.</p>
        </div>

        <div className="flex space-x-3">
          {/* Exam Select */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm">
            <GraduationCap size={16} className="text-slate-400" />
            <select 
              className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
              value={examId} 
              onChange={e => setExamId(e.target.value)}
            >
              {exams?.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>

          {/* Subject Select */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm">
            <BookOpen size={16} className="text-slate-400" />
            <select 
              className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
              value={subjectId} 
              onChange={e => setSubjectId(e.target.value)}
            >
              {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Roster sheet */}
      {isLoading ? (
        <div className="h-80 bg-white dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 font-semibold text-sm">
          Loading marksheet roster...
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Class Marks Input</span>
            <button 
              onClick={handleSave}
              disabled={uploadResultsMutation.isPending}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-primary-light"
            >
              <Save size={14} />
              <span>{uploadResultsMutation.isPending ? 'Uploading...' : 'Upload Marksheet'}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {students && students.length > 0 ? (
              students.map(student => {
                const currentMark = localMarks[student.id] !== undefined ? localMarks[student.id] : '';
                return (
                  <div key={student.id} className="p-4 flex flex-row items-center justify-between gap-3 hover:bg-slate-50/20 transition-colors">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-sm text-slate-700 dark:text-white">{student.user.name}</h4>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Adm No: {student.admissionNo}</p>
                    </div>

                    {/* Marks Input */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 border border-slate-200 dark:border-slate-700 p-2 text-center rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                        placeholder="Marks"
                        value={currentMark}
                        onChange={e => handleMarkChange(student.id, e.target.value)}
                      />
                      <span className="text-xs font-bold text-slate-400">/ 100</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">No students enrolled in this class.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherResults;
