import api from './api';

export const getExamsApi = async (classId?: string) => {
  const response = await api.get('/api/exams', { params: { class_id: classId } });
  return response.data;
};

export const createExamApi = async (payload: {
  name: string;
  classId: number;
  startDate: string;
  endDate: string;
  type: 'unit' | 'mid' | 'final' | 'mock';
  subjects: { subjectId: number; examDate: string; maxMarks: number; passMarks: number; durationMins: number }[];
}) => {
  const response = await api.post('/api/exams', payload);
  return response.data;
};

export const getResultsApi = async (examId: string, classId?: string) => {
  const response = await api.get('/api/results', { params: { exam_id: examId, class_id: classId } });
  return response.data;
};

export const bulkUploadResultsApi = async (payload: {
  examId: number;
  subjectId: number;
  marksList: { studentId: number; marksObtained: number; remarks?: string }[];
}) => {
  const response = await api.post('/api/results/bulk', payload);
  return response.data;
};

export const getStudentResultsApi = async (studentId: string) => {
  const response = await api.get(`/api/results/student/${studentId}`);
  return response.data;
};

export const getReportCardApi = async (studentId: string, examId: string) => {
  const response = await api.get(`/api/results/report-card/${studentId}/${examId}`);
  return response.data;
};

export const getTimetableApi = async (classId: string) => {
  const response = await api.get('/api/timetable', { params: { class_id: classId } });
  return response.data;
};

export const createAssignmentApi = async (payload: {
  subjectId: number;
  title: string;
  description?: string;
  dueDate: string;
  fileUrl?: string;
}) => {
  const response = await api.post('/api/assignments', payload);
  return response.data;
};

export const getAssignmentsApi = async (subjectId?: string) => {
  const response = await api.get('/api/assignments', { params: { subject_id: subjectId } });
  return response.data;
};

export const submitAssignmentApi = async (payload: {
  assignmentId: number;
  fileUrl: string;
}) => {
  const response = await api.post('/api/submissions', payload);
  return response.data;
};
