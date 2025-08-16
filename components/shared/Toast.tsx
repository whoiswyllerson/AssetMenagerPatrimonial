import React from 'react';
import type { Toast, ToastType } from '../../types';
import { CheckCircleIcon, ExclamationTriangleIcon } from './Icons';

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    switch (type) {
        case 'success':
            return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
        case 'error':
            return <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />;
        case 'info':
        default:
            return <ExclamationTriangleIcon className="w-6 h-6 text-blue-500" />;
    }
};

interface ToastProps {
    toast: Toast;
    onDismiss: (id: number) => void;
}

const ToastMessage: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const showTimer = setTimeout(() => setShow(true), 10);
        const hideTimer = setTimeout(() => setShow(false), 4500);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    return (
        <div
            className={`
                flex items-start p-4 mb-4 rounded-lg shadow-lg bg-white border-l-4 w-full max-w-sm transition-all duration-300 transform
                ${toast.type === 'success' ? 'border-green-500' : ''}
                ${toast.type === 'error' ? 'border-red-500' : ''}
                ${toast.type === 'info' ? 'border-blue-500' : ''}
                ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            <div className="flex-shrink-0">
                <ToastIcon type={toast.type} />
            </div>
            <div className="ml-3 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="inline-flex text-gray-400 hover:text-gray-500"
                >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};


interface ToastContainerProps {
    toasts: Toast[];
    setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, setToasts }) => {
    const handleDismiss = (id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    return (
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
            {toasts.map(toast => (
                <ToastMessage key={toast.id} toast={toast} onDismiss={handleDismiss} />
            ))}
        </div>
    );
};
