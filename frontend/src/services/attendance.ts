import api from './api';

export const getAttendanceApi = async (classId: string, date: string) => {
  const response = await api.get('/api/attendance', { params: { class_id: classId, date } });
  return response.data;
};

export const bulkMarkAttendanceApi = async (payload: {
  classId: number;
  date: string;
  records: { studentId: number; status: string }[];
  subjectId?: number;
}) => {
  const response = await api.post('/api/attendance/bulk', payload);
  return response.data;
};

export const getStudentAttendanceApi = async (studentId: string, month: number, year: number) => {
  const response = await api.get(`/api/attendance/student/${studentId}`, { params: { month, year } });
  return response.data;
};

export const getAttendanceSummaryApi = async (classId: string, month: number, year: number) => {
  const response = await api.get('/api/attendance/summary', { params: { class_id: classId, month, year } });
  return response.data;
};
