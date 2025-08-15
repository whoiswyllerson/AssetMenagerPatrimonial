export type AssetCategory = 'IT' | 'Furniture' | 'Vehicle';
export type AssetStatus = 'Ativo' | 'Em Manutenção' | 'Sucateado' | 'Em Estoque';
export type ContractType = 'Garantia' | 'Manutenção' | 'Seguro';
export type UserRole = 'Admin' | 'Gerente de Frota' | 'Colaborador';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Location {
  physicalLocation: string;
  responsible: string;
}

export interface Acquisition {
  purchaseDate: string;
  value: number;
  invoice: string;
  supplier: string;
  usefulLifeInYears?: number;
  depreciationMethod?: 'Linear';
}

export interface Maintenance {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number;
}

export interface SoftwareLicense {
  id: string;
  name: string;
  licenseKey: string;
  expiryDate: string;
}

export interface FuelLog {
  id: string;
  date: string;
  cost: number;
  liters: number;
  station: string;
  odometer: number;
}

export interface Contract {
  id: string;
  type: ContractType;
  supplier: string;
  startDate: string;
  endDate: string;
  details?: string;
}

interface BaseAsset {
  id: string;
  name: string;
  description: string;
  serialNumber: string;
  category: AssetCategory;
  location: Location;
  acquisition: Acquisition;
  status: AssetStatus;
  identifiers?: {
    rfid?: string;
    barcode?: string;
    qrCode?: string;
  };
  history: {
    date: string;
    user: string;
    action: string;
  }[];
  lastAuditedDate?: string;
  photoUrl?: string;
  documentUrl?: string;
  documentName?: string;
  allocationHistory: { user: string; startDate: string; endDate: string | null }[];
  contracts?: Contract[];
}

export interface FurnitureAsset extends BaseAsset {
  category: 'Furniture';
  maintenanceSchedule: Maintenance[];
}

export interface ITAsset extends BaseAsset {
  category: 'IT';
  specs: {
    processor: string;
    ram: string;
    storage: string;
  };
  installedSoftware: SoftwareLicense[];
  repairHistory: Maintenance[];
}

export interface VehicleAsset extends BaseAsset {
  category: 'Vehicle';
  vehicleData: {
    plate: string;
    renavam: string;
    model: string;
    year: number;
    marketValue: number;
  };
  documentation: {
    ipvaDueDate: string;
    licensingDueDate: string;

    insuranceExpiry: string;
  };
  preventiveMaintenance: Maintenance[];
  fuelLogs: FuelLog[];
}

export type Asset = FurnitureAsset | ITAsset | VehicleAsset;