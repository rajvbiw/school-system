import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { FileText, Download } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface FeeInvoiceItem {
  structureId: number;
  feeType: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  payments: { paymentId: number; amountPaid: number; paymentDate: string; receiptNo: string }[];
}

export const StudentFee: React.FC = () => {
  const { user } = useAuth();

  // Fetch student profile first to get student.id
  const { data: profile } = useQuery({
    queryKey: ['studentProfileFeeId'],
    queryFn: async () => {
      const response = await axios.get('/api/students', { params: { search: user?.email } });
      return response.data.students[0];
    },
    enabled: !!user
  });

  // Fetch student fees
  const { data: invoices, isLoading } = useQuery<FeeInvoiceItem[]>({
    queryKey: ['studentFeesInvoices', profile?.id],
    queryFn: async () => {
      const response = await axios.get(`/api/fees/student/${profile.id}`);
      return response.data;
    },
    enabled: !!profile?.id
  });

  const columns = [
    { header: 'Fee Category', accessor: 'feeType' },
    { header: 'Total Amount', render: (_: any, row: FeeInvoiceItem) => formatCurrency(row.totalAmount) },
    { header: 'Paid Amount', render: (_: any, row: FeeInvoiceItem) => formatCurrency(row.paidAmount) },
    { header: 'Remaining Balance', render: (_: any, row: FeeInvoiceItem) => formatCurrency(row.remainingAmount) },
    { header: 'Due Date', render: (_: any, row: FeeInvoiceItem) => formatDate(row.dueDate) },
    {
      header: 'Status',
      render: (_: any, row: FeeInvoiceItem) => (
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
          row.status === 'paid'
            ? 'bg-emerald-50 text-emerald-600'
            : row.status === 'partial'
            ? 'bg-amber-50 text-amber-600'
            : 'bg-red-50 text-red-500'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Fee Statements</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Review your school invoicing dues and transaction history.</p>
      </div>

      <DataTable
        columns={columns}
        data={invoices || []}
        isLoading={isLoading}
      />
    </div>
  );
};
export default StudentFee;
