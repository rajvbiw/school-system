import React, { useState } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { BookOpen, Calendar as CalendarIcon, CheckSquare, Save } from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const [classId, setClassId] = useState('1');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const { attendanceQuery, submitAttendanceMutation } = useAttendance(classId, date);
  const { data: students, isLoading } = attendanceQuery;

  // Local state to manage changes before clicking save
  const [localStatuses, setLocalStatuses] = useState<Record<number, 'present' | 'absent' | 'late' | 'holiday'>>({});

  const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'late' | 'holiday') => {
    setLocalStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = () => {
    if (!students) return;
    
    // Merge database state with changes
    const records = students.map(s => ({
      studentId: s.studentId,
      status: localStatuses[s.studentId] || s.status || 'present' // default to present if null
    }));

    submitAttendanceMutation.mutate({
      classId: parseInt(classId),
      date,
      records
    });
  };

  const classes = [
    { id: 1, name: 'Grade 9-A' },
    { id: 2, name: 'Grade 10-A' },
    { id: 3, name: 'Grade 11-A' },
    { id: 4, name: 'Grade 12-A' },
    { id: 5, name: 'Grade 8-C' }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Mark Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Log daily roll call checks for your classrooms.</p>
        </div>

        <div className="flex space-x-3">
          {/* Class Select */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm">
            <BookOpen size={16} className="text-slate-400" />
            <select 
              className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
              value={classId} 
              onChange={e => {
                setClassId(e.target.value);
                setLocalStatuses({});
              }}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm">
            <CalendarIcon size={16} className="text-slate-400" />
            <input 
              type="date" 
              className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
              value={date} 
              onChange={e => {
                setDate(e.target.value);
                setLocalStatuses({});
              }}
            />
          </div>
        </div>
      </div>

      {/* Roster list */}
      {isLoading ? (
        <div className="h-80 bg-white dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 font-semibold text-sm">
          Fetching class roster...
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Class Student List</span>
            <button 
              onClick={handleSave}
              disabled={submitAttendanceMutation.isPending}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-primary-light"
            >
              <Save size={14} />
              <span>{submitAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {students && students.length > 0 ? (
              students.map(student => {
                const activeStatus = localStatuses[student.studentId] || student.status || 'present';
                return (
                  <div key={student.studentId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/20 transition-colors">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-sm text-slate-700 dark:text-white">{student.name}</h4>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Adm No: {student.admissionNo}</p>
                    </div>

                    {/* Status Toggles */}
                    <div className="flex space-x-1.5">
                      {['present', 'absent', 'late', 'holiday'].map(statusOption => (
                        <button
                          key={statusOption}
                          onClick={() => handleStatusChange(student.studentId, statusOption as any)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                            activeStatus === statusOption 
                              ? statusOption === 'present' 
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                                : statusOption === 'absent'
                                ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10'
                                : statusOption === 'late'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10'
                                : 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/10'
                              : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {statusOption}
                        </button>
                      ))}
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
export default TeacherAttendance;
