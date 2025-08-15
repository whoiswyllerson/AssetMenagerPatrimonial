
import React, { useState } from 'react';
import type { Asset, AssetCategory, AssetStatus } from '../../types';
import { ITIcon, FurnitureIcon, VehicleIcon } from '../shared/Icons';

interface AddAssetViewProps {
  onAddAsset: (asset: Omit<Asset, 'id'>) => void;
}

const CategorySelector: React.FC<{
  selectedCategory: AssetCategory | null;
  onSelect: (category: AssetCategory) => void;
}> = ({ selectedCategory, onSelect }) => {
  const categories: { name: AssetCategory; label: string; icon: React.ReactNode }[] = [
    { name: 'Furniture', label: 'Mobiliário', icon: <FurnitureIcon className="w-10 h-10 mx-auto mb-2" /> },
    { name: 'IT', label: 'Informática', icon: <ITIcon className="w-10 h-10 mx-auto mb-2" /> },
    { name: 'Vehicle', label: 'Veículo', icon: <VehicleIcon className="w-10 h-10 mx-auto mb-2" /> },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-center">Selecione a Categoria do Ativo</h2>
      <div className="grid grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.name}
            onClick={() => onSelect(cat.name)}
            className={`p-6 border-2 rounded-lg text-center cursor-pointer transition-all ${selectedCategory === cat.name ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:border-brand-accent'}`}
          >
            {cat.icon}
            <span className="font-medium">{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


export const AddAssetView: React.FC<AddAssetViewProps> = ({ onAddAsset }) => {
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [formData, setFormData] = useState<Partial<Omit<Asset, 'id'>>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    if (keys.length > 1) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...(prev as any)[keys[0]],
          [keys[1]]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    
    // Add default empty structures to satisfy type constraints
    const completeAssetData = {
      ...formData,
      category,
      history: [{ date: new Date().toISOString().split('T')[0], user: 'Admin', action: 'Ativo criado' }],
      acquisition: {
        value: Number(formData.acquisition?.value) || 0,
        ...formData.acquisition,
      },
      ...getCategorySpecificDefaults(category),
    } as Omit<Asset, 'id'>;

    onAddAsset(completeAssetData);
    setCategory(null);
    setFormData({});
  };

  const getCategorySpecificDefaults = (cat: AssetCategory) => {
    switch (cat) {
      case 'Furniture': return { photoUrl: `https://picsum.photos/seed/${Date.now()}/400/300`, maintenanceSchedule: [], allocationHistory: [] };
      case 'IT': return { specs: {}, installedSoftware: [], repairHistory: [] };
      case 'Vehicle': return { vehicleData: {}, documentation: {}, preventiveMaintenance: [], fuelLogs: [] };
      default: return {};
    }
  };
  
  const inputClasses = "w-full p-2 border border-gray-200 rounded bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all";

  const renderFormFields = () => {
    if (!category) return null;
    return (
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Info */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Identificação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" placeholder="Nome do Ativo" onChange={handleInputChange} className={inputClasses} required />
            <input name="serialNumber" placeholder="Número de Série" onChange={handleInputChange} className={inputClasses} />
            <input name="identifiers.rfid" placeholder="Código RFID" onChange={handleInputChange} className={inputClasses} />
            <select name="status" onChange={handleInputChange} className={inputClasses} defaultValue="">
              <option value="" disabled>Selecione a Situação</option>
              {['Ativo', 'Em Manutenção', 'Sucateado', 'Em Estoque'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea name="description" placeholder="Descrição" onChange={handleInputChange} className={`${inputClasses} md:col-span-2`} rows={3}></textarea>
          </div>
        </div>

        {/* Acquisition & Location */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Aquisição</h3>
                <div className="space-y-4">
                    <input type="date" name="acquisition.purchaseDate" onChange={handleInputChange} className={inputClasses} />
                    <input type="number" name="acquisition.value" placeholder="Valor de Aquisição (R$)" onChange={handleInputChange} className={inputClasses} />
                    <input name="acquisition.supplier" placeholder="Fornecedor" onChange={handleInputChange} className={inputClasses} />
                    <input name="acquisition.invoice" placeholder="Nota Fiscal" onChange={handleInputChange} className={inputClasses} />
                </div>
            </div>
            <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Localização</h3>
                <div className="space-y-4">
                    <input name="location.physicalLocation" placeholder="Local Físico (Ex: Sala 301)" onChange={handleInputChange} className={inputClasses} />
                    <input name="location.responsible" placeholder="Responsável pelo Uso" onChange={handleInputChange} className={inputClasses} />
                </div>
            </div>
        </div>
        <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => setCategory(null)} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">Voltar</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent">Salvar Ativo</button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brand-secondary">Cadastro de Ativos</h1>
      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        {!category ? <CategorySelector selectedCategory={category} onSelect={setCategory} /> : renderFormFields()}
      </div>
    </div>
  );
};
