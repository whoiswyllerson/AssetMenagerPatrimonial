import React, { useState, useRef, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Asset, AssetStatus, User } from '../../types';
import { DragHandleIcon, DashboardIcon, AddAssetIcon } from '../shared/Icons';

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

const ItemTypes = {
  ROW: 'row',
};

const DraggableRow: React.FC<{
  asset: Asset;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  onViewDetails: (assetId: string) => void;
  getStatusColor: (status: AssetStatus) => string;
}> = ({ asset, index, moveRow, onViewDetails, getStatusColor }) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const dragHandleRef = useRef<HTMLTableCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.ROW,
    hover(item: { index: number }, monitor) {
      if (!rowRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.ROW,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(dragHandleRef);
  drop(rowRef);
  preview(rowRef);

  return (
    <tr ref={rowRef} style={{ opacity: isDragging ? 0.5 : 1 }} className="bg-white hover:bg-gray-50 border-b">
      <td ref={dragHandleRef} className="pl-4 pr-2 py-3 cursor-move text-gray-400 hover:text-gray-800">
        <DragHandleIcon />
      </td>
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
        <button onClick={() => onViewDetails(asset.id)} className="font-medium text-brand-primary hover:underline">
          Ver Detalhes
        </button>
      </td>
    </tr>
  );
};


export const AssetListView: React.FC<AssetListViewProps> = ({ assets, category, onUpdateAsset, onDeleteAsset, currentUser, onShowDetails, onNavigateToAddItem }) => {
  const [currentAssets, setCurrentAssets] = useState(assets);
  
  React.useEffect(() => {
    setCurrentAssets(assets);
  }, [assets]);

  const { totalCount, totalValue } = useMemo(() => {
    const count = assets.length;
    const value = assets.reduce((sum, asset) => sum + asset.acquisition.value, 0);
    return { totalCount: count, totalValue: value };
  }, [assets]);

  const moveRow = (dragIndex: number, hoverIndex: number) => {
    const dragRow = currentAssets[dragIndex];
    const newAssets = [...currentAssets];
    newAssets.splice(dragIndex, 1);
    newAssets.splice(hoverIndex, 0, dragRow);
    setCurrentAssets(newAssets);
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case 'Ativo': return 'bg-status-green/10 text-status-green';
      case 'Em Manutenção': return 'bg-status-yellow/10 text-status-yellow';
      case 'Sucateado': return 'bg-status-red/10 text-status-red';
      case 'Em Estoque': return 'bg-gray-200/50 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          title="Total de Itens" 
          value={totalCount} 
          icon={<DashboardIcon className="h-6 w-6 text-brand-primary" />} 
        />
        <KpiCard 
          title="Valor Total em Ativos" 
          value={totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<span className="text-xl font-bold text-brand-primary h-6 w-6 flex items-center justify-center">R$</span>} 
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-secondary uppercase bg-brand-light">
              <tr>
                <th scope="col" className="p-4"></th>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">Situação</th>
                <th scope="col" className="px-6 py-3">Localização</th>
                <th scope="col" className="px-6 py-3">Responsável</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {currentAssets.map((asset, index) => (
                <DraggableRow 
                  key={asset.id} 
                  asset={asset} 
                  index={index} 
                  moveRow={moveRow} 
                  onViewDetails={onShowDetails} 
                  getStatusColor={getStatusColor}
                />
              ))}
            </tbody>
          </table>
          {currentAssets.length === 0 && <p className="p-6 text-center text-gray-500">Nenhum ativo encontrado nesta categoria.</p>}
        </div>
      </div>
    </div>
  );
};