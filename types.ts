
export type AssetCategory = 'IT' | 'Furniture' | 'Vehicle';
export type AssetStatus = 'Ativo' | 'Em Manutenção' | 'Sucateado' | 'Em Estoque';

export interface Location {
  physicalLocation: string;
  responsible: string;
}

export interface Acquisition {
  purchaseDate: string;
  value: number;
  invoice: string;
  supplier: string;
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
}

export interface FurnitureAsset extends BaseAsset {
  category: 'Furniture';
  photoUrl: string;
  maintenanceSchedule: Maintenance[];
  allocationHistory: { user: string; startDate: string; endDate: string | null }[];
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
