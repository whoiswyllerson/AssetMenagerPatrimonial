
import React, { useState, useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', confirmButtonClass = 'bg-brand-primary text-white hover:bg-brand-accent' }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black flex justify-center items-center z-[70] p-4 transition-opacity duration-300 ${show ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <h2 className="text-xl font-bold text-brand-secondary">{title}</h2>
          <p className="text-sm text-text-secondary mt-2">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium transform transition-transform active:scale-95">{cancelText}</button>
          <button type="button" onClick={onConfirm} className={`px-4 py-2 rounded-lg text-sm font-medium transform transition-transform active:scale-95 ${confirmButtonClass}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};
