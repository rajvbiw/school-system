import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, Palette, Settings as SettingsIcon } from 'lucide-react';
import useTenant from '../../hooks/useTenant';
import { uploadProfilePhotoApi } from '../../services/upload';

export const Settings: React.FC = () => {
  const { tenantInfo, setTenantSlug } = useTenant();
  const [name, setName] = useState(tenantInfo?.name || 'Springfield Academy');
  const [primaryColor, setPrimaryColor] = useState(tenantInfo?.primaryColor || '#3B82F6');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setIsUploading(true);

    try {
      const response = await uploadProfilePhotoApi(file);
      toast.success('Logo uploaded successfully!');
      // Update local storage/settings simulation
      if (tenantInfo) {
        tenantInfo.logoUrl = response.fileUrl;
      }
    } catch (err) {
      toast.error('Failed to upload logo to storage');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenantInfo) {
      tenantInfo.name = name;
      tenantInfo.primaryColor = primaryColor;
      
      // Update variables trigger
      const root = document.documentElement;
      root.style.setProperty('--primary-color', primaryColor);
      root.style.setProperty('--primary-light', `${primaryColor}15`);
      root.style.setProperty('--primary-hover', `${primaryColor}cc`);

      toast.success('School branding configurations saved!');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">School Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Configure school branding details, calendars, and systems configurations.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Logo Upload Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">School Emblem Logo</label>
            <div className="flex items-center space-x-6">
              {tenantInfo?.logoUrl ? (
                <img 
                  src={tenantInfo.logoUrl} 
                  alt="School Logo" 
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center rounded-xl text-slate-400 font-bold text-lg">
                  Logo
                </div>
              )}
              
              <label className="cursor-pointer px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2 transition-colors">
                <Upload size={14} />
                <span>{isUploading ? 'Uploading...' : 'Upload Logo'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
              </label>
            </div>
          </div>

          {/* School Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Institution Name</label>
            <input 
              required
              className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Primary Color Picker */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Branding Color</label>
              <div className="flex space-x-3 items-center">
                <input 
                  type="color" 
                  className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer bg-transparent"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">{primaryColor}</span>
              </div>
            </div>

            {/* Academic Year */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Active Academic Year</label>
              <select 
                className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all"
            >
              <SettingsIcon size={14} />
              <span>Save Configurations</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Settings;
