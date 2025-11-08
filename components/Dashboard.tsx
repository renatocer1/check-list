import React, { useState, useRef } from 'react';
import { TripData, ChecklistItem, MaintenanceAlert, LatLng, StopPoint, VehicleConditionItem } from '../types';
import ConversationalChecklist from './ConversationalChecklist';
import ImageAnalyzer from './ImageAnalyzer';
import StatCard from './StatCard';
import MaintenanceAlerts from './MaintenanceAlerts';
import RouteMap from './RouteMap';
import VehicleConditionAnalyzer from './VehicleConditionAnalyzer';
import SignaturePad from './SignaturePad';
import { summarizeChecklistIssues, getImprovementSuggestion } from '../services/geminiService';
import Loader from './Loader';
import { MapPinIcon } from './icons/MapPinIcon';
import AITips from './AITips';

interface DashboardProps {
  tripData: TripData;
  isTracking: boolean;
  onUpdateTrip: (data: Partial<Omit<TripData, 'checklist' | 'maintenanceAlerts'>>) => void;
  onUpdateChecklistItem: (itemId: string, data: Partial<Omit<ChecklistItem, 'id' | 'label'>>) => void;
  onAddAlert: (alert: Omit<MaintenanceAlert, 'id'>) => void;
  onMarkAlertAsDone: (alertId: string) => void;
  onToggleTracking: () => void;
  onAddStop: (description: string) => void;
  onAddVehicleCondition: (condition: VehicleConditionItem) => void;
  onUpdateSignature: (signature: string) => void;
  onEndTrip: () => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { 
    tripData, isTracking, onUpdateTrip, onUpdateChecklistItem, onAddAlert, onMarkAlertAsDone,
    onToggleTracking, onAddStop, onAddVehicleCondition, onUpdateSignature, onEndTrip
  } = props;

