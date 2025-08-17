import React, { useMemo } from 'react';
import type { View } from '../../App';
import type { User } from '../../types';
import { DashboardIcon, FurnitureIcon, ITIcon, VehicleIcon, InventoryIcon, ReportsIcon, KeyIcon, XIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '../shared/Icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  currentUser: User;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}> = ({ icon, label, isActive, onClick, isCollapsed }) => (
  <li
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`flex items-center p-3 my-1 rounded-r-lg cursor-pointer transition-all duration-200 ${
      isActive
        ? 'bg-brand-accent/10 text-white border-l-4 border-brand-accent'
        : 'text-gray-300 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
    } ${isCollapsed ? 'justify-center' : ''}`}
  >
    {icon}
    {!isCollapsed && <span className="ml-4 font-medium whitespace-nowrap">{label}</span>}
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser, isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }) => {
  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'DASHBOARD', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5"/> },
    { view: 'KEY_MANAGEMENT', label: 'Controle de Chaves', icon: <KeyIcon className="w-5 h-5"/> },
    { view: 'FURNITURE', label: 'Mobiliário', icon: <FurnitureIcon className="w-5 h-5"/> },
    { view: 'IT', label: 'Informática', icon: <ITIcon className="w-5 h-5"/> },
    { view: 'VEHICLES', label: 'Veículos', icon: <VehicleIcon className="w-5 h-5"/> },
    { view: 'INVENTORY', label: 'Inventário', icon: <InventoryIcon className="w-5 h-5"/> },
    { view: 'REPORTS', label: 'Relatórios', icon: <ReportsIcon className="w-5 h-5"/> },
  ];

  const visibleNavItems = useMemo(() => {
    return navItems.filter(item => {
        if (currentUser.role === 'Admin') return true;
        if (currentUser.role === 'Gerente de Frota') {
            return ['DASHBOARD', 'VEHICLES', 'INVENTORY', 'REPORTS'].includes(item.view);
        }
        if (currentUser.role === 'Colaborador') {
            return ['DASHBOARD'].includes(item.view);
        }
        return false;
    }).filter(item => {
        if (currentUser.role !== 'Admin') {
            if (['ADD_ITEM', 'KEY_MANAGEMENT'].includes(item.view)) {
                return false;
            }
        }
        return true;
    });
  }, [currentUser.role]);

  return (
    <>
      <nav 
        className={`fixed inset-y-0 left-0 z-40 bg-brand-secondary text-white flex flex-col shadow-lg transition-all duration-300 ease-in-out
                   ${isCollapsed ? 'w-20 p-2' : 'w-64 p-4'}
                   lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center mb-10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center">
            <div className="bg-brand-accent p-2 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            {!isCollapsed && <h1 className="text-xl font-bold ml-3 whitespace-nowrap">AssetManager</h1>}
          </div>
          <button onClick={() => setIsMobileOpen(false)} className={`lg:hidden text-gray-300 hover:text-white ${isCollapsed ? 'hidden' : ''}`}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <ul className="flex-1">
          {visibleNavItems.map(item => (
            <NavItem
              key={item.view}
              icon={item.icon}
              label={item.label}
              isActive={currentView === item.view}
              onClick={() => setView(item.view)}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
        <div className="mt-auto">
            <div className="hidden lg:block border-t border-white/10 my-2"></div>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className="hidden lg:flex items-center justify-center w-full p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white"
                title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
                {isCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
                {!isCollapsed && <span className="ml-2 text-sm">Recolher</span>}
            </button>
            {!isCollapsed && <p className="text-xs text-gray-400 mt-4 text-center">&copy; 2024 AssetManager Pro</p>}
        </div>
      </nav>
      {isMobileOpen && <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"></div>}
    </>
  );
};