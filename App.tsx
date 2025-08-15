
import React, { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Asset, AssetCategory, User, Key } from './types';
import { initialAssets, mockKeys, mockUsers } from './data/mockData';
import { DashboardView } from './components/views/DashboardView';
import { AssetListView } from './components/views/AssetListView';
import { AddAssetView } from './components/views/AddAssetView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { InventoryView } from './components/views/InventoryView';
import { ReportsView } from './components/views/ReportsView';
import { AssetDetailsModal } from './components/modals/AssetDetailsModal';
import { QRScannerModal } from './components/modals/QRScannerModal';
import { KeyManagementView } from './components/views/KeyManagementView';

export type View = 'DASHBOARD' | 'FURNITURE' | 'IT' | 'VEHICLES' | 'ADD_ITEM' | 'INVENTORY' | 'REPORTS' | 'KEY_MANAGEMENT';

const App: React.FC = () => {
  const [view, setView] = useState<View>('DASHBOARD');
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [keys, setKeys] = useState<Key[]>(mockKeys);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState(false);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    setView('DASHBOARD');
  };

  const addAsset = (newAsset: Omit<Asset, 'id' | 'history'>) => {
    const assetWithId = {
      ...newAsset,
      id: `ASSET-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      history: [{ date: new Date().toISOString().split('T')[0], user: currentUser.name, action: 'Ativo criado' }],
    } as Asset;
    setAssets(prevAssets => [...prevAssets, assetWithId]);
    switch(assetWithId.category) {
      case 'Furniture': setView('FURNITURE'); break;
      case 'IT': setView('IT'); break;
      case 'Vehicle': setView('VEHICLES'); break;
    }
  };

  const updateAsset = (updatedAsset: Asset) => {
    setAssets(prevAssets => prevAssets.map(asset => asset.id === updatedAsset.id ? updatedAsset : asset));
  };

  const deleteAsset = (assetId: string) => {
    setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetId));
  };

  const addKey = (newKey: Omit<Key, 'id' | 'history'>) => {
    const keyWithId = { 
      ...newKey, 
      id: `KEY-${Date.now()}`,
      history: [{ date: new Date().toISOString().split('T')[0], user: currentUser.name, action: 'Chave criada', details: `Chave "${newKey.name}" adicionada ao sistema.` }],
    };
    setKeys(prev => [...prev, keyWithId]);
    setView('KEY_MANAGEMENT');
  };
  const updateKey = (updatedKey: Key) => {
    setKeys(prev => prev.map(key => key.id === updatedKey.id ? updatedKey : key));
  };
  const deleteKey = (keyId: string) => {
    setKeys(prev => prev.filter(key => key.id !== keyId));
  };

  const auditAsset = (assetId: string) => {
    setAssets(prevAssets => prevAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          lastAuditedDate: new Date().toISOString().split('T')[0],
          history: [
            ...asset.history,
            {
              date: new Date().toISOString().split('T')[0],
              user: currentUser.name,
              action: 'Ativo auditado no inventário'
            }
          ]
        };
      }
      return asset;
    }));
  };
  
  const selectedAsset = useMemo(() => {
    return selectedAssetId ? assets.find(a => a.id === selectedAssetId) : null;
  }, [assets, selectedAssetId]);

  const handleGlobalScanSuccess = (decodedText: string) => {
    setIsGlobalScannerOpen(false);
    const assetToScan = assets.find(
      asset => asset.id === decodedText ||
               asset.serialNumber === decodedText ||
               asset.identifiers?.barcode === decodedText ||
               asset.identifiers?.qrCode === decodedText
    );

    if (assetToScan) {
      setSelectedAssetId(assetToScan.id);
    } else {
      alert(`Ativo com código "${decodedText}" não encontrado.`);
    }
  };

  const assetsForUser = useMemo(() => {
    switch (currentUser.role) {
      case 'Admin':
        return assets;
      case 'Gerente de Frota':
        return assets.filter(asset => asset.category === 'Vehicle');
      case 'Colaborador':
        return assets.filter(asset => asset.location.responsible === currentUser.name);
      default:
        return [];
    }
  }, [assets, currentUser]);

  const filteredAssets = useMemo(() => {
    if (!searchQuery) return assetsForUser;
    return assetsForUser.filter(asset =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.location?.physicalLocation && asset.location.physicalLocation.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [assetsForUser, searchQuery]);

  const alerts = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const maintenanceAlerts = assetsForUser
      .flatMap(asset => 'maintenanceSchedule' in asset ? asset.maintenanceSchedule : ('preventiveMaintenance' in asset ? asset.preventiveMaintenance : []))
      .filter(m => new Date(m.date) > now && new Date(m.date) <= thirtyDaysFromNow)
      .map(m => ({ type: 'Maintenance' as const, message: `Manutenção '${m.type}' agendada para ${new Date(m.date).toLocaleDateString()}`, responsible: 'N/A' }));

    const licenseAlerts = assetsForUser
      .filter(asset => asset.category === 'IT' && 'installedSoftware' in asset)
      .flatMap(asset => (asset as any).installedSoftware.map((s: any) => ({ ...s, responsible: asset.location.responsible })))
      .filter((s: any) => s.expiryDate !== 'Perpétua' && new Date(s.expiryDate) > now && new Date(s.expiryDate) <= thirtyDaysFromNow)
      .map((s: any) => ({ type: 'License' as const, message: `Licença do software '${s.name}' expira em ${new Date(s.expiryDate).toLocaleDateString()}`, responsible: s.responsible }));
      
    const contractAlerts = assetsForUser
      .filter(asset => asset.contracts && asset.contracts.length > 0)
      .flatMap(asset => asset.contracts!.map(c => ({...c, assetName: asset.name, responsible: asset.location.responsible})))
      .filter(c => new Date(c.endDate) > now && new Date(c.endDate) <= thirtyDaysFromNow)
      .map(c => ({ type: 'Contract' as const, message: `O contrato '${c.type}' para o ativo '${c.assetName}' expira em ${new Date(c.endDate).toLocaleDateString()}`, responsible: c.responsible }));

    return [...maintenanceAlerts, ...licenseAlerts, ...contractAlerts];
  }, [assetsForUser]);

  const renderView = () => {
    const getAssetsByCategory = (category: AssetCategory) => filteredAssets.filter(asset => asset.category === category);

    switch (view) {
      case 'DASHBOARD':
        return <DashboardView assets={filteredAssets} alerts={alerts} />;
      case 'FURNITURE':
        return <AssetListView assets={getAssetsByCategory('Furniture')} category='Mobiliário e Equipamentos' onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} currentUser={currentUser} onShowDetails={setSelectedAssetId} />;
      case 'IT':
        return <AssetListView assets={getAssetsByCategory('IT')} category='Artigos de Informática' onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} currentUser={currentUser} onShowDetails={setSelectedAssetId} />;
      case 'VEHICLES':
        return <AssetListView assets={getAssetsByCategory('Vehicle')} category='Frota de Veículos' onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} currentUser={currentUser} onShowDetails={setSelectedAssetId} />;
      case 'ADD_ITEM':
        return <AddAssetView onAddAsset={addAsset} onAddKey={addKey} />;
      case 'INVENTORY':
        return <InventoryView assets={filteredAssets} onAuditAsset={auditAsset} />;
      case 'REPORTS':
        return <ReportsView assets={filteredAssets} />;
      case 'KEY_MANAGEMENT':
        return <KeyManagementView keys={keys} onUpdateKey={updateKey} onDeleteKey={deleteKey} currentUser={currentUser} />;
      default:
        return <DashboardView assets={filteredAssets} alerts={alerts} />;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-brand-light font-sans text-text-primary">
        <Sidebar currentView={view} setView={setView} currentUser={currentUser} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} alerts={alerts} currentUser={currentUser} users={mockUsers} onUserChange={handleSetCurrentUser} onScanClick={() => setIsGlobalScannerOpen(true)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-light p-6 lg:p-8">
            {renderView()}
          </main>
        </div>
        {selectedAsset && (
          <AssetDetailsModal 
            asset={selectedAsset} 
            onClose={() => setSelectedAssetId(null)}
            onUpdate={updateAsset}
            onDelete={deleteAsset}
            currentUser={currentUser}
          />
        )}
        {isGlobalScannerOpen && (
          <QRScannerModal
            onClose={() => setIsGlobalScannerOpen(false)}
            onScanSuccess={handleGlobalScanSuccess}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default App;
