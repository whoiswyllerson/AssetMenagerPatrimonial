
import React from 'react';
import type { View } from '../../App';
import { DashboardIcon, FurnitureIcon, ITIcon, VehicleIcon, AddAssetIcon } from '../shared/Icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ${
      isActive
        ? 'bg-brand-accent text-white shadow-md'
        : 'text-gray-300 hover:bg-brand-primary hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'DASHBOARD', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5"/> },
    { view: 'FURNITURE', label: 'Mobiliário', icon: <FurnitureIcon className="w-5 h-5"/> },
    { view: 'IT', label: 'Informática', icon: <ITIcon className="w-5 h-5"/> },
    { view: 'VEHICLES', label: 'Veículos', icon: <VehicleIcon className="w-5 h-5"/> },
    { view: 'ADD_ASSET', label: 'Cadastrar Ativo', icon: <AddAssetIcon className="w-5 h-5"/> },
  ];

  return (
    <nav className="w-64 bg-brand-secondary text-white flex flex-col p-4 shadow-lg">
      <div className="flex items-center mb-10 p-2">
        <div className="bg-brand-accent p-2 rounded-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        </div>
        <h1 className="text-xl font-bold ml-3">AssetManager</h1>
      </div>
      <ul className="flex-1">
        {navItems.map(item => (
          <NavItem
            key={item.view}
            icon={item.icon}
            label={item.label}
            isActive={currentView === item.view}
            onClick={() => setView(item.view)}
          />
        ))}
      </ul>
      <div className="mt-auto p-2">
        <p className="text-xs text-gray-400">&copy; 2024 AssetManager Pro</p>
      </div>
    </nav>
  );
};
