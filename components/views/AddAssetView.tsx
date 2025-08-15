
import React, { useState } from 'react';
import type { Asset, AssetCategory, AssetStatus } from '../../types';
import { ITIcon, FurnitureIcon, VehicleIcon, PhotoIcon, DocumentIcon, UploadIcon } from '../shared/Icons';

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPhotoPreview(result);
            setFormData(prev => ({ ...prev, photoUrl: result }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setDocumentFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setFormData(prev => ({
                ...prev,
                documentUrl: result,
                documentName: file.name
            }));
        };
        reader.readAsDataURL(file);
    }
  };


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
    
    const defaultPhotoUrl = category === 'Furniture' ? `https://picsum.photos/seed/${Date.now()}/400/300` : undefined;

    const completeAssetData = {
      ...getCategorySpecificDefaults(category),
      ...formData,
      category,
      photoUrl: formData.photoUrl || defaultPhotoUrl,
      history: [{ date: new Date().toISOString().split('T')[0], user: 'Admin', action: 'Ativo criado' }],
      allocationHistory: [],
      acquisition: {
        value: Number(formData.acquisition?.value) || 0,
        ...formData.acquisition,
      },
    } as Omit<Asset, 'id'>;

    onAddAsset(completeAssetData);
    setCategory(null);
    setFormData({});
    setPhotoPreview(null);
    setDocumentFile(null);
  };

  const getCategorySpecificDefaults = (cat: AssetCategory) => {
    switch (cat) {
      case 'Furniture': return { maintenanceSchedule: [] };
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

        {/* Photo Upload Section */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Foto do Ativo (Opcional)</h3>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview do ativo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-center p-2">
                  <PhotoIcon className="w-10 h-10 mx-auto text-gray-300" />
                  <span className="text-xs mt-1 block">Preview</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="photo-upload" className="cursor-pointer px-5 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-accent transition-colors">
                Carregar Imagem
              </label>
              <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <p className="text-xs text-text-secondary mt-2">Use uma imagem nítida para identificar o ativo facilmente.<br/>Formatos suportados: PNG, JPG.</p>
            </div>
          </div>
        </div>
        
        {/* Document Upload Section */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Documento do Ativo (Opcional)</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label htmlFor="document-upload" className="cursor-pointer px-5 py-2.5 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors inline-flex items-center">
                <UploadIcon className="w-5 h-5 mr-2" />
                Carregar Documento
              </label>
              <input id="document-upload" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleDocumentChange} className="hidden" />
              <p className="text-xs text-text-secondary mt-2">Anexe a nota fiscal, manual ou outro documento relevante.<br/>Formatos suportados: PDF, DOCX, XLSX.</p>
            </div>
            {documentFile && (
              <div className="flex items-center p-2 rounded-lg bg-gray-100 border max-w-xs">
                <DocumentIcon className="w-8 h-8 text-gray-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-text-primary truncate" title={documentFile.name}>{documentFile.name}</span>
              </div>
            )}
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