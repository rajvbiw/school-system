import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserSquare2, BookOpen, Calendar, 
  GraduationCap, CreditCard, Megaphone, Settings, CheckSquare, 
  BookMarked, ClipboardList, MessageSquare, ShieldAlert, Sparkles
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useTenant from '../../hooks/useTenant';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { tenantInfo } = useTenant();

  if (!user) return null;

  // Define menu lists per role
  const menuConfig: Record<string, MenuItem[]> = {
    admin: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Students', path: '/admin/students', icon: Users },
      { label: 'Teachers', path: '/admin/teachers', icon: UserSquare2 },
      { label: 'Classes', path: '/admin/classes', icon: BookOpen },
      { label: 'Timetable', path: '/admin/timetable', icon: Calendar },
      { label: 'Exams', path: '/admin/exams', icon: GraduationCap },
      { label: 'Fee Management', path: '/admin/fees', icon: CreditCard },
      { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
      { label: 'AI Performance', path: '/admin/ai-insights', icon: Sparkles },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
    teacher: [
      { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
      { label: 'Attendance', path: '/teacher/attendance', icon: CheckSquare },
      { label: 'My Classes', path: '/teacher/classes', icon: BookMarked },
      { label: 'Assignments', path: '/teacher/assignments', icon: ClipboardList },
      { label: 'Results', path: '/teacher/results', icon: GraduationCap },
      { label: 'AI Performance', path: '/admin/ai-insights', icon: Sparkles },
      { label: 'Messages', path: '/teacher/messages', icon: MessageSquare },
    ],
    student: [
      { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { label: 'Attendance', path: '/student/attendance', icon: CheckSquare },
      { label: 'Results', path: '/student/results', icon: GraduationCap },
      { label: 'Assignments', path: '/student/assignments', icon: ClipboardList },
      { label: 'Fee Invoices', path: '/student/fee', icon: CreditCard },
      { label: 'Timetable', path: '/student/timetable', icon: Calendar },
      { label: 'Messages', path: '/student/messages', icon: MessageSquare },
    ],
    parent: [
      { label: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
      { label: 'Attendance', path: '/parent/attendance', icon: CheckSquare },
      { label: 'Fee Statements', path: '/parent/fee', icon: CreditCard },
      { label: 'Report Cards', path: '/parent/results', icon: GraduationCap },
      { label: 'Messages', path: '/parent/messages', icon: MessageSquare },
    ],
    superadmin: [
      { label: 'School Tenants', path: '/superadmin/tenants', icon: Settings },
    ]
  };

  const menuItems = menuConfig[user.role] || [];

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-lg border-r border-slate-800">
      {/* Branding */}
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800 bg-slate-950/20">
        {tenantInfo?.logoUrl ? (
          <img 
            src={tenantInfo.logoUrl} 
            alt="School Logo" 
            className="w-10 h-10 object-cover rounded-xl border border-slate-700 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 bg-primary/20 text-primary flex items-center justify-center rounded-xl font-extrabold text-lg">
            S
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-white font-bold tracking-tight text-sm font-sans truncate w-40">
            {tenantInfo?.name || 'School System'}
          </span>
          <span className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
            {user.role} Portal
          </span>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 transform translate-x-1' 
                    : 'hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center text-xs text-slate-600 font-medium">
        School ERP v1.0.0
      </div>
    </aside>
  );
};
export default Sidebar;
