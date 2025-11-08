import React from 'react';
import type { View } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SearchIcon } from './icons/SearchIcon';
import { MessageSquareIcon } from './icons/MessageSquareIcon';
import { PriceTagIcon } from './icons/PriceTagIcon';
import { ScaleIcon } from './icons/ScaleIcon';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'vendors', label: 'Vendor Management', icon: UsersIcon },
    { id: 'search', label: 'Vendor Search', icon: SearchIcon },
    { id: 'pricing', label: 'Pricing', icon: PriceTagIcon },
    { id: 'comparison', label: 'Vendor Comparison', icon: ScaleIcon },
    { id: 'chat', label: 'Chat Admin', icon: MessageSquareIcon },
  ];

  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsOpen(false); // Close sidebar on mobile after navigation
  };


  return (
    <>
      {/* Overlay for mobile */}
      <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsOpen(false)}
      ></div>
      
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-primary text-white flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 text-2xl font-bold border-b border-primary-focus flex justify-between items-center">
          <span>AI-Proc</span>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-300 hover:text-white" aria-label="Close menu">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id as View);
              }}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                activeView === item.id
                  ? 'bg-secondary font-semibold'
                                    : 'hover:bg-primary-focus'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-focus text-center text-xs text-gray-300">
          <p className="font-semibold">&copy; 2025 AI Proc</p>
          <p>Created by Sriyono iono</p>
          <p className="mt-1 text-gray-400">Powered by Gemini AI</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;