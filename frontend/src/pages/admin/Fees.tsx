import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, CreditCard, Users, ShieldAlert, FileText } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface FeeStructureRow {
  id: number;
  feeType: string;
  amount: string;
  dueDate: string;
  class: { name: string; section: string };
  academicYear: string;
}

interface FeePaymentRow {
  id: number;
  amountPaid: string;
  paymentDate: string;
  method: string;
  receiptNo: string;
  student: { user: { name: string } };
  feeStructure: { feeType: string };
}

interface DefaulterRow {
  studentId: number;
  name: string;
  admissionNo: string;
  class: string;
  balance: number;
}

export const Fees: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'structures' | 'history' | 'defaulters'>('structures');
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Form: Structure
  const [classId, setClassId] = useState('');
  const [feeType, setFeeType] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Form: Payment
  const [paymentStudentId, setPaymentStudentId] = useState('');
  const [paymentStructureId, setPaymentStructureId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [method, setMethod] = useState<'cash' | 'online' | 'cheque'>('cash');
  const [transactionId, setTransactionId] = useState('');

  // Fetch structures
  const { data: structures, isLoading: isStrLoading } = useQuery<FeeStructureRow[]>({
    queryKey: ['feeStructures'],
    queryFn: async () => {
      const response = await axios.get('/api/fees/structure');
      return response.data;
    }
  });

  // Fetch payments
  const { data: payments, isLoading: isPayLoading } = useQuery<FeePaymentRow[]>({
    queryKey: ['feePayments'],
    queryFn: async () => {
      const response = await axios.get('/api/fees/payments');
      return response.data;
    }
  });

  // Fetch defaulters
  const { data: defaulters, isLoading: isDefLoading } = useQuery<DefaulterRow[]>({
    queryKey: ['feeDefaulters'],
    queryFn: async () => {
      const response = await axios.get('/api/fees/defaulters');
      return response.data;
    }
  });

  // Create structure mutation
  const createStructureMutation = useMutation({
    mutationFn: async (payload: any) => {
      await axios.post('/api/fees/structure', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast.success('Fee structure created!');
      setIsStructureOpen(false);
      setFeeType(''); setAmount(''); setDueDate('');
    },
    onError: (err: any) => {
      toast.error('Failed to create structure');
    }
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      await axios.post('/api/fees/payments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feePayments'] });
      queryClient.invalidateQueries({ queryKey: ['feeDefaulters'] });
      toast.success('Payment recorded successfully!');
      setIsPaymentOpen(false);
      setPaymentStudentId(''); setPaymentStructureId(''); setAmountPaid(''); setTransactionId('');
    },
    onError: (err: any) => {
      toast.error('Failed to save payment record');
    }
  });

  const handleStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStructureMutation.mutate({
      classId: parseInt(classId),
      feeType,
      amount: parseFloat(amount),
      dueDate,
      academicYear
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPaymentMutation.mutate({
      studentId: parseInt(paymentStudentId),
      feeStructureId: parseInt(paymentStructureId),
      amountPaid: parseFloat(amountPaid),
      method,
      transactionId: transactionId || undefined
    });
  };

  const structureColumns = [
    { header: 'Fee Type', accessor: 'feeType' },
    { header: 'Class', render: (_: any, row: FeeStructureRow) => row.class ? `${row.class.name}-${row.class.section}` : 'N/A' },
    { header: 'Amount', render: (_: any, row: FeeStructureRow) => formatCurrency(row.amount) },
    { header: 'Due Date', render: (_: any, row: FeeStructureRow) => formatDate(row.dueDate) },
    { header: 'Academic Year', accessor: 'academicYear' }
  ];

  const paymentColumns = [
    { header: 'Receipt No', accessor: 'receiptNo' },
    { header: 'Student Name', render: (_: any, row: FeePaymentRow) => row.student?.user?.name || 'N/A' },
    { header: 'Fee Category', render: (_: any, row: FeePaymentRow) => row.feeStructure?.feeType || 'N/A' },
    { header: 'Amount Paid', render: (_: any, row: FeePaymentRow) => formatCurrency(row.amountPaid) },
    { header: 'Date', render: (_: any, row: FeePaymentRow) => formatDate(row.paymentDate) },
    { 
      header: 'Method', 
      render: (_: any, row: FeePaymentRow) => (
        <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">
          {row.method}
        </span>
      ) 
    }
  ];

  const defaulterColumns = [
    { header: 'Student Name', accessor: 'name' },
    { header: 'Adm No', accessor: 'admissionNo' },
    { header: 'Class', accessor: 'class' },
    { 
      header: 'Overdue Balance', 
      render: (_: any, row: DefaulterRow) => (
        <span className="text-red-500 font-bold font-sans">
          {formatCurrency(row.balance)}
        </span>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Fee Administration</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Invoices billing configuration, payments entries, and audit reports.</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsPaymentOpen(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-sm"
          >
            <CreditCard size={15} />
            <span>Record Payment</span>
          </button>
          
          <button 
            onClick={() => setIsStructureOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md shadow-primary-light"
          >
            <Plus size={15} />
            <span>Setup Fee</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-bold">
        <button 
          onClick={() => setActiveTab('structures')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'structures' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Fee Structures
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Payment Ledger
        </button>
        <button 
          onClick={() => setActiveTab('defaulters')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'defaulters' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Defaulters List</span>
          {defaulters && defaulters.length > 0 && (
            <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-extrabold">
              {defaulters.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Data */}
      {activeTab === 'structures' && (
        <DataTable
          columns={structureColumns}
          data={structures || []}
          isLoading={isStrLoading}
          searchPlaceholder="Search structures..."
        />
      )}

      {activeTab === 'history' && (
        <DataTable
          columns={paymentColumns}
          data={payments || []}
          isLoading={isPayLoading}
          searchPlaceholder="Search receipts..."
        />
      )}

      {activeTab === 'defaulters' && (
        <DataTable
          columns={defaulterColumns}
          data={defaulters || []}
          isLoading={isDefLoading}
          searchPlaceholder="Search defaulters by name..."
        />
      )}

      {/* MODAL: SETUP FEE */}
      <Modal isOpen={isStructureOpen} onClose={() => setIsStructureOpen(false)} title="Setup Class Fee Category">
        <form onSubmit={handleStructureSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Target Class</label>
              <select required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">Select Class</option>
                {structures?.map(s => <option key={s.id} value={s.id}>{s.class ? `${s.class.name}-${s.class.section}` : `Class ${s.id}`}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Fee Title</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. Lab Fee" value={feeType} onChange={e => setFeeType(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Amount Due ($)</label>
              <input required type="number" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. 150" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Due Date</label>
              <input required type="date" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md">
              Create Structure
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECORD FEE PAYMENT */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Record Fee Payment Receipt">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Student ID</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. 1" value={paymentStudentId} onChange={e => setPaymentStudentId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Structure ID</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. 1" value={paymentStructureId} onChange={e => setPaymentStructureId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Amount Paid ($)</label>
              <input required type="number" className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" placeholder="e.g. 1500" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Method</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={method} onChange={e => setMethod(e.target.value as any)}>
                <option value="cash">Cash</option>
                <option value="online">Online Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Transaction ID / Cheque No (optional)</label>
            <input className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm bg-white dark:bg-slate-800" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md">
              Save Payment Ledger
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Fees;
