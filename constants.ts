import { ChecklistItem } from './types';

export const CHECKLIST_ITEMS: Record<string, Omit<ChecklistItem, 'checked'>[]> = {
  Carro: [
    { id: 'tires', label: 'Pneus (calibragem e estado)' },
    { id: 'lights', label: 'Faróis e Lanternas' },
    { id: 'oil', label: 'Nível de Óleo' },
    { id: 'water', label: 'Nível de Água/Refrigerante' },
    { id: 'brakes', label: 'Freios' },
    { id: 'documents', label: 'Documentos do Veículo' },
    { id: 'stepe', label: 'Estepe e Ferramentas' },
  ],
  Ônibus: [
    { id: 'tires', label: 'Pneus (calibragem e estado)' },
    { id: 'lights', label: 'Faróis e Lanternas' },
    { id: 'oil', label: 'Nível de Óleo' },
    { id: 'water', label: 'Nível de Água/Refrigerante' },
    { id: 'brakes', label: 'Freios (incluindo freio motor)' },
    { id: 'documents', label: 'Documentos do Veículo e Tacógrafo' },
    { id: 'accessibility', label: 'Equipamentos de Acessibilidade' },
    { id: 'emergency_exit', label: 'Saídas de Emergência' },
    { id: 'seats', label: 'Assentos e Cintos de Segurança' },
  ],
  Caminhão: [
    { id: 'tires', label: 'Pneus (calibragem e estado)' },
    { id: 'lights', label: 'Faróis e Lanternas' },
    { id: 'oil', label: 'Nível de Óleo' },
    { id: 'water', label: 'Nível de Água/Refrigerante' },
    { id: 'brakes', label: 'Freios (incluindo freio motor)' },
    { id: 'documents', label: 'Documentos do Veículo e Carga' },
    { id: 'cargo_securing', label: 'Amarração da Carga' },
    { id: 'fifth_wheel', label: 'Quinta Roda (se aplicável)' },
    { id: 'air_tanks', label: 'Reservatórios de Ar' },
  ],
};

export const VEHICLE_CONDITION_CODES = {
  'Q': 'Quebrado',
  'R': 'Riscado',
  'T': 'Trincado',
  'A': 'Amassado',
  'F': 'Faltando',
};
