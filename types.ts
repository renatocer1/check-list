
export enum VehicleType {
  Car = 'Carro',
  Bus = 'Ônibus',
  Truck = 'Caminhão',
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  observation?: string;
  imageUrl?: string;
}

export type MaintenanceAlertTrigger = 'km' | 'date';

export interface MaintenanceAlert {
  id:string;
  name: string;
  type: MaintenanceAlertTrigger;
  // For KM-based alerts
  kmInterval?: number;
  lastKm?: number;
  // For date-based alerts
  dateIntervalDays?: number;
  lastDate?: string; // ISO string
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface StopPoint {
  location: LatLng;
  timestamp: string;
  description: string;
}

export interface VehicleConditionItem {
  id: string;
  part: string;
  damageCode: string; // e.g., 'Q', 'R', 'T'
  description: string;
  imageUrl: string;
}

export interface Expense {
  id: string;
  category: 'Pedágio' | 'Alimentação' | 'Hospedagem' | 'Outros';
  amount: number;
  description: string;
  timestamp: string;
}

export interface TripData {
  driverName: string;
  vehicleType: VehicleType;
  plate: string;
  startTime: string; // ISO string for date and time
  initialKm: number;
  finalKm: number;
  fuelAdded: number;
  refuelingCost: number;
  checklist: ChecklistItem[];
  maintenanceAlerts: MaintenanceAlert[];
  // New features
  route: LatLng[];
  stops: StopPoint[];
  vehicleConditions: VehicleConditionItem[];
  expenses: Expense[];
  generalObservations: string;
  driverSignature: string; // Base64 encoded image
}
