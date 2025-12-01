
import React, { useEffect, useState } from 'react';
import { subscribeToTrips } from '../services/firebase';
import { TripData } from '../types';
import Loader from './Loader';

const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Conecta ao banco de dados em tempo real apenas se autenticado
      const unsubscribe = subscribeToTrips((data) => {
        setTrips(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha simples para demonstração. Em produção, use autenticação Firebase Auth.
    if (password === 'admin' || password === '1234') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Senha incorreta. Tente "admin".');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTripId(expandedTripId === id ? null : id);
  };

  const totalKm = trips.reduce((acc, t) => acc + (t.finalKm - t.initialKm), 0);
  const totalCost = trips.reduce((acc, t) => {
    const expenses = t.expenses?.reduce((eAcc, e) => eAcc + e.amount, 0) || 0;
    return acc + t.refuelingCost + expenses;
  }, 0);

  // TELA DE LOGIN DO GESTOR
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm w-full border border-gray-700">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Acesso do Gestor</h2>
            <p className="text-gray-400 text-sm mt-2">Digite a senha para acessar os dados da frota.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Senha (admin)"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={onExit}
              className="w-full py-2 px-4 bg-transparent text-gray-400 hover:text-white text-sm transition-colors"
            >
              Voltar ao App do Motorista
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center flex-col gap-4">
        <Loader size="lg" />
        <p className="text-gray-400">Sincronizando com satélite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Painel do Gestor</h1>
            <p className="text-gray-400">Monitoramento da frota</p>
          </div>
          <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-600">
            Sair / Voltar
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <p className="text-gray-400">Viagens Realizadas</p>
            <p className="text-3xl font-bold">{trips.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <p className="text-gray-400">KM Total Rodado</p>
            <p className="text-3xl font-bold">{totalKm} km</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-yellow-500">
            <p className="text-gray-400">Custo Total</p>
            <p className="text-3xl font-bold">R$ {totalCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Trips List */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
            <h2 className="text-xl font-bold">Histórico de Viagens</h2>
            <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded-full animate-pulse">● Online</span>
          </div>
          
          <div className="divide-y divide-gray-700">
            {trips.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>Nenhuma viagem registrada no banco de dados.</p>
                <p className="text-sm mt-2 text-gray-500">As viagens finalizadas pelos motoristas aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              trips.map((trip, index) => {
                const tripCost = trip.refuelingCost + (trip.expenses?.reduce((a, b) => a + b.amount, 0) || 0);
                const key = trip.id || String(index); 
                const isExpanded = expandedTripId === key;
                
                return (
                  <div key={key} className="hover:bg-gray-700/30 transition-colors border-l-4 border-transparent hover:border-blue-500">
                    <div 
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-4"
                      onClick={() => toggleExpand(key)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${trip.vehicleType === 'Caminhão' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'}`}>
                          {trip.vehicleType ? trip.vehicleType[0] : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{trip.driverName}</p>
                          <p className="text-sm text-gray-400">{trip.plate} • {new Date(trip.startTime).toLocaleDateString('pt-BR')} • {new Date(trip.startTime).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-right justify-between sm:justify-end w-full sm:w-auto">
                        <div>
                          <p className="text-xs text-gray-400">Distância</p>
                          <p className="font-medium">{trip.finalKm - trip.initialKm} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Custo</p>
                          <p className="font-medium text-green-400">R$ {tripCost.toFixed(2)}</p>
                        </div>
                        <div className="text-gray-500">
                          <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-900/50 p-4 border-t border-gray-700 text-sm animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">Avarias & Manutenção</h4>
                            {trip.vehicleConditions?.length > 0 ? (
                              <ul className="space-y-2">
                                {trip.vehicleConditions.map((c, i) => (
                                  <li key={i} className="bg-red-900/20 p-2 rounded border border-red-900/30">
                                    <span className="font-bold text-red-300">{c.part}</span>: {c.description} <span className="text-xs bg-red-800 px-1 rounded ml-1">{c.damageCode}</span>
                                    {c.imageUrl && <img src={c.imageUrl} className="h-12 w-12 object-cover mt-1 rounded" alt="Dano" />}
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-gray-500 italic">Nenhuma avaria relatada.</p>}
                            
                            <h4 className="font-bold text-blue-400 mt-4 mb-2 border-b border-gray-700 pb-1">Alertas Ativos</h4>
                             {trip.maintenanceAlerts?.length > 0 ? (
                              <ul className="list-disc list-inside text-gray-300">
                                {trip.maintenanceAlerts.map((a, i) => (
                                  <li key={i}>{a.name} ({a.type === 'km' ? `${a.kmInterval}km` : 'Data'})</li>
                                ))}
                              </ul>
                            ) : <p className="text-gray-500 italic">Nenhum alerta.</p>}
                          </div>

                          <div>
                            <h4 className="font-bold text-blue-400 mb-2 border-b border-gray-700 pb-1">Despesas Extras</h4>
                            {trip.expenses?.length > 0 ? (
                              <ul className="space-y-1 text-gray-300">
                                {trip.expenses.map((e, i) => (
                                  <li key={i} className="flex justify-between p-1 hover:bg-gray-800 rounded">
                                    <span>{e.category} <span className="text-gray-500 text-xs">({e.description})</span></span>
                                    <span className="font-mono">R$ {e.amount.toFixed(2)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-gray-500 italic">Nenhuma despesa extra.</p>}
                            
                             <h4 className="font-bold text-blue-400 mt-4 mb-2 border-b border-gray-700 pb-1">Combustível</h4>
                             <div className="flex justify-between text-gray-300">
                                <span>Abastecimento:</span>
                                <span>{trip.fuelAdded} Litros</span>
                             </div>
                             <div className="flex justify-between text-gray-300">
                                <span>Custo:</span>
                                <span>R$ {trip.refuelingCost.toFixed(2)}</span>
                             </div>

                             <h4 className="font-bold text-blue-400 mt-4 mb-2 border-b border-gray-700 pb-1">Assinatura</h4>
                             {trip.driverSignature ? (
                               <div className="bg-white p-1 rounded inline-block">
                                <img src={trip.driverSignature} alt="Assinatura" className="h-10" />
                               </div>
                             ) : <p className="text-red-400 text-xs">Não assinado</p>}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="font-bold text-gray-300">Observações Gerais</h4>
                            <p className="text-gray-400 italic bg-gray-800 p-2 rounded">{trip.generalObservations || "Sem observações."}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
