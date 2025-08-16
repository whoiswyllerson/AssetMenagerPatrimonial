import React, { useState, useEffect } from 'react';

interface CheckInModalProps {
  assetName: string;
  onClose: () => void;
  onConfirm: (storageLocation: string) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ assetName, onClose, onConfirm }) => {
  const [location, setLocation] = useState('Em Estoque');
  const [show, setShow] = useState(false);

  useEffect(() => {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onConfirm(location);
    }
  };

  const inputClasses = "w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all";

  return (
    <div className={`fixed inset-0 bg-black flex justify-center items-center z-[60] p-4 transition-opacity duration-300 ${show ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-md transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold text-brand-secondary">Realizar Check-in</h2>
            <p className="text-sm text-text-secondary">Ativo: {assetName}</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-text-primary mb-1">Local de Armazenamento</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClasses}
                placeholder="Ex: Almoxarifado"
                required
              />
            </div>
             <p className="text-xs text-text-secondary">Informe para onde o ativo será devolvido.</p>
          </div>
          <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium transform transition-transform active:scale-95">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium transform transition-transform active:scale-95">Confirmar Check-in</button>
          </div>
        </form>
      </div>
    </div>
  );
};
