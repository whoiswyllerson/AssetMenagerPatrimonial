import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Asset, AssetCategory, AssetStatus } from '../../types';
import { Card } from '../shared/Card';
import { DocumentIcon, PrintIcon, SpinnerIcon } from '../shared/Icons';
import { BulkLabelPrintModal } from '../modals/BulkLabelPrintModal';

interface ReportsViewProps {
  assets: Asset[];
}

interface Filters {
  startDate: string;
  endDate: string;
  category: AssetCategory | 'all';
  status: AssetStatus | 'all';
  location: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ assets }) => {
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    category: 'all',
    status: 'all',
    location: '',
  });
  const [isBulkLabelModalOpen, setIsBulkLabelModalOpen] = useState(false);
  const [exportingType, setExportingType] = useState<'csv' | 'pdf' | null>(null);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: 'all',
      status: 'all',
      location: '',
    });
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const acquisitionDate = new Date(asset.acquisition.purchaseDate);
      if (filters.startDate && acquisitionDate < new Date(filters.startDate)) return false;
      if (filters.endDate && acquisitionDate > new Date(filters.endDate)) return false;
      if (filters.category !== 'all' && asset.category !== filters.category) return false;
      if (filters.status !== 'all' && asset.status !== filters.status) return false;
      if (filters.location && !asset.location.physicalLocation.toLowerCase().includes(filters.location.toLowerCase())) return false;
      return true;
    });
  }, [assets, filters]);

  const exportToCSV = () => {
    const headers = ['ID', 'Nome', 'Categoria', 'Status', 'Localização', 'Responsável', 'Data de Aquisição', 'Valor (R$)'];
    const rows = filteredAssets.map(asset => [
      `"${asset.id}"`,
      `"${asset.name}"`,
      `"${asset.category}"`,
      `"${asset.status}"`,
      `"${asset.location.physicalLocation}"`,
      `"${asset.location.responsible}"`,
      `"${new Date(asset.acquisition.purchaseDate + 'T00:00:00').toLocaleDateString('pt-BR')}"`,
      `"${asset.acquisition.value.toFixed(2)}"`
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_ativos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Ativos", 14, 16);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

    const tableColumn = ["ID", "Nome", "Categoria", "Status", "Localização", "Valor (R$)"];
    const tableRows: (string | number)[][] = [];

    filteredAssets.forEach(asset => {
      const assetData = [
        asset.id,
        asset.name,
        asset.category,
        asset.status,
        asset.location.physicalLocation,
        asset.acquisition.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      ];
      tableRows.push(assetData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [0, 82, 204] }, // brand-primary
    });
    
    doc.save(`relatorio_ativos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    if (exportingType) return;
    setExportingType(type);
    setTimeout(() => {
        if (type === 'csv') {
            exportToCSV();
        } else {
            exportToPDF();
        }
        setExportingType(null);
    }, 500);
  };

  const inputClasses = "w-full p-2 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-sm";

  return (
    <>
      {isBulkLabelModalOpen && (
        <BulkLabelPrintModal
          assets={filteredAssets}
          onClose={() => setIsBulkLabelModalOpen(false)}
        />
      )}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-brand-secondary">Geração de Relatórios</h1>

        <Card>
          <h2 className="text-lg font-semibold text-brand-secondary mb-4 border-b pb-2">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
            <div>
              <label className="text-xs font-medium text-text-secondary">Data de Aquisição (Início)</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputClasses}/>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Data de Aquisição (Fim)</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputClasses}/>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Categoria</label>
              <select name="category" value={filters.category} onChange={handleFilterChange} className={inputClasses}>
                  <option value="all">Todas as Categorias</option>
                  <option value="IT">Informática</option>
                  <option value="Furniture">Mobiliário</option>
                  <option value="Vehicle">Veículos</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Situação</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className={inputClasses}>
                  <option value="all">Todas as Situações</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Em Manutenção">Em Manutenção</option>
                  <option value="Sucateado">Sucateado</option>
                  <option value="Em Estoque">Em Estoque</option>
              </select>
            </div>
            <div className="lg:col-span-3">
              <label className="text-xs font-medium text-text-secondary">Localização</label>
              <input type="text" name="location" value={filters.location} onChange={handleFilterChange} className={inputClasses} placeholder="Pesquisar por Localização..." />
            </div>
            <button onClick={clearFilters} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium text-sm w-full transform transition-transform active:scale-95">Limpar Filtros</button>
          </div>
        </Card>
        
        <Card>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
              <h2 className="text-lg font-semibold text-brand-secondary">Resultados ({filteredAssets.length})</h2>
              <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                  <button 
                      onClick={() => setIsBulkLabelModalOpen(true)}
                      disabled={filteredAssets.length === 0}
                      className="flex items-center px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-all font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transform active:scale-95">
                      <PrintIcon className="w-5 h-5 mr-2" />
                      Imprimir Etiquetas
                  </button>
                  <button onClick={() => handleExport('csv')} disabled={exportingType !== null} className="flex items-center justify-center w-36 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all font-medium text-sm disabled:bg-gray-400 transform active:scale-95">
                      {exportingType === 'csv' ? <SpinnerIcon className="w-5 h-5" /> : <><DocumentIcon className="w-5 h-5 mr-2" /> Exportar CSV</>}
                  </button>
                   <button onClick={() => handleExport('pdf')} disabled={exportingType !== null} className="flex items-center justify-center w-36 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all font-medium text-sm disabled:bg-gray-400 transform active:scale-95">
                      {exportingType === 'pdf' ? <SpinnerIcon className="w-5 h-5" /> : <><DocumentIcon className="w-5 h-5 mr-2" /> Exportar PDF</>}
                  </button>
              </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
              <thead className="text-xs text-text-secondary uppercase bg-brand-light">
                <tr>
                  <th scope="col" className="px-6 py-3">ID</th>
                  <th scope="col" className="px-6 py-3">Nome</th>
                  <th scope="col" className="px-6 py-3">Categoria</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Localização</th>
                  <th scope="col" className="px-6 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className="border-b transition-colors duration-200 hover:bg-brand-accent/10 odd:bg-white even:bg-brand-light">
                    <td className="px-6 py-3 font-medium text-text-primary whitespace-nowrap">{asset.id}</td>
                    <td className="px-6 py-3">{asset.name}</td>
                    <td className="px-6 py-3">{asset.category}</td>
                    <td className="px-6 py-3">{asset.status}</td>
                    <td className="px-6 py-3">{asset.location.physicalLocation}</td>
                    <td className="px-6 py-3">{asset.acquisition.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssets.length === 0 && <p className="p-6 text-center text-gray-500">Nenhum ativo encontrado com os filtros selecionados.</p>}
          </div>
        </Card>
      </div>
    </>
  );
};