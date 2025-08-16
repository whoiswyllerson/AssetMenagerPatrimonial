

import React, { useState, useMemo, useRef } from 'react';
import type { Key, KeyStatus, User, ToastType } from '../../types';
import { Card } from '../shared/Card';
import { KeyIcon, CheckInIcon, CheckOutIcon, ExclamationTriangleIcon, AddAssetIcon } from '../shared/Icons';

interface KeyManagementViewProps {
    keys: Key[];
    onUpdateKey: (updatedKey: Key) => void;
    onDeleteKey: (keyId: string) => void;
    currentUser: User;
    addToast: (message: string, type?: ToastType) => void;
    onNavigateToAddKey: () => void;
}

const KeyForm: React.FC<{
    onSave: (key: Omit<Key, 'id' | 'history' | 'status' | 'location'>) => void;
    onCancel: () => void;
    initialData?: Omit<Key, 'id' | 'history' | 'status' | 'location'>;
}> = ({ onSave, onCancel, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [rfid, setRfid] = useState(initialData?.rfid || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && description) {
            onSave({ name, description, rfid });
        }
    };
    
    const inputClasses = "w-full p-2 border border-gray-200 rounded bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all";

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-brand-light/50 rounded-lg space-y-4">
            <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome da Chave (ex: Chave Sala 101)"
                className={inputClasses}
                required
            />
            <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descrição (ex: Abre a porta principal da sala de reuniões)"
                className={inputClasses}
                required
            />
            <input
                type="text"
                value={rfid}
                onChange={e => setRfid(e.target.value)}
                placeholder="Código RFID (Opcional)"
                className={inputClasses}
            />
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded transform transition-transform active:scale-95">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded transform transition-transform active:scale-95">Salvar</button>
            </div>
        </form>
    );
};

const KpiCard: React.FC<{ title: string; value: number; }> = ({ title, value }) => (
  <Card className="text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
    <p className="text-3xl font-bold text-brand-primary">{value}</p>
    <p className="text-sm text-text-secondary font-medium">{title}</p>
  </Card>
);

