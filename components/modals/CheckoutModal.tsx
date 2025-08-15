import React, { useState } from 'react';

interface CheckoutModalProps {
  assetName: string;
  currentLocation: string;
  onClose: () => void;
  onConfirm: (responsible: string, location: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ assetName, currentLocation, onClose, onConfirm }) => {
  const [responsible, setResponsible] = useState('');
  const [location, setLocation] = useState(currentLocation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (responsible.trim() && location.trim()) {
      onConfirm(responsible, location);
    }
  };

  const inputClasses = "w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold text-brand-secondary">Realizar Check-out</h2>
            <p className="text-sm text-text-secondary">Ativo: {assetName}</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label htmlFor="responsible" className="block text-sm font-medium text-text-primary mb-1">Nome do Responsável</label>
              <input
                id="responsible"
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className={inputClasses}
                placeholder="Ex: João da Silva"
                required
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-text-primary mb-1">Nova Localização</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClasses}
                placeholder="Ex: Sala 404, Mesa 02"
                required
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent text-sm font-medium">Confirmar Check-out</button>
          </div>
        </form>
      </div>
    </div>
  );
};
