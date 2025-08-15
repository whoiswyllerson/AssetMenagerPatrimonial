
import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, BellIcon, ExclamationTriangleIcon } from '../shared/Icons';

interface Alert {
    type: 'Maintenance' | 'License';
    message: string;
}

interface HeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    alerts: Alert[];
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, alerts }) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notificationsRef]);
    
    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-20">
            <div className="relative flex-1 max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Pesquisar por nome, ID ou localização..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                />
            </div>
            <div className="flex items-center space-x-6">
                <div className="relative" ref={notificationsRef}>
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative text-gray-500 hover:text-brand-primary">
                        <BellIcon />
                        {alerts.length > 0 && (
                             <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-red text-white text-xs">
                                {alerts.length}
                             </span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border z-30">
                            <div className="p-3 border-b">
                                <h3 className="font-semibold text-text-primary">Notificações</h3>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {alerts.length > 0 ? (
                                    alerts.map((alert, index) => (
                                        <div key={index} className="flex items-start p-3 hover:bg-gray-50 border-b last:border-b-0">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-status-yellow mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-sm text-text-secondary">{alert.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-text-secondary p-4">Nenhuma notificação.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-3">
                    <img
                        className="h-10 w-10 rounded-full object-cover"
                        src="https://picsum.photos/seed/user/100/100"
                        alt="User avatar"
                    />
                    <div>
                        <p className="font-semibold text-sm text-text-primary">Admin</p>
                        <p className="text-xs text-text-secondary">System Administrator</p>
                    </div>
                </div>
            </div>
        </header>
    );
};
