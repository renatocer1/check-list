
import React, { useState } from 'react';
import { VehicleType } from '../types';

interface TripSetupProps {
  onStartTrip: (driverName: string, vehicleType: VehicleType, initialKm: number, plate: string) => void;
  onEnterAdmin: () => void;
}

const TripSetup: React.FC<TripSetupProps> = ({ onStartTrip, onEnterAdmin }) => {
  const [driverName, setDriverName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.Truck);
  const [initialKm, setInitialKm] = useState('');
  const [plate, setPlate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (driverName && initialKm && plate) {
      onStartTrip(driverName, vehicleType, parseInt(initialKm, 10), plate.toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md mx-auto bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 relative">
        <div className="absolute top-4 right-4">
          <button onClick={onEnterAdmin} className="text-xs text-gray-500 hover:text-blue-400 transition-colors">
            Sou Gestor
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Checklist Inteligente</h1>
          <p className="text-gray-400 mt-2">Preencha os dados para iniciar sua viagem.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="driverName" className="block text-sm font-medium text-gray-300">Nome do Motorista</label>
            <input
              id="driverName"
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Seu nome"
            />
          </div>
           <div>
            <label htmlFor="plate" className="block text-sm font-medium text-gray-300">Placa do Veículo</label>
            <input
              id="plate"
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="ABC-1234"
            />
          </div>
          <div>
            <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-300">Tipo de Veículo</label>
            <select
              id="vehicleType"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(VehicleType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="initialKm" className="block text-sm font-medium text-gray-300">KM Inicial</label>
            <input
              id="initialKm"
              type="number"
              value={initialKm}
              onChange={(e) => setInitialKm(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-colors duration-200"
          >
            Iniciar Viagem
          </button>
        </form>
      </div>
    </div>
  );
};

export default TripSetup;
