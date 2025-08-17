
import React, { useState, useEffect } from 'react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue: string) => void;
  title: string;
  message: string;
  label: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  initialValue?: string;
  required?: boolean;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onConfirm, title, message, label, placeholder, confirmText = 'Confirmar', cancelText = 'Cancelar', initialValue = '', required = true }) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      setInputValue(initialValue);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !inputValue.trim()) return;
    onConfirm(inputValue);
  };
  
  const inputClasses = "w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all";

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black flex justify-center items-center z-[70] p-4 transition-opacity duration-300 ${show ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold text-brand-secondary">{title}</h2>
            <p className="text-sm text-text-secondary mt-1">{message}</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="prompt-input" className="block text-sm font-medium text-text-primary mb-1">{label}</label>
              <input
                id="prompt-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={inputClasses}
                placeholder={placeholder}
                required={required}
                autoFocus
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium transform transition-transform active:scale-95">{cancelText}</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent text-sm font-medium transform transition-transform active:scale-95">{confirmText}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
