import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close drawer on path transition
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <div className="lg:hidden">
      {/* Mobile Top Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 fixed top-0 left-0 right-0 z-40 px-6 flex justify-between items-center text-white">
        <span className="font-extrabold tracking-tight text-lg">School ERP</span>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Slide-out Overlay Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-30 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Sidebar Container */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 animate-fade-in shadow-xl">
            {/* Direct mount of Sidebar inside drawer */}
            <div className="h-full sidebar-mobile-override">
              <Sidebar />
            </div>
            
            {/* Custom css override for sidebar positioning in mobile drawer */}
            <style>{`
              .sidebar-mobile-override aside {
                left: 0 !important;
                top: 0 !important;
                position: relative !important;
                box-shadow: none !important;
                border-right: none !important;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};
export default MobileNav;
