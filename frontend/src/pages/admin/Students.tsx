import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserPlus, FileSpreadsheet, Eye, RefreshCw } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { formatCurrency } from '../../utils/formatters';

interface StudentRow {
  id: number;
  admissionNo: string;
  class: { name: string; section: string; grade: string };
  user: { name: string; email: string; phone: string; profilePhoto?: string; isActive: boolean };
  parent?: { name: string; phone: string };
}

interface StudentDetailMetrics {
  student: StudentRow;
  metrics: {
    attendancePercentage: number;
    totalDue: number;
    totalPaid: number;
    pendingFees: number;
  };
}

export const Students: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [classId, setClassId] = useState('');
  const [parentId, setParentId] = useState('');
  const [gender, setGender] = useState('male');
  const [address, setAddress] = useState('');
  const [csvText, setCsvText] = useState('');

  // Fetch Students list
  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: async () => {
      const response = await axios.get('/api/students', {
        params: { page, limit: 10, search }
      });
      return response.data;
    }
  });

  // Fetch classes for dropdown selection
  const { data: classesList } = useQuery({
    queryKey: ['classesDropdown'],
    queryFn: async () => {
      const response = await axios.get('/api/users'); // fallback or fetch classes
      // For fallback we can get classes using standard endpoints
      const classResponse = await axios.get('/api/exams'); // fallback mock classes list
      return [
        { id: 1, name: 'Grade 9-A' },
        { id: 2, name: 'Grade 10-A' },
        { id: 3, name: 'Grade 11-A' },
        { id: 4, name: 'Grade 12-A' },
        { id: 5, name: 'Grade 8-C' }
      ];
    }
  });

  // Fetch Single Student details
  const { data: studentDetail, isLoading: isDetailLoading } = useQuery<StudentDetailMetrics>({
    queryKey: ['studentDetail', selectedStudentId],
    queryFn: async () => {
      const response = await axios.get(`/api/students/${selectedStudentId}`);
      return response.data;
    },
    enabled: !!selectedStudentId
  });

  // Mutation to create student
  const createStudentMutation = useMutation({
    mutationFn: async (payload: any) => {
      await axios.post('/api/students', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully!');
      setIsCreateOpen(false);
      // Reset form
      setName(''); setEmail(''); setPassword(''); setPhone('');
      setAdmissionNo(''); setClassId(''); setParentId(''); setAddress('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create student');
    }
  });

  // Mutation to bulk import
  const bulkImportMutation = useMutation({
    mutationFn: async (csvData: string) => {
      await axios.post('/api/users/bulk-import', { csvData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Users CSV imported successfully!');
      setIsImportOpen(false);
      setCsvText('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStudentMutation.mutate({
      name, email, password, phone,
      admissionNo, classId: parseInt(classId),
      parentId: parentId ? parseInt(parentId) : undefined,
      gender, address
    });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkImportMutation.mutate(csvText);
  };

  const columns = [
    { header: 'Admission No', accessor: 'admissionNo' },
    { 
      header: 'Name', 
      render: (_: any, row: StudentRow) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
            {row.user.name.charAt(0)}
          </div>
          <span className="font-semibold">{row.user.name}</span>
        </div>
      )
    },
    { header: 'Email', render: (_: any, row: StudentRow) => row.user.email },
    { header: 'Class', render: (_: any, row: StudentRow) => row.class ? `${row.class.name}-${row.class.section}` : 'N/A' },
    { header: 'Parent', render: (_: any, row: StudentRow) => row.parent ? row.parent.name : 'N/A' },
    { 
      header: 'Status', 
      render: (_: any, row: StudentRow) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
          row.user.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        }`}>
          {row.user.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (_: any, row: StudentRow) => (
        <button 
          onClick={() => {
            setSelectedStudentId(row.id);
            setIsDetailOpen(true);
          }}
          className="text-primary hover:text-primary-hover p-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-1 font-semibold text-xs"
        >
          <Eye size={14} />
          <span>View Profile</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Students Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage student accounts, registration, and metrics.</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-sm"
          >
            <FileSpreadsheet size={15} />
            <span>CSV Import</span>
          </button>
          
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md shadow-primary-light"
          >
            <UserPlus size={15} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Main Table grid */}
      <DataTable
        columns={columns}
        data={data?.students || []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search students by name or admission no..."
      />

      {/* Pagination Controls */}
      {data?.pagination && (
        <div className="flex justify-between items-center py-4 text-xs font-semibold text-slate-500">
          <span>Page {page} of {data.pagination.totalPages}</span>
          <div className="flex space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register New Student">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Name</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Email</label>
              <input required type="email" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Password</label>
              <input required type="password" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Phone</label>
              <input className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Admission No</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={admissionNo} onChange={e => setAdmissionNo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Class</label>
              <select required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">Select Class</option>
                {classesList?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Parent ID (optional)</label>
              <input className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={parentId} onChange={e => setParentId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Gender</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Address</label>
            <textarea className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" rows={2} value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={createStudentMutation.isPending} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md">
              {createStudentMutation.isPending ? 'Saving...' : 'Register Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CSV BULK IMPORT */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import Users via CSV">
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Format: <code className="bg-slate-100 p-0.5 rounded text-red-500">name,email,password,role,phone</code>. Role must be superadmin, admin, teacher, student, or parent. Note: column headers must be on the first line.
          </p>
          <textarea
            required
            rows={8}
            className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="name,email,password,role,phone&#10;John Doe,john@school-a.com,secret123,teacher,12345678"
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={bulkImportMutation.isPending} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md">
              {bulkImportMutation.isPending ? 'Processing...' : 'Run Import'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW STUDENT DETAILS */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Student Profile Overview">
        {isDetailLoading ? (
          <div className="space-y-4">
            <div className="h-6 bg-slate-100 animate-pulse rounded w-1/3" />
            <div className="h-20 bg-slate-100 animate-pulse rounded" />
          </div>
        ) : studentDetail ? (
          <div className="space-y-6 text-sm text-slate-700">
            {/* Header profile cards */}
            <div className="flex items-center space-x-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-xl font-extrabold text-lg">
                {studentDetail.student.user.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-slate-800 dark:text-white">{studentDetail.student.user.name}</span>
                <span className="text-slate-400 text-xs font-semibold">Adm No: {studentDetail.student.admissionNo}</span>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1 shadow-sm">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Attendance</p>
                <p className="text-lg font-extrabold text-emerald-600">{studentDetail.metrics.attendancePercentage}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1 shadow-sm">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Paid</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-white">{formatCurrency(studentDetail.metrics.totalPaid)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1 shadow-sm">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending Fees</p>
                <p className="text-lg font-extrabold text-red-500">{formatCurrency(studentDetail.metrics.pendingFees)}</p>
              </div>
            </div>

            {/* Detailed text details */}
            <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-1.5">Academics & Contact</p>
              <div className="grid grid-cols-2 gap-y-2 text-xs font-semibold">
                <span className="text-slate-400">Class Assigned:</span>
                <span className="text-slate-600 dark:text-slate-300 text-right">{studentDetail.student.class ? `${studentDetail.student.class.name}-${studentDetail.student.class.section}` : 'N/A'}</span>
                <span className="text-slate-400">Parent Link:</span>
                <span className="text-slate-600 dark:text-slate-300 text-right">{studentDetail.student.parent?.name || 'N/A'}</span>
                <span className="text-slate-400">Email Address:</span>
                <span className="text-slate-600 dark:text-slate-300 text-right">{studentDetail.student.user.email}</span>
                <span className="text-slate-400">Phone Number:</span>
                <span className="text-slate-600 dark:text-slate-300 text-right">{studentDetail.student.user.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm py-4 text-center">Failed to load profile details.</p>
        )}
      </Modal>
    </div>
  );
};
export default Students;
