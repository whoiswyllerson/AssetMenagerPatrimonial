import React, { useState, useMemo } from 'react';
import type { Asset } from '../../types';
import { Card } from '../shared/Card';
import { CheckCircleIcon, QrCodeIcon } from '../shared/Icons';
import { QRScannerModal } from '../modals/QRScannerModal';

interface InventoryViewProps {
  assets: Asset[];
  onAuditAsset: (assetId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ assets, onAuditAsset }) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const locations = useMemo(() => {
    const allLocations = assets.map(asset => asset.location.physicalLocation);
    return ['all', ...Array.from(new Set(allLocations))];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (selectedLocation === 'all') {
      return assets;
    }
    return assets.filter(asset => asset.location.physicalLocation === selectedLocation);
  }, [assets, selectedLocation]);

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    const assetToAudit = assets.find(
      asset => asset.id === decodedText ||
               asset.serialNumber === decodedText ||
               asset.identifiers?.barcode === decodedText ||
               asset.identifiers?.qrCode === decodedText
    );

    if (assetToAudit) {
      onAuditAsset(assetToAudit.id);
      alert(`Ativo "${assetToAudit.name}" auditado com sucesso!`);
    } else {
      alert(`Ativo com código "${decodedText}" não encontrado.`);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brand-secondary">Inventário e Auditoria</h1>
      
      {isScannerOpen && (
        <QRScannerModal 
            onClose={() => setIsScannerOpen(false)}
            onScanSuccess={handleScanSuccess}
        />
      )}

      <Card>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
                <div>
                    <label htmlFor="location-filter" className="text-sm font-medium text-text-secondary mr-2">Filtrar por Localização:</label>
                    <select
                      id="location-filter"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="p-2 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                    >
                      <option value="all">Todas as Localizações</option>
                      {locations.filter(l => l !== 'all').map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                </div>
                <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="flex items-center px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent transition-colors"
                >
                    <QrCodeIcon className="w-5 h-5 mr-2"/>
                    Escanear Código do Ativo
                </button>
            </div>
            <p className="text-sm text-text-secondary font-medium">
                Exibindo {filteredAssets.length} de {assets.length} ativos.
            </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-secondary uppercase bg-brand-light">
              <tr>
                <th scope="col" className="px-6 py-3">Ativo</th>
                <th scope="col" className="px-6 py-3">Localização Esperada</th>
                <th scope="col" className="px-6 py-3">Última Auditoria</th>
                <th scope="col" className="px-6 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => {
                const wasAuditedToday = asset.lastAuditedDate === today;
                return (
                  <tr key={asset.id} className={`border-b transition-colors ${wasAuditedToday ? 'bg-green-50' : 'bg-white hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {asset.name}
                      <span className="block text-xs text-text-secondary">{asset.id}</span>
                    </td>
                    <td className="px-6 py-4">{asset.location.physicalLocation}</td>
                    <td className="px-6 py-4">
                      {asset.lastAuditedDate ? new Date(asset.lastAuditedDate + 'T00:00:00').toLocaleDateString() : 'Nunca auditado'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {wasAuditedToday ? (
                        <div className="flex items-center justify-center text-status-green">
                          <CheckCircleIcon className="w-5 h-5 mr-1" />
                          <span>Auditado Hoje</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAuditAsset(asset.id)}
                          className="px-3 py-1 rounded-md bg-brand-primary text-white text-xs font-semibold hover:bg-brand-accent transition-colors disabled:bg-gray-300"
                        >
                          Marcar como Encontrado
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAssets.length === 0 && <p className="p-6 text-center text-gray-500">Nenhum ativo encontrado para esta localização.</p>}
        </div>
      </Card>
    </div>
  );
};