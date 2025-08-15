
import type { Asset, User, Key } from '../types';

export const mockUsers: User[] = [
  { id: 'user-admin', name: 'Admin', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 'user-roberto', name: 'Roberto Lima', role: 'Gerente de Frota', avatar: 'https://i.pravatar.cc/150?u=roberto' },
  { id: 'user-ana', name: 'Ana Silva', role: 'Colaborador', avatar: 'https://i.pravatar.cc/150?u=ana' },
];

export const mockKeys: Key[] = [
  {
    id: 'CHV-001',
    name: 'Chave do Almoxarifado',
    description: 'Abre a porta principal do almoxarifado no térreo.',
    rfid: 'RFID-A1B2C3D4',
    status: 'Disponível',
    location: {
      storagePoint: 'Claviculário A-01',
      responsible: 'N/A'
    },
    history: [{ date: '2024-01-15', user: 'Admin', action: 'Chave criada', details: 'Chave adicionada ao sistema.' }]
  },
  {
    id: 'CHV-002',
    name: 'Chave da Sala de Servidores',
    description: 'Acesso restrito ao Data Center.',
    rfid: 'RFID-E5F6G7H8',
    status: 'Em Uso',
    location: {
      storagePoint: 'Claviculário A-02',
      responsible: 'Equipe de TI'
    },
    history: [
        { date: '2024-07-20', user: 'Admin', action: 'Check-out', details: 'Retirada pela Equipe de TI para manutenção.' },
        { date: '2024-01-15', user: 'Admin', action: 'Chave criada', details: 'Chave adicionada ao sistema.' }
    ]
  },
  {
    id: 'CHV-003',
    name: 'Chave da Porta da Frente',
    description: 'Abre a porta de entrada principal do escritório.',
    rfid: 'RFID-I9J0K1L2',
    status: 'Perdida',
    location: {
      storagePoint: 'Claviculário B-05',
      responsible: 'Ana Silva'
    },
    history: [
      { date: '2024-06-10', user: 'Admin', action: 'Perda relatada', details: 'Usuária Ana Silva reportou a perda da chave.' },
      { date: '2024-06-01', user: 'Admin', action: 'Check-out', details: 'Retirada por Ana Silva.' },
      { date: '2024-02-01', user: 'Admin', action: 'Chave criada', details: 'Chave adicionada ao sistema.' }
    ]
  }
];