  const [isChecklistComplete, setIsChecklistComplete] = useState(() => {
    // If all items are checked, the checklist is complete
    return tripData.checklist.every(item => item.checked || item.observation);
  });
  const [finalKmInput, setFinalKmInput] = useState(tripData.finalKm > 0 ? tripData.finalKm.toString() : '');
  const [fuelAddedInput, setFuelAddedInput] = useState(tripData.fuelAdded > 0 ? tripData.fuelAdded.toString() : '');
  const [refuelingCostInput, setRefuelingCostInput] = useState(tripData.refuelingCost > 0 ? tripData.refuelingCost.toString() : '');
  const [generalObservations, setGeneralObservations] = useState(tripData.generalObservations || '');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiTip, setAiTip] = useState('');
  const [isGettingTip, setIsGettingTip] = useState(false);
  const stopDescriptionRef = useRef<HTMLInputElement>(null);

  const kmPercorridos = tripData.finalKm > tripData.initialKm ? tripData.finalKm - tripData.initialKm : 0;
  const consumoCombustivel = kmPercorridos > 0 && tripData.fuelAdded > 0 ? (kmPercorridos / tripData.fuelAdded).toFixed(2) : 'N/A';
  const currentKm = tripData.finalKm > 0 ? tripData.finalKm : tripData.initialKm;
  
  const handleChecklistCompletion = async () => {
    setIsChecklistComplete(true);
    setIsSummarizing(true);
    const summary = await summarizeChecklistIssues(tripData.checklist);
    setAiSummary(summary);
    setIsSummarizing(false);
  };

  const handleUpdate = () => {
    onUpdateTrip({
      finalKm: Number(finalKmInput) || tripData.finalKm,
      fuelAdded: Number(fuelAddedInput) || tripData.fuelAdded,
      refuelingCost: Number(refuelingCostInput) || tripData.refuelingCost,
      generalObservations: generalObservations,
    });
  };

  const handleAddStopClick = () => {
    const description = stopDescriptionRef.current?.value || 'Parada Rápida';
    onAddStop(description);
    if(stopDescriptionRef.current) stopDescriptionRef.current.value = '';
  }

  const handleGetAITip = async () => {
    setIsGettingTip(true);
    setAiTip('');
    const tip = await getImprovementSuggestion(tripData);
    setAiTip(tip);
    setIsGettingTip(false);
  };
  
  const generateReportText = () => {
    const checklistIssues = tripData.checklist.filter(i => !i.checked && i.observation).map(i => `- ${i.label}: ${i.observation}`).join('\n');
    const conditionIssues = tripData.vehicleConditions.map(c => `- ${c.part}: ${c.description}`).join('\n');

    return `*Relatório de Viagem - Checklist Inteligente*

*Motorista:* ${tripData.driverName}
*Veículo:* ${tripData.vehicleType} - ${tripData.plate}
*Data/Hora Início:* ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(tripData.startTime))}

*Dados da Viagem:*
- KM Inicial: ${tripData.initialKm} km
- KM Final: ${tripData.finalKm > 0 ? tripData.finalKm + ' km' : 'Não finalizado'}
- KM Percorridos: ${kmPercorridos} km
- Combustível Abastecido: ${tripData.fuelAdded} L
- Custo Abastecimento: R$ ${tripData.refuelingCost.toFixed(2)}
- Consumo: ${consumoCombustivel} km/l

*Resumo do Checklist (IA):*
${aiSummary || 'Aguardando finalização...'}

*Pendências do Checklist:*
${checklistIssues || 'Nenhuma.'}

*Avarias Registradas:*
${conditionIssues || 'Nenhuma.'}

*Observações Gerais:*
${tripData.generalObservations || 'Nenhuma.'}
    `;
  };
  
  const handleShareWhatsApp = () => {
    const reportText = generateReportText();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleSendReport = () => {
    // This is a simulation. In a real app, this would send a JSON payload to a server.
    console.log("Payload para Admin APP:", tripData);
    alert('Relatório enviado com sucesso para o painel de administração! O aplicativo será reiniciado.');
    onEndTrip();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard da Viagem</h1>
        <p className="text-gray-400">
          Motorista: {tripData.driverName} | Veículo: {tripData.vehicleType} ({tripData.plate}) | Início: {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(tripData.startTime))}
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              title="KM Inicial" 
              value={tripData.initialKm} 
              unit="km"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard 
              title="KM Percorridos" 
              value={kmPercorridos} 
              unit="km"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
            <StatCard 
              title="Consumo" 
              value={consumoCombustivel} 
              unit="km/l"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v1.5M3 21v-1.5M21 3v1.5M21 21v-1.5M12 3v1.5M12 21v-1.5M3.5 9h1.5M21 9h-1.5M3.5 15h1.5M21 15h-1.5M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8-8-3.582-8-8zm8-4a4 4 0 100 8 4 4 0 000-8z" /></svg>}
            />
             <StatCard 
              title="Paradas" 
              value={tripData.stops.length} 
              unit=""
              icon={<MapPinIcon className="h-6 w-6 text-red-400"/>}
            />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
             <h3 className="text-xl font-bold mb-4 text-white">Controle da Viagem</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button onClick={onToggleTracking} className={`w-full py-3 px-4 font-semibold rounded-lg shadow-md transition-colors ${isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    {isTracking ? 'Parar Rastreamento' : 'Iniciar Rastreamento de Rota'}
                 </button>
                 <div className="flex gap-2">
                    <input type="text" ref={stopDescriptionRef} placeholder="Descrição da Parada" className="flex-grow w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" disabled={!isTracking} />
                    <button onClick={handleAddStopClick} className="py-2 px-4 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!isTracking}>+ Parada</button>
                 </div>
             </div>
          </div>
          
          <RouteMap route={tripData.route} stops={tripData.stops} />

          <VehicleConditionAnalyzer conditions={tripData.vehicleConditions} onAddCondition={onAddVehicleCondition} />
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
             <h3 className="text-xl font-bold mb-4 text-white">Atualizar Dados e Observações</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label htmlFor="finalKm" className="block text-sm font-medium text-gray-300">KM Final</label>
                    <input type="number" id="finalKm" value={finalKmInput} onChange={e => setFinalKmInput(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
                </div>
                 <div>
                    <label htmlFor="fuelAdded" className="block text-sm font-medium text-gray-300">Combustível (L)</label>
                    <input type="number" id="fuelAdded" value={fuelAddedInput} onChange={e => setFuelAddedInput(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
                </div>
                <div>
                    <label htmlFor="refuelingCost" className="block text-sm font-medium text-gray-300">Custo Abast. (R$)</label>
                    <input type="number" id="refuelingCost" value={refuelingCostInput} onChange={e => setRefuelingCostInput(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
                </div>
             </div>
             <div>
                <label htmlFor="generalObservations" className="block text-sm font-medium text-gray-300">Observações Gerais</label>
                <textarea id="generalObservations" rows={3} value={generalObservations} onChange={e => setGeneralObservations(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
             </div>
             <button onClick={handleUpdate} className="mt-4 w-full md:w-auto py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">Salvar Dados</button>
          </div>

          <SignaturePad onSave={onUpdateSignature} />

          {isChecklistComplete && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-white">Resumo da IA sobre o Checklist</h3>
              {isSummarizing ? <Loader /> : <p className="text-gray-300 whitespace-pre-wrap">{aiSummary}</p>}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                 <button onClick={handleShareWhatsApp} className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">Compartilhar no WhatsApp</button>
                 <button onClick={handleSendReport} className="flex-1 py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors">Finalizar e Enviar Relatório</button>
              </div>
            </div>
          )}
          
          <MaintenanceAlerts 
            alerts={tripData.maintenanceAlerts}
            currentKm={currentKm}
            onAddAlert={onAddAlert}
            onMarkAsDone={onMarkAlertAsDone}
          />

        </div>

        {/* Coluna Lateral */}
        <div className="lg:col-span-1 space-y-6">
          <ConversationalChecklist
            items={tripData.checklist}
            driverName={tripData.driverName}
            vehicleType={tripData.vehicleType}
            onUpdateItem={onUpdateChecklistItem}
            onComplete={handleChecklistCompletion}
          />
          <ImageAnalyzer />
          <AITips 
            tip={aiTip}
            isLoading={isGettingTip}
            onGetTip={handleGetAITip}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;