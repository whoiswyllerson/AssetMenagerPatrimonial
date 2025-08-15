import React, { useMemo } from 'react';
import type { Asset } from '../../types';
import { Card } from '../shared/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExclamationTriangleIcon, DashboardIcon, CalculatorIcon, BellIcon, WrenchIcon, ContractIcon } from '../shared/Icons';

interface Alert {
  type: 'Maintenance' | 'License' | 'Contract';
  message: string;
  responsible: string;
}

interface DashboardViewProps {
  assets: Asset[];
  alerts: Alert[];
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Card className="flex items-center p-4">
    <div className="p-3 bg-brand-accent/10 rounded-full mr-4">
      {icon}
    </div>
    <div>
      <p className="text-sm text-text-secondary font-medium">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </Card>
);

const AlertIcon: React.FC<{ type: Alert['type'] }> = ({ type }) => {
    switch (type) {
        case 'Maintenance': return <WrenchIcon className="w-5 h-5 text-status-yellow mr-3 mt-1 flex-shrink-0" />;
        case 'License': return <ExclamationTriangleIcon className="w-5 h-5 text-status-red mr-3 mt-1 flex-shrink-0" />;
        case 'Contract': return <ContractIcon className="w-5 h-5 text-status-yellow mr-3 mt-1 flex-shrink-0" />;
        default: return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />;
    }
};

const getAlertColors = (type: Alert['type']) => {
    switch (type) {
        case 'Maintenance':
        case 'Contract':
            return {
                container: 'bg-yellow-50 border-yellow-200',
                text: 'text-yellow-800'
            };
        case 'License':
            return {
                container: 'bg-red-50 border-red-200',
                text: 'text-red-800'
            };
        default:
            return {
                container: 'bg-gray-50 border-gray-200',
                text: 'text-gray-800'
            };
    }
};

const calculateDepreciation = (asset: Asset) => {
    if (!asset.acquisition.usefulLifeInYears || asset.acquisition.usefulLifeInYears <= 0 || asset.acquisition.depreciationMethod !== 'Linear') {
        return { accumulatedDepreciation: 0 };
    }

    const { value: cost, purchaseDate, usefulLifeInYears } = asset.acquisition;
    const annualDepreciation = cost / usefulLifeInYears;

    const purchase = new Date(purchaseDate + 'T00:00:00');
    const now = new Date();

    if (now < purchase) return { accumulatedDepreciation: 0 };

    const diffTime = Math.abs(now.getTime() - purchase.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const elapsedYears = diffDays / 365.25;

    const accumulatedDepreciation = Math.min(annualDepreciation * elapsedYears, cost);
    
    return { accumulatedDepreciation };
};


export const DashboardView: React.FC<DashboardViewProps> = ({ assets, alerts }) => {
  const kpis = useMemo(() => {
    const totalValue = assets.reduce((sum, asset) => sum + asset.acquisition.value, 0);
    const totalDepreciation = assets.reduce((sum, asset) => {
        const { accumulatedDepreciation } = calculateDepreciation(asset);
        return sum + accumulatedDepreciation;
    }, 0);
    
    return {
      totalAssets: assets.length,
      totalValue: totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalDepreciation: totalDepreciation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      activeAlerts: alerts.length,
    };
  }, [assets, alerts]);

  const categoryData = useMemo(() => {
    const counts = assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const statusData = useMemo(() => {
    const counts = assets.reduce((acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [assets]);
  
  const depreciationByCategoryData = useMemo(() => {
    const data = assets.reduce((acc, asset) => {
      const { accumulatedDepreciation } = calculateDepreciation(asset);
      if (accumulatedDepreciation > 0) {
        const categoryName = asset.category === 'IT' ? 'Informática' : asset.category === 'Furniture' ? 'Mobiliário' : 'Veículos';
        acc[categoryName] = (acc[categoryName] || 0) + accumulatedDepreciation;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [assets]);


  const COLORS = ['#0052CC', '#4C9AFF', '#091E42', '#5E6C84'];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brand-secondary">Dashboard</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total de Ativos" value={kpis.totalAssets} icon={<DashboardIcon className="h-6 w-6 text-brand-primary" />} />
        <KpiCard title="Valor Total de Aquisição" value={kpis.totalValue} icon={<span className="text-2xl font-bold text-brand-primary">R$</span>} />
        <KpiCard title="Total Depreciado" value={kpis.totalDepreciation} icon={<CalculatorIcon className="h-6 w-6 text-brand-primary" />} />
        <KpiCard title="Alertas Ativos" value={kpis.activeAlerts} icon={<BellIcon className="h-6 w-6 text-brand-primary" />} />
      </div>

      {/* Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-brand-secondary mb-4">Ativos por Categoria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} ativos`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        
        <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-brand-secondary mb-4">Ativos por Situação</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{fill: 'rgba(76, 154, 255, 0.1)'}} />
                    <Legend />
                    <Bar dataKey="value" name="Número de Ativos" fill="#0052CC" barSize={40} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-secondary mb-4">Depreciação Acumulada por Categoria</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={depreciationByCategoryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} />
            <Tooltip 
              cursor={{fill: 'rgba(255, 171, 0, 0.1)'}}
              formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            />
            <Bar dataKey="value" name="Depreciação Acumulada" fill="#FFAB00" barSize={40} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-brand-secondary mb-4 flex items-center">
          <BellIcon className="w-6 h-6 mr-2 text-brand-primary" /> Alertas e Próximas Ações
        </h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {alerts.length > 0 ? alerts.map((alert, index) => {
            const colors = getAlertColors(alert.type);
            return (
                <div key={index} className={`flex items-start p-3 rounded-lg border ${colors.container}`}>
                    <AlertIcon type={alert.type} />
                  <p className={`text-sm ${colors.text}`}>{alert.message}</p>
                </div>
            );
          }) : (
            <p className="text-text-secondary text-sm">Nenhum alerta para os próximos 30 dias.</p>
          )}
        </div>
      </Card>
    </div>
  );
};