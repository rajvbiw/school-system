import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Megaphone } from 'lucide-react';

export const Announcements: React.FC = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [classId, setClassId] = useState('');

  const createAnnouncementMutation = useMutation({
    mutationFn: async (payload: any) => {
      await axios.post('/api/announcements', payload);
    },
    onSuccess: () => {
      toast.success('Announcement broadcast successfully!');
      setTitle(''); setContent(''); setTargetRole('all'); setClassId('');
    },
    onError: (err: any) => {
      toast.error('Failed to broadcast announcement');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncementMutation.mutate({
      title,
      content,
      targetRole,
      classId: classId ? parseInt(classId) : undefined
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">Broadcast Announcements</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Compose notices to send instant push notifications and alerts.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Notice Title</label>
            <input 
              required 
              className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
              placeholder="e.g. Annual Sports Day Postponed"
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Target Audience Role</label>
              <select 
                className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer" 
                value={targetRole} 
                onChange={e => setTargetRole(e.target.value)}
              >
                <option value="all">Everyone</option>
                <option value="teacher">Teachers Only</option>
                <option value="student">Students Only</option>
                <option value="parent">Parents Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Class Scope (optional)</label>
              <input 
                className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
                placeholder="e.g. 1 (Class ID)" 
                value={classId} 
                onChange={e => setClassId(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Content / Message Body</label>
            <textarea 
              required 
              className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
              rows={5} 
              placeholder="Write notice detail..."
              value={content} 
              onChange={e => setContent(e.target.value)} 
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={createAnnouncementMutation.isPending} 
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all"
            >
              <Megaphone size={14} />
              <span>{createAnnouncementMutation.isPending ? 'Broadcasting...' : 'Broadcast Notice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Announcements;
