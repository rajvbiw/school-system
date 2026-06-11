import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, LogOut, User as UserIcon, Check } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Handle incoming real-time socket events
  useSocket((event, data) => {
    if (event === 'new_notification') {
      setNotifications(prev => [data, ...prev]);
    }
  });

  // Toggle Dark Mode
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Close menus on outside click
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 fixed top-0 right-0 left-64 z-20 px-8 flex justify-end items-center space-x-6">
      {/* Dark Mode Toggle */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Notifications bell */}
      <div className="relative" ref={notifRef}>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl relative transition-all"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-2xl py-2 z-50 animate-slide-up">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <span className="font-bold text-sm text-slate-700 dark:text-white">Alerts</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 scrollbar-thin">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 text-xs transition-colors flex justify-between items-start space-x-2 ${
                      notif.isRead ? 'opacity-60' : 'bg-slate-50/30 dark:bg-slate-700/10'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{notif.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-primary hover:text-primary-hover p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 font-medium text-xs">
                  No alerts found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User profile dropdown */}
      <div className="relative" ref={profileRef}>
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-2xl transition-all"
        >
          {user?.profilePhoto ? (
            <img 
              src={user.profilePhoto} 
              alt="Avatar" 
              className="w-9 h-9 object-cover rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center rounded-xl font-bold">
              {user?.name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col text-left hidden md:flex">
            <span className="font-bold text-sm text-slate-700 dark:text-white leading-tight">
              {user?.name}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              {user?.role}
            </span>
          </div>
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-2xl py-2 z-50 animate-slide-up">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex flex-col space-y-1 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="font-bold text-sm text-slate-700 dark:text-white truncate">{user?.name}</span>
              <span className="text-xs text-slate-400 truncate">{user?.email}</span>
            </div>
            
            <button 
              onClick={logout}
              className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-sm font-semibold flex items-center space-x-3.5 transition-colors"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
