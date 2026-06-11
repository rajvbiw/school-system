import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 flex items-center justify-center rounded-2xl mx-auto shadow-sm">
          <ShieldAlert size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-white font-sans tracking-tight uppercase">Access Denied</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            You do not have authorization to view this panel. If this is a mistake, contact system support.
          </p>
        </div>

        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm transition-all flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};
export default Unauthorized;
