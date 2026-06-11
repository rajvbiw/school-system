import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface AttendanceRecord {
  studentId: number;
  name: string;
  admissionNo: string;
  status: 'present' | 'absent' | 'late' | 'holiday' | null;
  attendanceId: number | null;
}

export const useAttendance = (classId?: string, date?: string) => {
  const queryClient = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ['attendance', classId, date],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      const response = await axios.get('/api/attendance', {
        params: { class_id: classId, date }
      });
      return response.data;
    },
    enabled: !!classId && !!date,
  });

  const submitAttendanceMutation = useMutation({
    mutationFn: async (payload: {
      classId: number;
      date: string;
      records: { studentId: number; status: 'present' | 'absent' | 'late' | 'holiday' }[];
      subjectId?: number;
    }) => {
      const response = await axios.post('/api/attendance/bulk', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance recorded successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record attendance');
    }
  });

  return {
    attendanceQuery,
    submitAttendanceMutation,
  };
};
