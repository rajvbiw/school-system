import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, HelpCircle, School } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useTenant from '../../hooks/useTenant';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { tenantSlug, tenantInfo, setTenantSlug, clearTenant } = useTenant();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'superadmin') navigate('/superadmin/tenants');
      else navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      // If tenant slug is not in URL, set it from local input
      if (!tenantSlug && slugInput) {
        setTenantSlug(slugInput);
      }

      await login(email, password);
      toast.success('Logged in successfully!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Verify credentials.');
      toast.error('Invalid credentials');
    }
  };

  const fillDemo = (demoEmail: string, demoSlug: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSlugInput(demoSlug);
    setTenantSlug(demoSlug);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-3">
          {tenantInfo?.logoUrl ? (
            <img src={tenantInfo.logoUrl} alt="Logo" className="w-16 h-16 object-cover rounded-2xl mx-auto border shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-2xl mx-auto shadow-md">
              <School size={30} />
            </div>
          )}
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white font-sans uppercase">
              {tenantInfo?.name || 'School ERP'}
            </h2>
            <p className="text-slate-400 text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5">
              <span>{tenantSlug ? `Portal Authentication - ${tenantSlug}` : 'Multi-Tenant Portal Login'}</span>
              {tenantSlug && (
                <button 
                  type="button" 
                  onClick={clearTenant} 
                  className="text-primary hover:underline font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  (Change)
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Message */}
            {errorMsg && (
              <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100/50">{errorMsg}</p>
            )}

            {/* Tenant input (only if not resolved via subdomain) */}
            {!tenantSlug && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">School ID Slug</label>
                <input 
                  required 
                  className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs bg-white dark:bg-slate-800" 
                  placeholder="e.g. school-a"
                  value={slugInput}
                  onChange={e => setSlugInput(e.target.value)}
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <input 
                required 
                type="email"
                className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs bg-white dark:bg-slate-800" 
                placeholder="e.g. admin@school-a.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
              <input 
                required 
                type="password"
                className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs bg-white dark:bg-slate-800" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary-light flex items-center justify-center space-x-2 transition-all"
            >
              <LogIn size={15} />
              <span>Log In</span>
            </button>
          </form>

          {/* Reviewer Helper Drawer */}
          <div className="border-t border-slate-50 dark:border-slate-800 pt-4 text-center">
            <button 
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 flex items-center justify-center space-x-1 mx-auto transition-colors"
            >
              <HelpCircle size={13} />
              <span>{showDemoCredentials ? 'Hide credentials' : 'View demo logins'}</span>
            </button>
            
            {showDemoCredentials && (
              <div className="mt-3 text-[10px] leading-relaxed text-left max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 bg-slate-50/50 p-3 rounded-xl space-y-2.5 scrollbar-thin dark:text-slate-400">
                <div>
                  <p className="font-extrabold border-b pb-0.5 border-slate-200">School ERP Portal (school-erp)</p>
                  <button onClick={() => fillDemo('admin@school-erp.com', 'school-erp')} className="text-primary block font-semibold hover:underline">Admin: admin@school-erp.com</button>
                  <button onClick={() => fillDemo('teacher1@school-erp.com', 'school-erp')} className="text-primary block font-semibold hover:underline">Teacher: teacher1@school-erp.com</button>
                </div>
                <div>
                  <p className="font-extrabold border-b pb-0.5 border-slate-200">Springfield Academy (school-a)</p>
                  <button onClick={() => fillDemo('admin@school-a.com', 'school-a')} className="text-primary block font-semibold hover:underline">Admin: admin@school-a.com</button>
                  <button onClick={() => fillDemo('teacher1@school-a.com', 'school-a')} className="text-primary block font-semibold hover:underline">Teacher: teacher1@school-a.com</button>
                  <button onClick={() => fillDemo('student1@school-a.com', 'school-a')} className="text-primary block font-semibold hover:underline">Student: student1@school-a.com</button>
                  <button onClick={() => fillDemo('parent1@school-a.com', 'school-a')} className="text-primary block font-semibold hover:underline">Parent: parent1@school-a.com</button>
                </div>
                <div>
                  <p className="font-extrabold border-b pb-0.5 border-slate-200">Greenwood Institute (school-b)</p>
                  <button onClick={() => fillDemo('admin@school-b.com', 'school-b')} className="text-primary block font-semibold hover:underline">Admin: admin@school-b.com</button>
                  <button onClick={() => fillDemo('teacher1@school-b.com', 'school-b')} className="text-primary block font-semibold hover:underline">Teacher: teacher1@school-b.com</button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
export default Login;
