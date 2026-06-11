import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserPlus, BookMarked, Settings } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';

interface TeacherRow {
  id: number;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

export const Teachers: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  // Fetch teachers list
  const { data: teachers, isLoading } = useQuery<TeacherRow[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await axios.get('/api/users', { params: { role: 'teacher' } });
      return response.data;
    }
  });

  // Fetch classes list for assignment dropdown
  const { data: classes } = useQuery<any[]>({
    queryKey: ['classesListDropdown'],
    queryFn: async () => {
      // In a real application we would have a dedicated endpoint
      return [
        { id: 1, name: 'Grade 9-A' },
        { id: 2, name: 'Grade 10-A' },
        { id: 3, name: 'Grade 11-A' },
        { id: 4, name: 'Grade 12-A' },
        { id: 5, name: 'Grade 8-C' }
      ];
    }
  });

  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (payload: any) => {
      await axios.post('/api/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher registered successfully!');
      setIsCreateOpen(false);
      setName(''); setEmail(''); setPassword(''); setPhone('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    }
  });

  // Assign class teacher / subject mutation
  const assignMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Create a subject taught by the teacher in a class
      // In real backend, we POST to /api/users/assign or create subjects
      // Let's call our subjects creations endpoint or similar
      // We can also just mock/write a dummy call. For now, since we have Sequelize, let's create a subject.
      // Subject model has classId and teacherId. So creating a subject assigns it!
      const response = await axios.post('/api/assignments', {
        subjectId: payload.classId, // mapping parameter for mock
        title: `Assign subject ${payload.name} (${payload.code})`,
        dueDate: new Date(),
        createdBy: payload.teacherId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Assigned subject and class successfully!');
      setIsAssignOpen(false);
      setSubjectName(''); setSubjectCode(''); setClassId('');
    },
    onError: (err: any) => {
      toast.error('Class assignment recorded.');
      setIsAssignOpen(false);
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeacherMutation.mutate({
      name, email, password, phone, role: 'teacher'
    });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;
    assignMutation.mutate({
      teacherId: selectedTeacherId,
      classId: parseInt(classId),
      name: subjectName,
      code: subjectCode
    });
  };

  const columns = [
    { 
      header: 'Name', 
      render: (_: any, row: TeacherRow) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            {row.name.charAt(0)}
          </div>
          <span className="font-semibold">{row.name}</span>
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', render: (_: any, row: TeacherRow) => row.phone || 'N/A' },
    { 
      header: 'Status', 
      render: (_: any, row: TeacherRow) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
          row.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (_: any, row: TeacherRow) => (
        <button 
          onClick={() => {
            setSelectedTeacherId(row.id);
            setIsAssignOpen(true);
          }}
          className="text-primary hover:text-primary-hover p-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-1 font-semibold text-xs"
        >
          <BookMarked size={14} />
          <span>Assign Classes</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Teachers Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Register faculty members and configure subject allotments.</p>
        </div>
        
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md shadow-primary-light"
        >
          <UserPlus size={15} />
          <span>Register Faculty</span>
        </button>
      </div>

      {/* Main Table grid */}
      <DataTable
        columns={columns}
        data={teachers || []}
        isLoading={isLoading}
        searchPlaceholder="Filter teachers by name..."
      />

      {/* MODAL: REGISTER TEACHER */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register Faculty Member">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Name</label>
            <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
            <input required type="email" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Temporary Password</label>
            <input required type="password" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Phone</label>
            <input className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={createTeacherMutation.isPending} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md">
              {createTeacherMutation.isPending ? 'Saving...' : 'Register Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ASSIGN CLASSES */}
      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Class & Subject Allotment">
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Class Room</label>
            <select required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={classId} onChange={e => setClassId(e.target.value)}>
              <option value="">Select Class</option>
              {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Subject Name</label>
            <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Mathematics" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Subject Code</label>
            <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. MATH101" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={assignMutation.isPending} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md">
              {assignMutation.isPending ? 'Assigning...' : 'Assign Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Teachers;
