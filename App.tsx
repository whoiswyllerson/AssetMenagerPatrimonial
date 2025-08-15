
import React, { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Asset, AssetCategory } from './types';
import { initialAssets } from './data/mockData';
import { DashboardView } from './components/views/DashboardView';
import { AssetListView } from './components/views/AssetListView';
import { AddAssetView } from './components/views/AddAssetView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { InventoryView } from './components/views/InventoryView';

export type View = 'DASHBOARD' | 'FURNITURE' | 'IT' | 'VEHICLES' | 'ADD_ASSET' | 'INVENTORY';

const App: React.FC = () => {
  const [view, setView] = useState<View>('DASHBOARD');
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [searchQuery, setSearchQuery] = useState('');

  const addAsset = (newAsset: Omit<Asset, 'id'>) => {
    const assetWithId = {
      ...newAsset,
      id: `ASSET-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    } as Asset;
    setAssets(prevAssets => [...prevAssets, assetWithId]);
    // After adding, switch to the relevant asset list view
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
              user: 'Admin',
              action: 'Ativo auditado no inventário'
            }
          ]
        };
      }
      return asset;
    }));
  };
  
  const filteredAssets = useMemo(() => {
    if (!searchQuery) return assets;
    return assets.filter(asset =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.location?.physicalLocation && asset.location.physicalLocation.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [assets, searchQuery]);

  const alerts = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const maintenanceAlerts = assets
      .flatMap(asset => 'maintenanceSchedule' in asset ? asset.maintenanceSchedule : ('preventiveMaintenance' in asset ? asset.preventiveMaintenance : []))
      .filter(m => new Date(m.date) > now && new Date(m.date) <= thirtyDaysFromNow)
      .map(m => ({ type: 'Maintenance' as const, message: `Manutenção '${m.type}' agendada para ${new Date(m.date).toLocaleDateString()}` }));

    const licenseAlerts = assets
      .filter(asset => asset.category === 'IT' && 'installedSoftware' in asset)
      .flatMap(asset => (asset as any).installedSoftware)
      .filter((s: any) => s.expiryDate !== 'Perpétua' && new Date(s.expiryDate) > now && new Date(s.expiryDate) <= thirtyDaysFromNow)
      .map((s: any) => ({ type: 'License' as const, message: `Licença do software '${s.name}' expira em ${new Date(s.expiryDate).toLocaleDateString()}` }));
      
    return [...maintenanceAlerts, ...licenseAlerts];
  }, [assets]);

  const renderView = () => {
    const getAssetsByCategory = (category: AssetCategory) => filteredAssets.filter(asset => asset.category === category);

    switch (view) {
      case 'DASHBOARD':
        return <DashboardView assets={filteredAssets} alerts={alerts} />;
      case 'FURNITURE':
        return <AssetListView assets={getAssetsByCategory('Furniture')} category='Mobiliário e Equipamentos' onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} />;
      case 'IT':
        return <AssetListView assets={getAssetsByCategory('IT')} category='Artigos de Informática' onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} />;
      case 'VEHICLES':
        return <AssetListView assets={getAssetsByCategory('Vehicle')} category='Frota de Veículos' onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} />;
      case 'ADD_ASSET':
        return <AddAssetView onAddAsset={addAsset} />;
      case 'INVENTORY':
        return <InventoryView assets={filteredAssets} onAuditAsset={auditAsset} />;
      default:
        return <DashboardView assets={filteredAssets} alerts={alerts} />;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-brand-light font-sans text-text-primary">
        <Sidebar currentView={view} setView={setView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} alerts={alerts} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-light p-6 lg:p-8">
            {renderView()}
          </main>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;
