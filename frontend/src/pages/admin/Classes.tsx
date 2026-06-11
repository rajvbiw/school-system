import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, BookOpen } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';

interface ClassRow {
  id: number;
  name: string;
  section: string;
  grade: string;
  roomNo?: string;
  academicYear: string;
  classTeacher?: { name: string };
}

export const Classes: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [grade, setGrade] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Fetch classes
  const { data: classes, isLoading } = useQuery<ClassRow[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      // In a real application we query /api/classes or similar.
      // We will make a call to our backend. Since we set up sequelize, we'll fetch from /api/exams and fallback.
      const response = await axios.get('/api/users'); // fallback or mock data
      return [
        { id: 1, name: 'Grade 9', section: 'A', grade: 'Grade 9', roomNo: 'Room 101', academicYear: '2026-2027', classTeacher: { name: 'Walter White' } },
        { id: 2, name: 'Grade 10', section: 'A', grade: 'Grade 10', roomNo: 'Room 102', academicYear: '2026-2027', classTeacher: { name: 'Minerva McGonagall' } },
        { id: 3, name: 'Grade 11', section: 'A', grade: 'Grade 11', roomNo: 'Room 103', academicYear: '2026-2027', classTeacher: { name: 'Severus Snape' } },
        { id: 4, name: 'Grade 12', section: 'A', grade: 'Grade 12', roomNo: 'Room 104', academicYear: '2026-2027', classTeacher: { name: 'Albus Dumbledore' } },
        { id: 5, name: 'Grade 8', section: 'C', grade: 'Grade 8', roomNo: 'Room 105', academicYear: '2026-2027', classTeacher: { name: 'Charles Xavier' } }
      ];
    }
  });

  // Fetch teachers for selection dropdown
  const { data: teachers } = useQuery<any[]>({
    queryKey: ['teachersDropdown'],
    queryFn: async () => {
      const response = await axios.get('/api/users', { params: { role: 'teacher' } });
      return response.data;
    }
  });

  const createClassMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Create a class
      // For mock purposes
      return payload;
    },
    onSuccess: () => {
      toast.success('Class created successfully!');
      setIsOpen(false);
      setName(''); setSection(''); setGrade(''); setRoomNo(''); setClassTeacherId('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClassMutation.mutate({
      name, section, grade, roomNo, classTeacherId, academicYear
    });
  };

  const columns = [
    { header: 'Class Name', accessor: 'name' },
    { header: 'Section', accessor: 'section' },
    { header: 'Grade', accessor: 'grade' },
    { header: 'Room No', render: (_: any, row: ClassRow) => row.roomNo || 'N/A' },
    { header: 'Class Teacher', render: (_: any, row: ClassRow) => row.classTeacher ? row.classTeacher.name : 'Unassigned' },
    { header: 'Academic Year', accessor: 'academicYear' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Classes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Add classrooms, sections, and assign mentors.</p>
        </div>
        
        <button 
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md shadow-primary-light"
        >
          <Plus size={15} />
          <span>New Class</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={classes || []}
        isLoading={isLoading}
        searchPlaceholder="Filter classes..."
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Classroom">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Name</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. Grade 9" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Section</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. A" value={section} onChange={e => setSection(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Grade Level</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. Grade 9" value={grade} onChange={e => setGrade(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Room No</label>
              <input className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. Room 101" value={roomNo} onChange={e => setRoomNo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Class Mentor Teacher</label>
            <select className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)}>
              <option value="">Select Mentor</option>
              {teachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md">
              Create Class
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Classes;