export const KeyManagementView: React.FC<KeyManagementViewProps> = ({ keys, onUpdateKey, onDeleteKey, currentUser, addToast, onNavigateToAddKey }) => {
    const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
    const [rfidSearch, setRfidSearch] = useState('');
    const [foundKeyId, setFoundKeyId] = useState<string | null>(null);
    const keyRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

    const kpis = useMemo(() => ({
        total: keys.length,
        available: keys.filter(k => k.status === 'Disponível').length,
        inUse: keys.filter(k => k.status === 'Em Uso').length,
    }), [keys]);

    const handleRfidSearch = () => {
        if (!rfidSearch.trim()) {
            setFoundKeyId(null);
            return;
        }
        const foundKey = keys.find(key => key.rfid === rfidSearch.trim());
        if (foundKey) {
            setFoundKeyId(foundKey.id);
            addToast(`Chave "${foundKey.name}" localizada.`, 'success');
            const keyElement = keyRefs.current[foundKey.id];
            if (keyElement) {
                keyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            addToast(`Nenhuma chave encontrada com o RFID: ${rfidSearch}`, 'error');
            setFoundKeyId(null);
        }
    };

    const getStatusColor = (status: KeyStatus) => {
        switch (status) {
            case 'Disponível': return 'bg-status-green/10 text-status-green';
            case 'Em Uso': return 'bg-status-yellow/10 text-status-yellow';
            case 'Perdida': return 'bg-status-red/10 text-status-red';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleAction = (key: Key, action: 'check-in' | 'check-out' | 'report-lost') => {
        const today = new Date().toISOString().split('T')[0];
        let updatedKey = { ...key };

        if (action === 'check-out') {
            const responsible = window.prompt(`Quem está retirando a chave "${key.name}"?`);
            if (responsible) {
                updatedKey.status = 'Em Uso';
                updatedKey.location.responsible = responsible;
                updatedKey.history.unshift({ date: today, user: currentUser.name, action: 'Check-out', details: `Retirada por ${responsible}.` });
                onUpdateKey(updatedKey);
                addToast(`Check-out da chave "${key.name}" para ${responsible}.`, 'info');
            }
        } else if (action === 'check-in') {
            if (window.confirm(`Confirmar a devolução da chave "${key.name}"?`)) {
                updatedKey.status = 'Disponível';
                const previousResponsible = updatedKey.location.responsible;
                updatedKey.location.responsible = 'N/A';
                updatedKey.history.unshift({ date: today, user: currentUser.name, action: 'Check-in', details: `Devolvida por ${previousResponsible}.` });
                onUpdateKey(updatedKey);
                addToast(`Chave "${key.name}" devolvida com sucesso.`, 'success');
            }
        } else if (action === 'report-lost') {
            if (window.confirm(`Tem certeza que deseja relatar a perda da chave "${key.name}"? Esta ação não pode ser desfeita.`)) {
                updatedKey.status = 'Perdida';
                updatedKey.history.unshift({ date: today, user: currentUser.name, action: 'Perda relatada', details: `Perda relatada pelo usuário.` });
                onUpdateKey(updatedKey);
                addToast(`Perda da chave "${key.name}" foi registrada.`, 'error');
            }
        }
    };
    
    const handleSaveUpdateKey = (key: Key, updatedData: Omit<Key, 'id' | 'history' | 'status' | 'location'>) => {
        const updatedKey: Key = {
            ...key,
            ...updatedData,
            history: [
                { date: new Date().toISOString().split('T')[0], user: currentUser.name, action: 'Edição', details: 'Dados da chave atualizados.' },
                ...key.history
            ]
        };
        onUpdateKey(updatedKey);
        addToast(`Chave "${key.name}" atualizada com sucesso.`, 'success');
        setEditingKeyId(null);
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-brand-secondary">Controle de Chaves Físicas</h1>
              {currentUser.role === 'Admin' && (
                <button
                    onClick={onNavigateToAddKey}
                    className="flex items-center px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent transition-all font-medium text-sm transform active:scale-95"
                >
                    <AddAssetIcon className="w-5 h-5 mr-2" />
                    Cadastrar Chave
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total de Chaves" value={kpis.total} />
                <KpiCard title="Chaves Disponíveis" value={kpis.available} />
                <KpiCard title="Chaves em Uso" value={kpis.inUse} />
            </div>

            <Card>
                <h2 className="text-lg font-semibold text-brand-secondary mb-4">Localizador RFID de Chaves</h2>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={rfidSearch}
                        onChange={e => setRfidSearch(e.target.value)}
                        placeholder="Digite o código RFID"
                        className="flex-grow p-2 border border-gray-200 rounded-lg bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                    />
                    <button onClick={handleRfidSearch} className="px-4 py-2 bg-brand-primary text-white rounded-lg transform transition-transform active:scale-95">Localizar</button>
                </div>
                {foundKeyId && <p className="text-sm text-green-600 mt-2">Chave encontrada e destacada abaixo.</p>}
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-brand-secondary">Inventário de Chaves</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-secondary uppercase bg-brand-light">
                      <tr>
                        <th scope="col" className="px-6 py-3">Chave / RFID</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Local/Responsável</th>
                        <th scope="col" className="px-6 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map(key => (
                        <tr
                            key={key.id}
                            ref={el => { keyRefs.current[key.id] = el; }}
                            className={`border-b transition-all duration-500 ${foundKeyId === key.id ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-white hover:bg-gray-50'}`}
                        >
                            {editingKeyId === key.id ? (
                                <td colSpan={4} className="p-0">
                                    <KeyForm
                                        initialData={key}
                                        onSave={(updatedData) => handleSaveUpdateKey(key, updatedData)}
                                        onCancel={() => setEditingKeyId(null)}
                                    />
                                </td>
                            ) : (
                                <>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-text-primary">{key.name}</p>
                                        <p className="text-xs">{key.description}</p>
                                        {key.rfid && <p className="text-xs text-blue-500 mt-1 font-mono">RFID: {key.rfid}</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(key.status)}`}>
                                            {key.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{key.status === 'Disponível' ? key.location.storagePoint : key.location.responsible}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            {key.status === 'Disponível' && (
                                                <button onClick={() => handleAction(key, 'check-out')} title="Check-out" className="p-2 text-gray-500 hover:text-brand-primary rounded-full hover:bg-gray-100 transform transition-transform active:scale-95"><CheckOutIcon /></button>
                                            )}
                                            {key.status === 'Em Uso' && (
                                                <button onClick={() => handleAction(key, 'check-in')} title="Check-in" className="p-2 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100 transform transition-transform active:scale-95"><CheckInIcon /></button>
                                            )}
                                            {key.status !== 'Perdida' && (
                                                 <button onClick={() => handleAction(key, 'report-lost')} title="Relatar Perda" className="p-2 text-gray-500 hover:text-status-red rounded-full hover:bg-gray-100 transform transition-transform active:scale-95"><ExclamationTriangleIcon /></button>
                                            )}
                                            <button onClick={() => setEditingKeyId(key.id)} className="text-xs font-medium text-blue-600 hover:underline">Editar</button>
                                        </div>
                                    </td>
                                </>
                            )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </Card>
        </div>
    );
};