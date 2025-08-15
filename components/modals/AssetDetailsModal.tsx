
import React, { useState } from 'react';
import type { Asset, ITAsset, FurnitureAsset, VehicleAsset, AssetStatus } from '../../types';
import { Card } from '../shared/Card';

interface AssetDetailsModalProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: (updatedAsset: Asset) => void;
  onDelete: (assetId: string) => void;
}

const DetailSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-md font-semibold text-brand-secondary border-b border-gray-200 pb-2 mb-3">{title}</h3>
        <div className="text-sm space-y-2">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="col-span-2 text-text-primary">{value || 'N/A'}</span>
    </div>
);

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({ asset, onClose, onUpdate, onDelete }) => {
    const [currentStatus, setCurrentStatus] = useState<AssetStatus>(asset.status);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as AssetStatus;
      setCurrentStatus(newStatus);
      const updatedAsset = { ...asset, status: newStatus };
      onUpdate(updatedAsset);
    };

    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja excluir o ativo "${asset.name}"? Esta ação não pode ser desfeita.`)) {
            onDelete(asset.id);
            onClose();
        }
    };

    const renderFurnitureDetails = (asset: FurnitureAsset) => (
      <>
        <DetailSection title="Detalhes do Mobiliário">
            <div className="flex justify-center">
              <img src={asset.photoUrl} alt={asset.name} className="rounded-lg max-h-48" />
            </div>
        </DetailSection>
        {asset.allocationHistory.length > 0 && <DetailSection title="Histórico de Alocação">
            {asset.allocationHistory.map((alloc, i) => (
                <p key={i} className="text-sm">{alloc.user} (de {alloc.startDate} a {alloc.endDate || 'presente'})</p>
            ))}
        </DetailSection>}
      </>
    );

    const renderITDetails = (asset: ITAsset) => (
      <DetailSection title="Especificações Técnicas">
        <DetailItem label="Processador" value={asset.specs.processor} />
        <DetailItem label="Memória RAM" value={asset.specs.ram} />
        <DetailItem label="Armazenamento" value={asset.specs.storage} />
      </DetailSection>
    );

    const renderVehicleDetails = (asset: VehicleAsset) => (
      <>
        <DetailSection title="Dados do Veículo">
          <DetailItem label="Placa" value={asset.vehicleData.plate} />
          <DetailItem label="Renavam" value={asset.vehicleData.renavam} />
          <DetailItem label="Modelo" value={asset.vehicleData.model} />
          <DetailItem label="Ano" value={asset.vehicleData.year} />
        </DetailSection>
        <DetailSection title="Documentação">
          <DetailItem label="Venc. IPVA" value={asset.documentation.ipvaDueDate} />
          <DetailItem label="Venc. Licenciamento" value={asset.documentation.licensingDueDate} />
          <DetailItem label="Venc. Seguro" value={asset.documentation.insuranceExpiry} />
        </DetailSection>
        {asset.fuelLogs.length > 0 && <DetailSection title="Histórico de Combustível">
            {asset.fuelLogs.map(log => (
                <div key={log.id} className="text-sm">
                    {log.date}: {log.liters.toFixed(2)}L por R$ {log.cost.toFixed(2)}
                </div>
            ))}
        </DetailSection>}
      </>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-light rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-secondary">{asset.name}</h2>
                        <p className="text-sm text-text-secondary">{asset.id} &bull; {asset.category}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <DetailSection title="Informações Gerais">
                                <DetailItem label="Descrição" value={asset.description} />
                                <DetailItem label="Nº de Série" value={asset.serialNumber} />
                                {asset.identifiers?.rfid && <DetailItem label="Código RFID" value={asset.identifiers.rfid} />}
                                <DetailItem label="Situação" value={
                                  <select value={currentStatus} onChange={handleStatusChange} className="p-1 border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent">
                                    {['Ativo', 'Em Manutenção', 'Sucateado', 'Em Estoque'].map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                } />
                            </DetailSection>

                             <DetailSection title="Localização">
                                <DetailItem label="Local Físico" value={asset.location.physicalLocation} />
                                <DetailItem label="Responsável" value={asset.location.responsible} />
                            </DetailSection>

                             <DetailSection title="Aquisição">
                                <DetailItem label="Data da Compra" value={asset.acquisition.purchaseDate} />
                                <DetailItem label="Valor" value={asset.acquisition.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                <DetailItem label="Fornecedor" value={asset.acquisition.supplier} />
                                <DetailItem label="Nota Fiscal" value={asset.acquisition.invoice} />
                            </DetailSection>
                        </div>
                        <div>
                            {asset.category === 'Furniture' && renderFurnitureDetails(asset as FurnitureAsset)}
                            {asset.category === 'IT' && renderITDetails(asset as ITAsset)}
                            {asset.category === 'Vehicle' && renderVehicleDetails(asset as VehicleAsset)}
                        </div>
                    </div>
                </div>

                 <div className="p-4 bg-white mt-auto border-t flex justify-between items-center">
                    <button 
                        onClick={handleDelete}
                        className="px-5 py-2 rounded-lg bg-status-red text-white hover:bg-red-700 transition-colors"
                    >
                        Excluir Ativo
                    </button>
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
