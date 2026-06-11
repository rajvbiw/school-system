import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, GraduationCap, Calendar, FileText, Printer } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';

interface ExamRow {
  id: number;
  name: string;
  type: 'unit' | 'mid' | 'final' | 'mock';
  startDate: string;
  endDate: string;
  class: { name: string; section: string };
}

export const Exams: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  // Print options
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printStudentId, setPrintStudentId] = useState('');
  const [printExamId, setPrintExamId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [type, setType] = useState('mid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch exams
  const { data: exams, isLoading } = useQuery<ExamRow[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await axios.get('/api/exams');
      return response.data;
    }
  });

  // Fetch classes for dropdown
  const { data: classes } = useQuery<any[]>({
    queryKey: ['examClassesDropdown'],
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

  const createExamMutation = useMutation({
    mutationFn: async (payload: any) => {
      await axios.post('/api/exams', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam scheduled successfully!');
      setIsOpen(false);
      setName(''); setClassId(''); setStartDate(''); setEndDate('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to schedule exam');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExamMutation.mutate({
      name,
      classId: parseInt(classId),
      startDate,
      endDate,
      type,
      // Pass basic mathematics exam subject details as default
      subjects: [
        { subjectId: 1, examDate: startDate, maxMarks: 100, passMarks: 40, durationMins: 120 }
      ]
    });
  };

  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!printStudentId || !printExamId) return;
    // Redirect to the print-friendly report card page
    window.open(`/results/report-card/${printStudentId}/${printExamId}`, '_blank');
    setIsPrintOpen(false);
  };

  const columns = [
    { header: 'Exam Name', accessor: 'name' },
    { header: 'Class', render: (_: any, row: ExamRow) => row.class ? `${row.class.name}-${row.class.section}` : 'N/A' },
    { 
      header: 'Type', 
      render: (_: any, row: ExamRow) => (
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
          {row.type}
        </span>
      ) 
    },
    { header: 'Start Date', accessor: 'startDate' },
    { header: 'End Date', accessor: 'endDate' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Examinations Registry</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Configure exams dates, subject details, and print grades.</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-sm"
          >
            <Printer size={15} />
            <span>Print Report Card</span>
          </button>
          
          <button 
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md shadow-primary-light"
          >
            <Plus size={15} />
            <span>Schedule Exam</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={exams || []}
        isLoading={isLoading}
        searchPlaceholder="Filter exams list..."
      />

      {/* MODAL: SCHEDULE EXAM */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Schedule Examination">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Exam Title</label>
            <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. Mid Term Exam" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Target Class</label>
              <select required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">Select Class</option>
                {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Exam Type</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={type} onChange={e => setType(e.target.value)}>
                <option value="unit">Unit Test</option>
                <option value="mid">Mid Term</option>
                <option value="final">Final Exam</option>
                <option value="mock">Mock Test</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Start Date</label>
              <input required type="date" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">End Date</label>
              <input required type="date" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={createExamMutation.isPending} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md">
              {createExamMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: PRINT REPORT CARD SELECTION */}
      <Modal isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} title="Print Student Report Card">
        <form onSubmit={handlePrintSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Student ID</label>
            <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. 1" value={printStudentId} onChange={e => setPrintStudentId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Exam ID</label>
            <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. 1" value={printExamId} onChange={e => setPrintExamId(e.target.value)} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2">
              <Printer size={14} />
              <span>Launch Print Window</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Exams;
