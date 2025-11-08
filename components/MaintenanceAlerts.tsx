// Fix: Corrected typo in import statement. Removed `, on,`
import React, { useState } from 'react';
import { MaintenanceAlert, MaintenanceAlertTrigger } from '../types';
import { BellIcon } from './icons/BellIcon';

interface MaintenanceAlertsProps {
  alerts: MaintenanceAlert[];
  currentKm: number;
  onAddAlert: (alert: Omit<MaintenanceAlert, 'id'>) => void;
  onMarkAsDone: (alertId: string) => void;
}

const MaintenanceAlerts: React.FC<MaintenanceAlertsProps> = ({ alerts, currentKm, onAddAlert, onMarkAsDone }) => {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<MaintenanceAlertTrigger>('km');
  const [newKmInterval, setNewKmInterval] = useState('');
  const [newLastKm, setNewLastKm] = useState('');
  const [newDateInterval, setNewDateInterval] = useState('');
  const [newLastDate, setNewLastDate] = useState('');

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: Omit<MaintenanceAlert, 'id'> = {
      name: newName,
      type: newType,
      ...(newType === 'km' && {
        kmInterval: Number(newKmInterval),
        lastKm: Number(newLastKm),
      }),
      ...(newType === 'date' && {
        dateIntervalDays: Number(newDateInterval) * 30, // Assuming months to days
        lastDate: new Date(newLastDate).toISOString(),
      }),
    };
    onAddAlert(newAlert);
    // Reset form
    setShowForm(false);
    setNewName('');
    setNewKmInterval('');
    setNewLastKm('');
    setNewDateInterval('');
    setNewLastDate('');
  };

  const getAlertStatus = (alert: MaintenanceAlert) => {
    const now = new Date();
    if (alert.type === 'km') {
      const nextDueKm = (alert.lastKm ?? 0) + (alert.kmInterval ?? 0);
      const kmRemaining = nextDueKm - currentKm;
      const progress = Math.max(0, 100 - (kmRemaining / (alert.kmInterval ?? 1)) * 100);
      const threshold = (alert.kmInterval ?? 0) * 0.15; // 15% threshold

      if (kmRemaining <= 0) return { status: 'Vencido', color: 'red', text: `Vencido há ${-kmRemaining} km`, progress: 100 };
      if (kmRemaining <= threshold) return { status: 'Vencendo', color: 'yellow', text: `Vence em ${kmRemaining} km`, progress };
      return { status: 'OK', color: 'green', text: `Próxima em ${kmRemaining} km`, progress };
    } else { // date
      const lastDate = new Date(alert.lastDate ?? now);
      const nextDueDate = new Date(lastDate.setDate(lastDate.getDate() + (alert.dateIntervalDays ?? 0)));
      const daysRemaining = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const progress = Math.max(0, 100 - (daysRemaining / (alert.dateIntervalDays ?? 1)) * 100);
      const threshold = (alert.dateIntervalDays ?? 0) * 0.15; // 15% threshold
      
      if (daysRemaining <= 0) return { status: 'Vencido', color: 'red', text: `Vencido há ${-daysRemaining} dias`, progress: 100 };
      if (daysRemaining <= threshold) return { status: 'Vencendo', color: 'yellow', text: `Vence em ${daysRemaining} dias`, progress };
      return { status: 'OK', color: 'green', text: `Próxima em ${daysRemaining} dias`, progress };
    }
  };
  
  const statusColorMap = {
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    green: 'border-green-500',
  };
  
  const progressColorMap = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  }


  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BellIcon className="text-blue-400" />
            Alertas de Manutenção
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="text-blue-400 hover:text-blue-300 font-semibold">
          {showForm ? 'Cancelar' : '+ Novo Alerta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddAlert} className="bg-gray-900/50 p-4 rounded-lg mb-4 space-y-4">
          <input type="text" placeholder="Nome (ex: Troca de Óleo)" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="radio" name="type" checked={newType === 'km'} onChange={() => setNewType('km')} /> Por KM</label>
            <label className="flex items-center gap-2"><input type="radio" name="type" checked={newType === 'date'} onChange={() => setNewType('date')} /> Por Data</label>
          </div>
          {newType === 'km' ? (
            <div className='grid grid-cols-2 gap-2'>
              <input type="number" placeholder="A cada... KM" value={newKmInterval} onChange={e => setNewKmInterval(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
              <input type="number" placeholder="Última aos... KM" value={newLastKm} onChange={e => setNewLastKm(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
          ) : (
             <div className='grid grid-cols-2 gap-2'>
              <input type="number" placeholder="A cada... meses" value={newDateInterval} onChange={e => setNewDateInterval(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
              <input type="date" placeholder="Data da última" value={newLastDate} onChange={e => setNewLastDate(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
          )}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">Salvar Alerta</button>
        </form>
      )}

      <div className="space-y-4">
        {alerts.length === 0 && <p className="text-gray-400 text-center">Nenhum alerta configurado.</p>}
        {alerts.map(alert => {
          const { status, color, text, progress } = getAlertStatus(alert);
          return (
            <div key={alert.id} className={`bg-gray-900/50 p-4 rounded-lg border-l-4 ${statusColorMap[color]}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white">{alert.name}</p>
                  <p className={`text-sm text-${color}-400`}>{text}</p>
                </div>
                {status !== 'OK' && (
                  <button onClick={() => onMarkAsDone(alert.id)} className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">
                    Marcar Feito
                  </button>
                )}
              </div>
               <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                <div className={`${progressColorMap[color]} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaintenanceAlerts;