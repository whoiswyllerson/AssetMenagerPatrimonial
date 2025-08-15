
import React, { useState } from 'react';
import type { Asset, ITAsset, FurnitureAsset, VehicleAsset, AssetStatus, Contract } from '../../types';
import { Card } from '../shared/Card';
import { CheckInIcon, CheckOutIcon, DocumentIcon, ContractIcon } from '../shared/Icons';
import { CheckoutModal } from './CheckoutModal';

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
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as AssetStatus;
      setCurrentStatus(newStatus);
      const updatedAsset = { 
        ...asset, 
        status: newStatus,
        history: [
            ...asset.history,
            {
                date: new Date().toISOString().split('T')[0],
                user: 'Admin',
                action: `Status alterado para ${newStatus}`
            }
        ]
     };
      onUpdate(updatedAsset);
    };

    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja excluir o ativo "${asset.name}"? Esta ação não pode ser desfeita.`)) {
            onDelete(asset.id);
            onClose();
        }
    };

    const handleCheckIn = () => {
        if (window.confirm(`Confirmar o check-in (devolução) de "${asset.name}"?`)) {
            const today = new Date().toISOString().split('T')[0];

            // Find the last open allocation and close it
            const lastAllocation = [...asset.allocationHistory].reverse().find(a => a.endDate === null);
            const newAllocationHistory = asset.allocationHistory.map(a => 
                (a === lastAllocation) ? { ...a, endDate: today } : a
            );

            const updatedAsset: Asset = {
                ...asset,
                status: 'Em Estoque',
                location: {
                    ...asset.location,
                    responsible: 'N/A',
                },
                history: [
                    ...asset.history,
                    { date: today, user: 'Admin', action: `Check-in realizado por ${asset.location.responsible}` }
                ],
                allocationHistory: newAllocationHistory,
            };
            onUpdate(updatedAsset);
            onClose();
        }
    };

    const handleConfirmCheckout = (responsible: string, location: string) => {
        const today = new Date().toISOString().split('T')[0];
        const updatedAsset: Asset = {
            ...asset,
            status: 'Ativo',
            location: {
                physicalLocation: location,
                responsible: responsible,
            },
            history: [
                ...asset.history,
                { date: today, user: 'Admin', action: `Check-out realizado para ${responsible}` }
            ],
            allocationHistory: [
                ...asset.allocationHistory,
                { user: responsible, startDate: today, endDate: null }
            ]
        };
        onUpdate(updatedAsset);
        setIsCheckoutModalOpen(false);
        onClose();
    };

    const getContractStatus = (endDate: string) => {
        const now = new Date();
        now.setHours(0,0,0,0);
        const end = new Date(endDate + 'T00:00:00');
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        
        if (end < now) {
            return { text: 'Expirado', color: 'bg-status-red/20 text-status-red' };
        }
        if (end <= thirtyDaysFromNow) {
            return { text: 'Expirando', color: 'bg-status-yellow/20 text-status-yellow' };
        }
        return { text: 'Ativo', color: 'bg-status-green/20 text-status-green' };
    };

    const renderFurnitureDetails = (asset: FurnitureAsset) => (
      <>
        {/* Allocation history is now rendered for all assets */}
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
        <>
        {isCheckoutModalOpen && (
            <CheckoutModal 
                assetName={asset.name}
                currentLocation={asset.location.physicalLocation}
                onClose={() => setIsCheckoutModalOpen(false)}
                onConfirm={handleConfirmCheckout}
            />
        )}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-light rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
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

                            {asset.documentUrl && asset.documentName && (
                                <DetailSection title="Documento Anexado">
                                    <div className="flex items-center p-2 rounded-lg bg-gray-100 border">
                                        <DocumentIcon className="w-8 h-8 text-gray-500 mr-3 flex-shrink-0" />
                                        <a 
                                            href={asset.documentUrl} 
                                            download={asset.documentName} 
                                            className="text-brand-primary hover:underline font-medium break-all"
                                            title={`Baixar ${asset.documentName}`}
                                        >
                                            {asset.documentName}
                                        </a>
                                    </div>
                                </DetailSection>
                            )}

                            {asset.allocationHistory && asset.allocationHistory.length > 0 && 
                                <DetailSection title="Histórico de Alocação">
                                    <div className="max-h-24 overflow-y-auto pr-2">
                                    {[...asset.allocationHistory].reverse().map((alloc, i) => (
                                        <p key={i} className="text-sm py-1 border-b last:border-0">
                                            <span className="font-semibold">{alloc.user}</span> (de {new Date(alloc.startDate + 'T00:00:00').toLocaleDateString()} a {alloc.endDate ? new Date(alloc.endDate + 'T00:00:00').toLocaleDateString() : 'presente'})
                                        </p>
                                    ))}
                                    </div>
                                </DetailSection>
                            }
                        </div>
                        <div>
                            {asset.photoUrl && (
                                <DetailSection title="Foto do Ativo">
                                    <div className="flex justify-center my-2">
                                        <img src={asset.photoUrl} alt={asset.name} className="rounded-lg max-h-48 shadow-md object-contain" />
                                    </div>
                                </DetailSection>
                            )}
                            {asset.contracts && asset.contracts.length > 0 && (
                                <DetailSection title="Contratos e Garantias">
                                    <div className="space-y-3">
                                        {asset.contracts.map(contract => {
                                            const status = getContractStatus(contract.endDate);
                                            return (
                                                <div key={contract.id} className="p-3 rounded-lg border bg-white">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-text-primary">{contract.type} - {contract.supplier}</p>
                                                            <p className="text-xs text-text-secondary">
                                                                {new Date(contract.startDate + 'T00:00:00').toLocaleDateString()} - {new Date(contract.endDate + 'T00:00:00').toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>{status.text}</span>
                                                    </div>
                                                    {contract.details && <p className="text-xs text-text-secondary mt-2 pt-2 border-t">{contract.details}</p>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </DetailSection>
                            )}
                            {asset.category === 'Furniture' && renderFurnitureDetails(asset as FurnitureAsset)}
                            {asset.category === 'IT' && renderITDetails(asset as ITAsset)}
                            {asset.category === 'Vehicle' && renderVehicleDetails(asset as VehicleAsset)}
                        </div>
                    </div>
                </div>

                 <div className="p-4 bg-white mt-auto border-t flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                         {asset.status === 'Em Estoque' && (
                            <button 
                                onClick={() => setIsCheckoutModalOpen(true)}
                                className="flex items-center px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent transition-colors font-medium text-sm"
                            >
                                <CheckOutIcon className="w-5 h-5 mr-2" />
                                Check-out
                            </button>
                        )}
                        {asset.status === 'Ativo' && (
                            <button 
                                onClick={handleCheckIn}
                                className="flex items-center px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium text-sm"
                            >
                                <CheckInIcon className="w-5 h-5 mr-2" />
                                Check-in
                            </button>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={handleDelete}
                            className="px-4 py-2 rounded-lg bg-status-red text-white hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            Excluir Ativo
                        </button>
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};