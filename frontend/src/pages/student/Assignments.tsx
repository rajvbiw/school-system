import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ClipboardList, UploadCloud, CheckCircle } from 'lucide-react';
import { CardSkeleton } from '../../components/shared/Skeleton';
import { uploadAssignmentApi } from '../../services/upload';
import { formatDate } from '../../utils/formatters';

interface AssignmentItem {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  fileUrl?: string;
  subject: { name: string };
  submissions: { id: number; studentId: number; submittedAt: string; marks?: number; feedback?: string }[];
}

export const StudentAssignments: React.FC = () => {
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  // Fetch assignments list
  const { data: assignments, isLoading } = useQuery<AssignmentItem[]>({
    queryKey: ['studentAssignmentsList'],
    queryFn: async () => {
      const response = await axios.get('/api/assignments');
      return response.data;
    }
  });

  // Submit homework file mutation
  const submitHomeworkMutation = useMutation({
    mutationFn: async (payload: { assignmentId: number; fileUrl: string }) => {
      const response = await axios.post('/api/submissions', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentAssignmentsList'] });
      toast.success('Homework assignment submitted successfully!');
    },
    onError: () => {
      toast.error('Failed to submit assignment');
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, assignmentId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(assignmentId);
    try {
      const response = await uploadAssignmentApi(file);
      // Send submission to DB
      submitHomeworkMutation.mutate({
        assignmentId,
        fileUrl: response.fileUrl
      });
    } catch (err) {
      toast.error('File upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">My Homework</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Upload assignment files and check teacher marks reviews.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments && assignments.length > 0 ? (
          assignments.map(task => {
            const hasSubmitted = task.submissions && task.submissions.length > 0;
            const submission = hasSubmitted ? task.submissions[0] : null;

            return (
              <div key={task.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-base text-slate-800 dark:text-white font-sans">{task.title}</h3>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{task.subject.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                      hasSubmitted ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {hasSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{task.description || 'No instructions provided.'}</p>
                </div>

                <div className="border-t border-slate-50 dark:border-slate-700 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Due {formatDate(task.dueDate)}</span>
                  
                  {hasSubmitted ? (
                    <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs">
                      <CheckCircle size={15} />
                      <span>{submission?.marks ? `Marks: ${submission.marks}/100` : 'Grading pending'}</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer px-4.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all w-fit">
                      <UploadCloud size={14} />
                      <span>{uploadingId === task.id ? 'Uploading...' : 'Submit File'}</span>
                      <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={e => handleFileUpload(e, task.id)} disabled={uploadingId === task.id} />
                    </label>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-400 text-sm py-4">No assignments due.</p>
        )}
      </div>
    </div>
  );
};
export default StudentAssignments;