export const initialAssets: Asset[] = [
  {
    id: 'IT-001',
    name: 'Notebook Dell XPS 15',
    description: 'Notebook de alta performance para desenvolvimento.',
    serialNumber: 'DXPS15-9510-12345',
    category: 'IT',
    location: { physicalLocation: 'Sala 301, Mesa 05', responsible: 'Ana Silva' },
    acquisition: { purchaseDate: '2023-05-20', value: 12500, invoice: 'NF-58963', supplier: 'Dell Brasil', usefulLifeInYears: 5, depreciationMethod: 'Linear' },
    status: 'Ativo',
    specs: { processor: 'Intel Core i9-11900H', ram: '32GB DDR4', storage: '1TB NVMe SSD' },
    installedSoftware: [
      { id: 'SW-01', name: 'Windows 11 Pro', licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX', expiryDate: 'Perpétua' },
      { id: 'SW-02', name: 'Microsoft Office 365', licenseKey: 'YYYYY-YYYYY-YYYYY-YYYYY', expiryDate: '2025-05-20' },
    ],
    repairHistory: [],
    history: [{ date: '2023-05-21', user: 'Admin', action: 'Ativo criado' }],
    lastAuditedDate: '2024-07-01',
    identifiers: { qrCode: 'IT-001' },
    allocationHistory: [{ user: 'Ana Silva', startDate: '2023-05-21', endDate: null }],
    contracts: [
      { id: 'CONT-001', type: 'Garantia', supplier: 'Dell Brasil', startDate: '2023-05-20', endDate: '2025-05-19', details: 'Garantia ProSupport Plus' }
    ],
  },
  {
    id: 'IT-002',
    name: 'Servidor PowerEdge R750',
    description: 'Servidor de rack para virtualização.',
    serialNumber: 'PER750-XYZ-9876',
    category: 'IT',
    location: { physicalLocation: 'Data Center, Rack 02', responsible: 'Equipe de TI' },
    acquisition: { purchaseDate: '2022-11-10', value: 45000, invoice: 'NF-41234', supplier: 'Dell Brasil', usefulLifeInYears: 7, depreciationMethod: 'Linear' },
    status: 'Em Manutenção',
    specs: { processor: '2x Intel Xeon Gold 6338', ram: '256GB RDIMM', storage: '10TB SAS RAID 10' },
    installedSoftware: [{ id: 'SW-03', name: 'VMware vSphere 8', licenseKey: 'ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ', expiryDate: '2026-11-10' }],
    repairHistory: [{ id: 'MAINT-01', date: '2024-07-28', type: 'Upgrade de Memória', description: 'Adicionado 128GB de RAM', cost: 8000 }],
    history: [
      { date: '2022-11-11', user: 'Admin', action: 'Ativo criado' },
      { date: '2024-07-28', user: 'Carlos Pereira', action: 'Status alterado para Em Manutenção' }
    ],
    identifiers: { qrCode: 'IT-002' },
    allocationHistory: [],
    contracts: [
      { id: 'CONT-002', type: 'Manutenção', supplier: 'Service TI', startDate: '2023-01-01', endDate: '2024-12-31', details: 'Contrato de manutenção 24/7' }
    ],
  },
  {
    id: 'FUR-001',
    name: 'Cadeira Ergonômica Herman Miller Aeron',
    description: 'Cadeira de escritório ergonômica.',
    serialNumber: 'HM-AERON-B-112233',
    category: 'Furniture',
    location: { physicalLocation: 'Sala 301, Mesa 05', responsible: 'Ana Silva' },
    acquisition: { purchaseDate: '2023-05-20', value: 7800, invoice: 'NF-58964', supplier: 'Office Design', usefulLifeInYears: 10, depreciationMethod: 'Linear' },
    status: 'Ativo',
    photoUrl: 'https://picsum.photos/seed/chair/400/300',
    maintenanceSchedule: [],
    allocationHistory: [{ user: 'Ana Silva', startDate: '2023-05-21', endDate: null }],
    history: [{ date: '2023-05-21', user: 'Admin', action: 'Ativo criado' }],
    lastAuditedDate: '2024-06-15',
    identifiers: { qrCode: 'FUR-001' },
    contracts: [],
  },
  {
    id: 'FUR-002',
    name: 'Mesa de Reunião 8 Lugares',
    description: 'Mesa de madeira maciça para sala de conferências.',
    serialNumber: 'MR-CONF-001',
    category: 'Furniture',
    location: { physicalLocation: 'Sala de Conferências A', responsible: 'Gestão de Facilities' },
    acquisition: { purchaseDate: '2021-02-15', value: 4500, invoice: 'NF-10587', supplier: 'Móveis Corporativos SA' },
    status: 'Ativo',
    photoUrl: 'https://picsum.photos/seed/table/400/300',
    maintenanceSchedule: [{ id: 'MAINT-FUR-01', date: '2024-08-15', type: 'Limpeza e Polimento', description: 'Limpeza profissional agendada.', cost: 300 }],
    allocationHistory: [],
     history: [{ date: '2021-02-15', user: 'Admin', action: 'Ativo criado' }],
     contracts: [],
  },
  {
    id: 'VEH-001',
    name: 'Toyota Corolla Cross',
    description: 'Veículo para diretoria comercial.',
    serialNumber: 'CHASSI-9BR-XYZ-123',
    category: 'Vehicle',
    location: { physicalLocation: 'Garagem - Vaga 21', responsible: 'Roberto Lima' },
    acquisition: { purchaseDate: '2023-08-01', value: 195000, invoice: 'NF-98765', supplier: 'Toyota Tsusho', usefulLifeInYears: 8, depreciationMethod: 'Linear' },
    status: 'Ativo',
    vehicleData: { plate: 'SDE2F45', renavam: '12345678901', model: 'Corolla Cross XRE', year: 2023, marketValue: 185000 },
    documentation: { ipvaDueDate: '2025-03-31', licensingDueDate: '2025-04-30', insuranceExpiry: '2025-08-01' },
    preventiveMaintenance: [{ id: 'MAINT-VEH-01', date: '2024-08-01', type: 'Revisão 10.000km', description: 'Troca de óleo e filtros.', cost: 850 }],
    fuelLogs: [
      { id: 'FUEL-01', date: '2024-07-15', cost: 250, liters: 42, station: 'Posto Shell', odometer: 9850 },
      { id: 'FUEL-02', date: '2024-07-25', cost: 260, liters: 43.5, station: 'Posto Ipiranga', odometer: 10400 },
    ],
    history: [{ date: '2023-08-01', user: 'Admin', action: 'Ativo criado' }],
    identifiers: { qrCode: 'VEH-001' },
    allocationHistory: [{ user: 'Roberto Lima', startDate: '2023-08-01', endDate: null }],
    contracts: [
      { id: 'CONT-003', type: 'Seguro', supplier: 'Porto Seguro', startDate: '2023-08-01', endDate: '2024-08-01', details: 'Apólice Nº 987654' }
    ],
  },
  {
    id: 'IT-003',
    name: 'Monitor Gamer Alienware 34"',
    description: 'Monitor ultrawide para design gráfico.',
    serialNumber: 'AW3423DW-7890',
    category: 'IT',
    location: { physicalLocation: 'Sala 210, Mesa 12', responsible: 'Julia Costa' },
    acquisition: { purchaseDate: '2024-01-10', value: 6200, invoice: 'NF-75312', supplier: 'Dell Brasil' },
    status: 'Ativo',
    specs: { processor: 'N/A', ram: 'N/A', storage: 'N/A' },
    installedSoftware: [],
    repairHistory: [],
    history: [{ date: '2024-01-10', user: 'Admin', action: 'Ativo criado' }],
    identifiers: { qrCode: 'IT-003' },
    allocationHistory: [{ user: 'Julia Costa', startDate: '2024-01-10', endDate: null }],
    contracts: [],
  },
   {
    id: 'FUR-003',
    name: 'Armário de Arquivos',
    description: 'Armário de aço com 4 gavetas.',
    serialNumber: 'ARQ-STEEL-4G-4455',
    category: 'Furniture',
    location: { physicalLocation: 'Almoxarifado', responsible: 'Gestão de Facilities' },
    acquisition: { purchaseDate: '2020-07-22', value: 890, invoice: 'NF-08876', supplier: 'Staples' },
    status: 'Em Estoque',
    photoUrl: 'https://picsum.photos/seed/cabinet/400/300',
    maintenanceSchedule: [],
    allocationHistory: [],
    history: [{ date: '2020-07-22', user: 'Admin', action: 'Ativo criado' }],
    contracts: [],
  },
];