import React, { useState, useMemo } from 'react';
import type { Asset, AssetStatus, User } from '../../types';
import { DashboardIcon, AddAssetIcon, SearchIcon } from '../shared/Icons';

interface AssetListViewProps {
  assets: Asset[];
  category: string;
  onUpdateAsset: (updatedAsset: Asset) => void;
  onDeleteAsset: (assetId: string) => void;
  currentUser: User;
  onShowDetails: (assetId: string) => void;
  onNavigateToAddItem: () => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-4 flex items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
    <div className="p-3 bg-brand-accent/10 rounded-full mr-4">
      {icon}
    </div>
    <div>
      <p className="text-sm text-text-secondary font-medium">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </div>
);

const AssetRow: React.FC<{
  asset: Asset;
  onViewDetails: (assetId: string) => void;
  getStatusColor: (status: AssetStatus) => string;
}> = ({ asset, onViewDetails, getStatusColor }) => {
  return (
    <tr className="border-b transition-colors duration-200 hover:bg-brand-accent/10 odd:bg-white even:bg-brand-light/60">
      <td className="px-6 py-3 font-medium text-text-primary whitespace-nowrap">{asset.id}</td>
      <td className="px-6 py-3">{asset.name}</td>
      <td className="px-6 py-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asset.status)}`}>
          {asset.status}
        </span>
      </td>
      <td className="px-6 py-3">{asset.location.physicalLocation}</td>
      <td className="px-6 py-3">{asset.location.responsible}</td>
      <td className="px-6 py-3 text-right">
        <button 
          onClick={() => onViewDetails(asset.id)} 
          className="font-medium text-brand-primary hover:underline transform transition-transform active:scale-95 inline-block"
        >
          Ver Detalhes
        </button>
      </td>
    </tr>
  );
};


export const AssetListView: React.FC<AssetListViewProps> = ({ assets, category, onUpdateAsset, onDeleteAsset, currentUser, onShowDetails, onNavigateToAddItem }) => {
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [responsibleFilter, setResponsibleFilter] = useState('');

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
        const statusMatch = statusFilter === 'all' || asset.status === statusFilter;
        const responsibleMatch = responsibleFilter === '' || asset.location.responsible.toLowerCase().includes(responsibleFilter.toLowerCase());
        return statusMatch && responsibleMatch;
    });
  }, [assets, statusFilter, responsibleFilter]);
  
  const { totalCount, totalValue } = useMemo(() => {
    const count = filteredAssets.length;
    const value = filteredAssets.reduce((sum, asset) => sum + asset.acquisition.value, 0);
    return { totalCount: count, totalValue: value };
  }, [filteredAssets]);

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case 'Ativo': return 'bg-status-green/10 text-status-green';
      case 'Em Manutenção': return 'bg-status-yellow/10 text-status-yellow';
      case 'Sucateado': return 'bg-status-red/10 text-status-red';
      case 'Em Estoque': return 'bg-gray-200/50 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const inputClasses = "w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-sm";
  const allStatuses: AssetStatus[] = ['Ativo', 'Em Manutenção', 'Sucateado', 'Em Estoque'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-brand-secondary">{category}</h1>
        {currentUser.role === 'Admin' && (
          <button
            onClick={onNavigateToAddItem}
            className="flex items-center justify-center px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent transition-all font-medium text-sm transform active:scale-95"
          >
            <AddAssetIcon className="w-5 h-5 mr-2" />
            Cadastrar Item
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard 
          title="Total de Itens (Filtrado)" 
          value={totalCount} 
          icon={<DashboardIcon className="h-6 w-6 text-brand-primary" />} 
        />
        <KpiCard 
          title="Valor em Ativos (Filtrado)" 
          value={totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<span className="text-xl font-bold text-brand-primary h-6 w-6 flex items-center justify-center">R$</span>} 
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary">Filtrar por Situação</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as AssetStatus | 'all')} className={inputClasses}>
              <option value="all">Todas as Situações</option>
              {allStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-text-secondary">Filtrar por Responsável</label>
            <div className="relative">
              <input 
                type="text" 
                value={responsibleFilter} 
                onChange={e => setResponsibleFilter(e.target.value)} 
                placeholder="Digite o nome do responsável..." 
                className={`${inputClasses} pl-10`}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-secondary uppercase bg-brand-light">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">Situação</th>
                <th scope="col" className="px-6 py-3">Localização</th>
                <th scope="col" className="px-6 py-3">Responsável</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <AssetRow 
                  key={asset.id} 
                  asset={asset} 
                  onViewDetails={onShowDetails} 
                  getStatusColor={getStatusColor}
                />
              ))}
            </tbody>
          </table>
          {filteredAssets.length === 0 && <p className="p-6 text-center text-gray-500">Nenhum ativo encontrado com os filtros aplicados.</p>}
        </div>
      </div>
    </div>
  );
};