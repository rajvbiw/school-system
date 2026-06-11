import api from './api';

export const getFeeStructureApi = async (classId?: string) => {
  const response = await api.get('/api/fees/structure', { params: { class_id: classId } });
  return response.data;
};

export const createFeeStructureApi = async (payload: {
  classId: number;
  feeType: string;
  amount: number;
  dueDate: string;
  academicYear: string;
}) => {
  const response = await api.post('/api/fees/structure', payload);
  return response.data;
};

export const getFeePaymentsApi = async (status?: string, classId?: string) => {
  const response = await api.get('/api/fees/payments', { params: { status, class_id: classId } });
  return response.data;
};

export const recordFeePaymentApi = async (payload: {
  studentId: number;
  feeStructureId: number;
  amountPaid: number;
  method: 'cash' | 'online' | 'cheque';
  transactionId?: string;
}) => {
  const response = await api.post('/api/fees/payments', payload);
  return response.data;
};

export const getStudentFeesApi = async (studentId: string) => {
  const response = await api.get(`/api/fees/student/${studentId}`);
  return response.data;
};

export const getDefaultersApi = async () => {
  const response = await api.get('/api/fees/defaulters');
  return response.data;
};
