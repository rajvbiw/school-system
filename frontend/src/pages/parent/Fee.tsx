import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CreditCard, ShieldCheck } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface FeeInvoiceItem {
  structureId: number;
  feeType: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
}

export const ParentFee: React.FC = () => {
  const queryClient = useQueryClient();
  const [childIndex, setChildIndex] = useState(0);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoiceItem | null>(null);

  // Form Stripe details
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Fetch parent children
  const { data: children, isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ['parentChildrenFee'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/parent');
      return response.data.children;
    }
  });

  const activeChild = children?.[childIndex];

  // Fetch invoices for selected child
  const { data: invoices, isLoading: invoicesLoading } = useQuery<FeeInvoiceItem[]>({
    queryKey: ['parentChildFees', activeChild?.studentId],
    queryFn: async () => {
      const response = await axios.get(`/api/fees/student/${activeChild.studentId}`);
      return response.data;
    },
    enabled: !!activeChild?.studentId
  });

  const payMutation = useMutation({
    mutationFn: async (payload: { studentId: number; feeStructureId: number; amountPaid: number; method: string; transactionId: string }) => {
      const response = await axios.post('/api/fees/payments', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parentChildFees'] });
      queryClient.invalidateQueries({ queryKey: ['parentDashboard'] });
      toast.success('Payment processed successfully via Stripe (Mock)!');
      setIsPayOpen(false);
      setCardNumber(''); setExpiry(''); setCvv('');
    },
    onError: () => {
      toast.error('Stripe mock payment failed');
    }
  });

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild || !selectedInvoice) return;

    payMutation.mutate({
      studentId: activeChild.studentId,
      feeStructureId: selectedInvoice.structureId,
      amountPaid: selectedInvoice.remainingAmount,
      method: 'online',
      transactionId: `STRIPE-CHG-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });
  };

  const columns = [
    { header: 'Fee Category', accessor: 'feeType' },
    { header: 'Total Due', render: (_: any, row: FeeInvoiceItem) => formatCurrency(row.totalAmount) },
    { header: 'Paid', render: (_: any, row: FeeInvoiceItem) => formatCurrency(row.paidAmount) },
    { header: 'Remaining Balance', render: (_: any, row: FeeInvoiceItem) => formatCurrency(row.remainingAmount) },
    { header: 'Due Date', render: (_: any, row: FeeInvoiceItem) => formatDate(row.dueDate) },
    {
      header: 'Actions',
      render: (_: any, row: FeeInvoiceItem) => (
        row.status !== 'paid' ? (
          <button 
            onClick={() => {
              setSelectedInvoice(row);
              setIsPayOpen(true);
            }}
            className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase rounded-lg shadow-sm transition-all flex items-center space-x-1"
          >
            <CreditCard size={11} />
            <span>Pay Dues</span>
          </button>
        ) : (
          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Settled</span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Fee Statements</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Review and settle school invoices via secure Stripe checkout.</p>
        </div>

        {children && children.length > 1 && (
          <select 
            className="text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 cursor-pointer shadow-sm"
            value={childIndex} 
            onChange={e => setChildIndex(parseInt(e.target.value))}
          >
            {children.map((c: any, idx: number) => <option key={c.studentId} value={idx}>{c.name}</option>)}
          </select>
        )}
      </div>

      <DataTable
        columns={columns}
        data={invoices || []}
        isLoading={invoicesLoading || childrenLoading}
      />

      {/* STRIPE CHECKOUT MODAL */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title="Checkout via Stripe">
        {selectedInvoice && (
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">{selectedInvoice.feeType}</span>
              <span className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(selectedInvoice.remainingAmount)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400">Cardholder Name</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs bg-white dark:bg-slate-800" placeholder="John Doe" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400">Credit Card Number</label>
              <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs bg-white dark:bg-slate-800" placeholder="4242 4242 4242 4242" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">Expiration Date</label>
                <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs bg-white dark:bg-slate-800" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">Security CVV</label>
                <input required className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs bg-white dark:bg-slate-800" placeholder="123" value={cvv} onChange={e => setCvv(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] text-emerald-600 font-bold uppercase py-2">
              <ShieldCheck size={14} />
              <span>Secure Encrypted Connection</span>
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3">
              <button 
                type="submit" 
                disabled={payMutation.isPending}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2"
              >
                <span>{payMutation.isPending ? 'Processing...' : `Settle Dues`}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default ParentFee;
