import React, { useState, useMemo, useEffect } from 'react';
import type { Asset, ITAsset, FurnitureAsset, VehicleAsset, AssetStatus, Contract, User, ToastType } from '../../types';
import { Card } from '../shared/Card';
import { CheckInIcon, CheckOutIcon, DocumentIcon, EditIcon, HistoryIcon, TagIcon, TrashIcon } from '../shared/Icons';
import { CheckoutModal } from './CheckoutModal';
import { LabelPrintModal } from './LabelPrintModal';
import { CheckInModal } from './CheckInModal';
import { ConfirmationModal } from './ConfirmationModal';

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
        <span className="col-span-2 text-text-primary break-words">{value || 'N/A'}</span>
    </div>
);

const EditItem: React.FC<{ label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, as?: 'textarea' }> = ({ label, name, value, onChange, as = 'input' }) => {
    const inputClasses = "w-full p-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-sm";
    return (
        <div className="grid grid-cols-3 gap-4 items-center">
            <label htmlFor={name} className="text-text-secondary font-medium">{label}</label>
            <div className="col-span-2">
                {as === 'textarea' ? (
                    <textarea id={name} name={name} value={value} onChange={onChange} className={`${inputClasses} h-24`} />
                ) : (
                    <input type="text" id={name} name={name} value={value} onChange={onChange} className={inputClasses} />
                )}
            </div>
        </div>
    );
};

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
    const [isEditing, setIsEditing] = useState(false);
    const [editableAsset, setEditableAsset] = useState<Asset>(asset);
    const [currentStatus, setCurrentStatus] = useState<AssetStatus>(asset.status);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [show, setShow] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setEditableAsset(asset);
        setCurrentStatus(asset.status);
    }, [asset]);

    const depreciationInfo = useMemo(() => calculateDepreciation(asset), [asset]);
    
    const sortedHistory = useMemo(() => {
        return [...asset.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [asset.history]);


    const canEdit = useMemo(() => {
        if (currentUser.role === 'Admin') return true;
        if (currentUser.role === 'Gerente de Frota' && asset.category === 'Vehicle') return true;
        return false;
    }, [currentUser, asset]);

    const canDelete = useMemo(() => currentUser.role === 'Admin', [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        setEditableAsset(prev => {
            if (keys.length > 1) {
                const [level1, level2] = keys;
                const newLevel1 = { ...((prev as any)[level1] ?? {}), [level2]: value };
                return { ...prev, [level1]: newLevel1 };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as AssetStatus;
      setCurrentStatus(newStatus);
      const assetToUpdate = { ...(isEditing ? editableAsset : asset) };
      
      const updatedAsset = { 
        ...assetToUpdate, 
        status: newStatus,
        history: [
            ...assetToUpdate.history,
            {
                date: new Date().toISOString().split('T')[0],
                user: currentUser.name,
                action: `Status alterado`,
                details: `De "${assetToUpdate.status}" para "${newStatus}"`
            }
        ]
     };

      if (isEditing) {
        setEditableAsset(updatedAsset);
      } else {
        onUpdate(updatedAsset);
        addToast(`Status de "${asset.name}" alterado para ${newStatus}.`, 'info');
      }
    };

    const handleSave = () => {
        const changes: string[] = [];
        if (editableAsset.name !== asset.name) changes.push(`Nome alterado de "${asset.name}" para "${editableAsset.name}".`);
        if (editableAsset.description !== asset.description) changes.push('Descrição atualizada.');
        if (editableAsset.serialNumber !== asset.serialNumber) changes.push(`Nº de Série alterado para "${editableAsset.serialNumber}".`);
        if (editableAsset.location.physicalLocation !== asset.location.physicalLocation) changes.push(`Localização alterada para "${editableAsset.location.physicalLocation}".`);
        if (editableAsset.location.responsible !== asset.location.responsible) changes.push(`Responsável alterado para "${editableAsset.location.responsible}".`);
        
        let finalAsset = { ...editableAsset };

        if (changes.length > 0) {
            finalAsset.history = [
                ...editableAsset.history,
                {
                    date: new Date().toISOString().split('T')[0],
                    user: currentUser.name,
                    action: 'Dados atualizados',
                    details: changes.join(' ')
                }
            ];
        }

        onUpdate(finalAsset);
        addToast(`Ativo "${asset.name}" atualizado com sucesso.`, 'success');
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditableAsset(asset);
        setCurrentStatus(asset.status);
        setIsEditing(false);
    };

    const handleDelete = () => {
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = () => {
        onDelete(asset.id);
        addToast(`Ativo "${asset.name}" excluído com sucesso.`, 'success');
        onClose();
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
                { 
                    date: today, 
                    user: currentUser.name, 
                    action: `Check-in`,
                    details: `Devolvido para ${storageLocation} por ${asset.location.responsible}.`
                }
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
                { 
                    date: today, 
                    user: currentUser.name, 
                    action: `Check-out`,
                    details: `Retirado para ${responsibleName} em ${location}.`
                }
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

    const renderITDetails = (itAsset: ITAsset) => (
      <DetailSection title="Especificações Técnicas">
        <DetailItem label="Processador" value={itAsset.specs.processor} />
        <DetailItem label="Memória RAM" value={itAsset.specs.ram} />
        <DetailItem label="Armazenamento" value={itAsset.specs.storage} />
      </DetailSection>
    );

    const renderVehicleDetails = (vehicleAsset: VehicleAsset) => (
      <>
        <DetailSection title="Dados do Veículo">
          <DetailItem label="Placa" value={vehicleAsset.vehicleData.plate} />
          <DetailItem label="Renavam" value={vehicleAsset.vehicleData.renavam} />
          <DetailItem label="Modelo" value={vehicleAsset.vehicleData.model} />
          <DetailItem label="Ano" value={vehicleAsset.vehicleData.year} />
        </DetailSection>
        <DetailSection title="Documentação">
          <DetailItem label="Venc. IPVA" value={new Date(vehicleAsset.documentation.ipvaDueDate + 'T00:00:00').toLocaleDateString()} />
          <DetailItem label="Venc. Licenciamento" value={new Date(vehicleAsset.documentation.licensingDueDate + 'T00:00:00').toLocaleDateString()} />
          <DetailItem label="Venc. Seguro" value={new Date(vehicleAsset.documentation.insuranceExpiry + 'T00:00:00').toLocaleDateString()} />
        </DetailSection>
      </>
    );
    
    return (
        <>
        {isCheckInModalOpen && <CheckInModal assetName={asset.name} onClose={() => setIsCheckInModalOpen(false)} onConfirm={handleConfirmCheckIn} />}
        {isCheckoutModalOpen && <CheckoutModal assetName={asset.name} currentLocation={asset.location.physicalLocation} onClose={() => setIsCheckoutModalOpen(false)} onConfirm={handleConfirmCheckout} />}
        {isLabelModalOpen && <LabelPrintModal asset={asset} onClose={() => setIsLabelModalOpen(false)} />}
        <ConfirmationModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o ativo "${asset.name}"? Esta ação é irreversível.`} confirmText="Excluir" confirmButtonClass="bg-status-red text-white hover:bg-red-700" />

        <div className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${show ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-brand-light rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <div className="p-4 sm:p-6 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-brand-secondary">{asset.name}</h2>
                        <p className="text-sm text-text-secondary">{asset.id} &bull; {asset.category}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none">&times;</button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                        {/* Coluna da Esquerda */}
                        <div className="lg:pr-4">
                             <DetailSection title="Informações Gerais">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <EditItem label="Nome" name="name" value={editableAsset.name} onChange={handleInputChange} />
                                        <EditItem label="Descrição" name="description" value={editableAsset.description} onChange={handleInputChange} as="textarea" />
                                        <EditItem label="Nº de Série" name="serialNumber" value={editableAsset.serialNumber} onChange={handleInputChange} />
                                        <EditItem label="Código RFID" name="identifiers.rfid" value={editableAsset.identifiers?.rfid || ''} onChange={handleInputChange} />
                                    </div>
                                ) : (
                                    <>
                                        <DetailItem label="Descrição" value={asset.description} />
                                        <DetailItem label="Nº de Série" value={asset.serialNumber} />
                                        {asset.identifiers?.rfid && <DetailItem label="Código RFID" value={asset.identifiers.rfid} />}
                                    </>
                                )}
                                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                                    <span className="text-text-secondary font-medium">Situação</span>
                                    <div className="col-span-2 text-text-primary">
                                      <select value={currentStatus} onChange={handleStatusChange} disabled={!canEdit} className="p-1 border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-gray-100 disabled:text-gray-500 w-full">
                                        {['Ativo', 'Em Manutenção', 'Sucateado', 'Em Estoque'].map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                </div>
                            </DetailSection>

                             <DetailSection title="Localização">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <EditItem label="Local Físico" name="location.physicalLocation" value={editableAsset.location.physicalLocation} onChange={handleInputChange} />
                                        <EditItem label="Responsável" name="location.responsible" value={editableAsset.location.responsible} onChange={handleInputChange} />
                                    </div>
                                ) : (
                                    <>
                                        <DetailItem label="Local Físico" value={asset.location.physicalLocation} />
                                        <DetailItem label="Responsável" value={asset.location.responsible} />
                                    </>
                                )}
                            </DetailSection>

                             <DetailSection title="Aquisição">
                                <DetailItem label="Data da Compra" value={new Date(asset.acquisition.purchaseDate + 'T00:00:00').toLocaleDateString()} />
                                <DetailItem label="Valor" value={asset.acquisition.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                <DetailItem label="Fornecedor" value={asset.acquisition.supplier} />
                                <DetailItem label="Nota Fiscal" value={asset.acquisition.invoice} />
                            </DetailSection>
                             
                            <DetailSection title="Depreciação">
                                {depreciationInfo.isApplicable ? (
                                    <>
                                    <DetailItem label="Valor Contábil Atual" value={depreciationInfo.currentBookValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                    <DetailItem label="Depreciação Acumulada" value={depreciationInfo.accumulatedDepreciation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                    <DetailItem label="Vida Útil" value={`${asset.acquisition.usefulLifeInYears} anos`} />
                                    </>
                                ) : <p className="text-sm text-gray-500">Não aplicável.</p>}
                            </DetailSection>

                            {asset.category === 'IT' && renderITDetails(asset as ITAsset)}
                            {asset.category === 'Vehicle' && renderVehicleDetails(asset as VehicleAsset)}
                            
                            {asset.documentUrl && <DetailSection title="Documentos">
                                <a href={asset.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-brand-primary hover:underline">
                                    <DocumentIcon className="mr-2" /> {asset.documentName || 'Ver Documento'}
                                </a>
                            </DetailSection>}

                            {asset.contracts && asset.contracts.length > 0 && (
                                <DetailSection title="Contratos">
                                    {asset.contracts.map(contract => {
                                        const status = getContractStatus(contract.endDate);
                                        return (
                                            <div key={contract.id} className="p-2 border rounded-md bg-gray-50">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold">{contract.type} - {contract.supplier}</p>
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status.color}`}>{status.text}</span>
                                                </div>
                                                <p className="text-xs text-text-secondary">
                                                    {new Date(contract.startDate + 'T00:00:00').toLocaleDateString()} a {new Date(contract.endDate + 'T00:00:00').toLocaleDateString()}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </DetailSection>
                            )}
                        </div>
                        
                        {/* Coluna da Direita */}
                        <div className="lg:border-l lg:pl-4">
                            <DetailSection title="Trilha de Auditoria">
                                <div className="relative pl-6">
                                    {/* Timeline Line */}
                                    <div className="absolute left-2.5 top-2 h-full w-0.5 bg-gray-200"></div>
                                    
                                    {sortedHistory.length > 0 ? sortedHistory.map((entry, index) => (
                                         <div key={index} className="relative mb-4">
                                            {/* Dot */}
                                            <div className="absolute -left-1.5 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 ring-4 ring-brand-light">
                                                <HistoryIcon className="h-3 w-3 text-gray-600" />
                                            </div>
                                            {/* Content */}
                                            <div className="ml-4">
                                                <p className="font-semibold text-text-primary text-sm">{entry.action} <span className="font-normal text-text-secondary">por {entry.user}</span></p>
                                                <time className="text-xs text-gray-500">{new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                                                {entry.details && <p className="text-xs text-gray-600 mt-1">{entry.details}</p>}
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-gray-500">Nenhum histórico registrado.</p>}
                                </div>
                            </DetailSection>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                        {asset.status === 'Em Estoque' && canEdit && (
                            <button onClick={() => setIsCheckoutModalOpen(true)} className="flex items-center text-sm font-medium px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all transform active:scale-95">
                                <CheckOutIcon className="mr-2" /> Realizar Check-out
                            </button>
                        )}
                        {asset.status === 'Ativo' && canEdit &&(
                            <button onClick={handleCheckIn} className="flex items-center text-sm font-medium px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all transform active:scale-95">
                                <CheckInIcon className="mr-2" /> Realizar Check-in
                            </button>
                        )}
                        <button onClick={() => setIsLabelModalOpen(true)} className="flex items-center text-sm font-medium px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-all transform active:scale-95">
                            <TagIcon className="mr-2" /> Gerar Etiqueta
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                             <button onClick={handleCancelEdit} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium transform transition-transform active:scale-95">Cancelar</button>
                             <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 text-sm font-medium transform transition-transform active:scale-95">Salvar</button>
                            </>
                        ) : (
                            <>
                               {canEdit && (
                                    <button onClick={() => setIsEditing(true)} className="flex items-center text-sm font-medium px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all transform active:scale-95">
                                        <EditIcon className="mr-2" /> Editar
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={handleDelete} className="flex items-center text-sm font-medium px-4 py-2 rounded-lg bg-status-red text-white hover:bg-red-700 transition-all transform active:scale-95">
                                        <TrashIcon className="mr-2" /> Excluir
                                    </button>
                                )}
                                 <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 text-sm font-medium transform transition-transform active:scale-95">Fechar</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};