import React, { useState, useMemo, useEffect } from 'react';
import type { Asset, ITAsset, FurnitureAsset, VehicleAsset, AssetStatus, Contract, User, ToastType } from '../../types';
import { Card } from '../shared/Card';
import { CheckInIcon, CheckOutIcon, DocumentIcon, TagIcon } from '../shared/Icons';
import { CheckoutModal } from './CheckoutModal';
import { LabelPrintModal } from './LabelPrintModal';
import { CheckInModal } from './CheckInModal';

interface AssetDetailsModalProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: (updatedAsset: Asset) => void;
  onDelete: (assetId: string) => void;
  currentUser: User;
  addToast: (message: string, type?: ToastType) => void;
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

const calculateDepreciation = (asset: Asset) => {
    if (!asset.acquisition.usefulLifeInYears || asset.acquisition.usefulLifeInYears <= 0 || asset.acquisition.depreciationMethod !== 'Linear') {
        return {
            currentBookValue: asset.acquisition.value,
            accumulatedDepreciation: 0,
            isApplicable: false,
        };
    }

    const { value: cost, purchaseDate, usefulLifeInYears } = asset.acquisition;
    const annualDepreciation = cost / usefulLifeInYears;

    const purchase = new Date(purchaseDate + 'T00:00:00');
    const now = new Date();

    if (now < purchase) {
        return { currentBookValue: cost, accumulatedDepreciation: 0, isApplicable: true };
    }

    const diffTime = Math.abs(now.getTime() - purchase.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const elapsedYears = diffDays / 365.25;

    let accumulatedDepreciation = annualDepreciation * elapsedYears;
    accumulatedDepreciation = Math.min(accumulatedDepreciation, cost);

    const currentBookValue = cost - accumulatedDepreciation;
    
    return {
        currentBookValue: Math.max(0, currentBookValue),
        accumulatedDepreciation: accumulatedDepreciation,
        isApplicable: true,
    };
};

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({ asset, onClose, onUpdate, onDelete, currentUser, addToast }) => {
    const [currentStatus, setCurrentStatus] = useState<AssetStatus>(asset.status);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [show, setShow] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 10);
        return () => clearTimeout(timer);
    }, []);

    // FIX: Synchronize internal status state with asset prop to prevent stale UI
    useEffect(() => {
        setCurrentStatus(asset.status);
    }, [asset.status]);

    const depreciationInfo = useMemo(() => calculateDepreciation(asset), [asset]);

    const canEdit = useMemo(() => {
        if (currentUser.role === 'Admin') return true;
        if (currentUser.role === 'Gerente de Frota' && asset.category === 'Vehicle') return true;
        return false;
    }, [currentUser, asset]);

    const canDelete = useMemo(() => currentUser.role === 'Admin', [currentUser]);

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
                user: currentUser.name,
                action: `Status alterado para ${newStatus}`
            }
        ]
     };
      onUpdate(updatedAsset);
      addToast(`Status de "${asset.name}" alterado para ${newStatus}.`, 'info');
    };

    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja excluir o ativo "${asset.name}"? Esta ação não pode ser desfeita.`)) {
            onDelete(asset.id);
            addToast(`Ativo "${asset.name}" excluído com sucesso.`, 'success');
            onClose();
        }
    };

    const handleCheckIn = () => {
        setIsCheckInModalOpen(true);
    };
    
    const handleConfirmCheckIn = (storageLocation: string) => {
        const today = new Date().toISOString().split('T')[0];
        const lastAllocation = [...asset.allocationHistory].reverse().find(a => a.endDate === null);
        const newAllocationHistory = asset.allocationHistory.map(a => 
            (a === lastAllocation) ? { ...a, endDate: today } : a
        );

        const updatedAsset: Asset = {
            ...asset,
            status: 'Em Estoque',
            location: {
                physicalLocation: storageLocation,
                responsible: 'N/A',
            },
            history: [
                ...asset.history,
                { date: today, user: currentUser.name, action: `Check-in realizado por ${asset.location.responsible}` }
            ],
            allocationHistory: newAllocationHistory,
        };
        onUpdate(updatedAsset);
        addToast(`"${asset.name}" devolvido para ${storageLocation}.`, 'success');
        setIsCheckInModalOpen(false);
    };

    const handleConfirmCheckout = (responsible: string, location: string) => {
        const today = new Date().toISOString().split('T')[0];
        const responsibleName = responsible.trim() || `Uso Comum - ${location}`;
        
        const updatedAsset: Asset = {
            ...asset,
            status: 'Ativo',
            location: {
                physicalLocation: location,
                responsible: responsibleName,
            },
            history: [
                ...asset.history,
                { date: today, user: currentUser.name, action: `Check-out realizado para ${responsibleName}` }
            ],
            allocationHistory: [
                ...asset.allocationHistory,
                { user: responsibleName, startDate: today, endDate: null }
            ]
        };
        onUpdate(updatedAsset);
        addToast(`Check-out de "${asset.name}" realizado para ${responsibleName}.`, 'success');
        setIsCheckoutModalOpen(false);
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
        {isCheckInModalOpen && (
            <CheckInModal 
                assetName={asset.name}
                onClose={() => setIsCheckInModalOpen(false)}
                onConfirm={handleConfirmCheckIn}
            />
        )}
        {isCheckoutModalOpen && (
            <CheckoutModal 
                assetName={asset.name}
                currentLocation={asset.location.physicalLocation}
                onClose={() => setIsCheckoutModalOpen(false)}
                onConfirm={handleConfirmCheckout}
            />
        )}
        {isLabelModalOpen && (
            <LabelPrintModal
                asset={asset}
                onClose={() => setIsLabelModalOpen(false)}
            />
        )}
        <div className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${show ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-brand-light rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-brand-secondary">{asset.name}</h2>
                        <p className="text-sm text-text-secondary">{asset.id} &bull; {asset.category}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none">&times;</button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <DetailSection title="Informações Gerais">
                                <DetailItem label="Descrição" value={asset.description} />
                                <DetailItem label="Nº de Série" value={asset.serialNumber} />
                                {asset.identifiers?.rfid && <DetailItem label="Código RFID" value={asset.identifiers.rfid} />}
                                <DetailItem label="Situação" value={
                                  <select value={currentStatus} onChange={handleStatusChange} disabled={!canEdit} className="p-1 border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-gray-100 disabled:text-gray-500">
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
                            
                            {depreciationInfo.isApplicable && (
                                <DetailSection title="Depreciação (Método Linear)">
                                    <DetailItem 
                                        label="Valor Contábil Atual" 
                                        value={<span className="font-bold text-green-700">{depreciationInfo.currentBookValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
                                    />
                                    <DetailItem 
                                        label="Depreciação Acumulada" 
                                        value={depreciationInfo.accumulatedDepreciation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                                    />
                                    <DetailItem label="Vida Útil" value={`${asset.acquisition.usefulLifeInYears} anos`} />
                                </DetailSection>
                            )}

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
                            {asset.category === 'IT' && renderITDetails(asset as ITAsset)}
                            {asset.category === 'Vehicle' && renderVehicleDetails(asset as VehicleAsset)}
                        </div>
                    </div>
                </div>

                 <div className="p-4 bg-white mt-auto border-t flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center flex-wrap gap-3">
                         {canEdit && asset.status === 'Em Estoque' && (
                            <button 
                                onClick={() => setIsCheckoutModalOpen(true)}
                                className="flex items-center px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent transition-all font-medium text-sm transform active:scale-95"
                            >
                                <CheckOutIcon className="w-5 h-5 mr-2" />
                                Check-out
                            </button>
                        )}
                        {canEdit && asset.status === 'Ativo' && (
                            <button 
                                onClick={handleCheckIn}
                                className="flex items-center px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all font-medium text-sm transform active:scale-95"
                            >
                                <CheckInIcon className="w-5 h-5 mr-2" />
                                Check-in
                            </button>
                        )}
                        <button 
                            onClick={() => setIsLabelModalOpen(true)}
                            className="flex items-center px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-all font-medium text-sm transform active:scale-95"
                        >
                            <TagIcon className="w-5 h-5 mr-2" />
                            Gerar Etiqueta
                        </button>
                    </div>
                    <div className="flex items-center space-x-3">
                        {canDelete && (
                            <button 
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg bg-status-red text-white hover:bg-red-700 transition-all text-sm font-medium transform active:scale-95"
                            >
                                Excluir Ativo
                            </button>
                        )}
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-all text-sm font-medium transform active:scale-95"
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