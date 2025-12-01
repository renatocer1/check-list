
import React, { useState, useRef } from 'react';
import { TripData, ChecklistItem, MaintenanceAlert, VehicleConditionItem, Expense } from '../types';
import ConversationalChecklist from './ConversationalChecklist';
import ImageAnalyzer from './ImageAnalyzer';
import StatCard from './StatCard';
import MaintenanceAlerts from './MaintenanceAlerts';
import RouteMap from './RouteMap';
import VehicleConditionAnalyzer from './VehicleConditionAnalyzer';
import SignaturePad from './SignaturePad';
import ExpenseTracker from './ExpenseTracker';
import { summarizeChecklistIssues, getImprovementSuggestion } from '../services/geminiService';
import { saveTripToCloud } from '../services/firebase';
import Loader from './Loader';
import { WalletIcon } from './icons/WalletIcon';
import AITips from './AITips';
import LiveVoiceAssistant from './LiveVoiceAssistant';
import SmartAssistant from './SmartAssistant';

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
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onEndTrip: () => void;
}

type Tab = 'resumo' | 'checklist' | 'veiculo' | 'ia_assist' | 'custos' | 'finalizar';

interface TabDefinition {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { 
    tripData, isTracking, onUpdateTrip, onUpdateChecklistItem, onAddAlert, onMarkAlertAsDone,
    onToggleTracking, onAddStop, onAddVehicleCondition, onUpdateSignature, onAddExpense, onEndTrip
  } = props;

  const [activeTab, setActiveTab] = useState<Tab>('resumo');
  const [isChecklistComplete, setIsChecklistComplete] = useState(() => {
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
  const [isSaving, setIsSaving] = useState(false);
  const stopDescriptionRef = useRef<HTMLInputElement>(null);

  const kmPercorridos = tripData.finalKm > tripData.initialKm ? tripData.finalKm - tripData.initialKm : 0;
  const consumoCombustivel = kmPercorridos > 0 && tripData.fuelAdded > 0 ? (kmPercorridos / tripData.fuelAdded).toFixed(2) : 'N/A';
  const currentKm = tripData.finalKm > 0 ? tripData.finalKm : tripData.initialKm;
  const totalExpenses = tripData.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCost = tripData.refuelingCost + totalExpenses;
  
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
    const expensesSummary = tripData.expenses.map(e => `- ${e.category}: R$ ${e.amount.toFixed(2)}`).join('\n');

    return `*Relatório de Viagem - Checklist Inteligente*

*Motorista:* ${tripData.driverName}
*Veículo:* ${tripData.vehicleType} - ${tripData.plate}
*Data/Hora Início:* ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(tripData.startTime))}

*Dados da Viagem:*
- KM Percorridos: ${kmPercorridos} km
- Consumo: ${consumoCombustivel} km/l
- Custo Total: R$ ${totalCost.toFixed(2)}

*Resumo Financeiro:*
- Combustível: R$ ${tripData.refuelingCost.toFixed(2)}
- Extras: R$ ${totalExpenses.toFixed(2)}

*Resumo do Checklist (IA):*
${aiSummary || 'Aguardando finalização...'}

*Pendências do Checklist:*
${checklistIssues || 'Nenhuma.'}

*Avarias Registradas:*
${conditionIssues || 'Nenhuma.'}

*Despesas Detalhadas:*
${expensesSummary || 'Nenhuma.'}

*Observações Gerais:*
${tripData.generalObservations || 'Nenhuma.'}
    `;
  };
  
  const handleShareWhatsApp = () => {
    const reportText = generateReportText();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleSendReport = async () => {
    if (!tripData.finalKm || tripData.finalKm === 0) {
      alert("Por favor, preencha o KM final antes de encerrar.");
      return;
    }

    setIsSaving(true);
    try {
      const finalData = {
        ...tripData,
        finalKm: Number(finalKmInput) || tripData.finalKm,
        fuelAdded: Number(fuelAddedInput) || tripData.fuelAdded,
        refuelingCost: Number(refuelingCostInput) || tripData.refuelingCost,
        generalObservations: generalObservations,
      };
      
      await saveTripToCloud(finalData);
      
      alert('Viagem salva no Banco de Dados com sucesso! O gestor já pode visualizar os dados.');
      onEndTrip();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar no banco de dados online. Verifique sua conexão ou a configuração do Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const TABS: TabDefinition[] = [
    { id: 'resumo', label: 'Resumo', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'checklist', label: 'Checklist', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
    { id: 'veiculo', label: 'Veículo', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: 'ia_assist', label: 'IA Assist', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: 'custos', label: 'Custos', icon: <WalletIcon className="h-6 w-6" /> },
    { id: 'finalizar', label: 'Fim', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-md z-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div>
                <h1 className="text-xl font-bold leading-tight">Checklist Inteligente</h1>
                <p className="text-xs text-gray-400">
                    {tripData.vehicleType} • {tripData.plate} • {tripData.driverName}
                </p>
            </div>
            <div className="text-right hidden sm:block">
                 <p className="text-sm font-mono bg-gray-900 px-2 py-1 rounded text-green-400">{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}</p>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto p-4 sm:p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
            
            {/* TAB 1: RESUMO */}
            {activeTab === 'resumo' && (
                <div className="space-y-6 fade-in">
                     <LiveVoiceAssistant driverName={tripData.driverName} />

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="KM Total" value={kmPercorridos} unit="km" icon={<span className="text-2xl">🛣️</span>} />
                        <StatCard title="Custo" value={totalCost.toFixed(2)} unit="R$" icon={<span className="text-2xl">💰</span>} />
                        <StatCard title="Consumo" value={consumoCombustivel} unit="km/l" icon={<span className="text-2xl">⛽</span>} />
                        <StatCard title="Paradas" value={tripData.stops.length} unit="" icon={<span className="text-2xl">🛑</span>} />
                    </div>

                    <AITips tip={aiTip} isLoading={isGettingTip} onGetTip={handleGetAITip} />

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-white">Controle da Viagem</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={onToggleTracking} className={`w-full py-3 px-4 font-semibold rounded-lg shadow-md transition-colors ${isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                {isTracking ? 'Parar Rastreamento' : 'Iniciar Rastreamento'}
                            </button>
                            <div className="flex gap-2">
                                <input type="text" ref={stopDescriptionRef} placeholder="Motivo da Parada" className="flex-grow w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" disabled={!isTracking} />
                                <button onClick={handleAddStopClick} className="py-2 px-4 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!isTracking}>+ Parada</button>
                            </div>
                        </div>
                    </div>

                    <RouteMap route={tripData.route} stops={tripData.stops} />
                </div>
            )}

            {/* TAB 2: CHECKLIST */}
            {activeTab === 'checklist' && (
                <div className="space-y-6 fade-in">
                    <ConversationalChecklist
                        items={tripData.checklist}
                        driverName={tripData.driverName}
                        vehicleType={tripData.vehicleType}
                        onUpdateItem={onUpdateChecklistItem}
                        onComplete={handleChecklistCompletion}
                    />
                    {isChecklistComplete && (
                         <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-4 text-white">Resumo IA</h3>
                            {isSummarizing ? <Loader /> : <p className="text-gray-300 whitespace-pre-wrap">{aiSummary}</p>}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: VEÍCULO */}
            {activeTab === 'veiculo' && (
                <div className="space-y-6 fade-in">
                    <VehicleConditionAnalyzer conditions={tripData.vehicleConditions} onAddCondition={onAddVehicleCondition} />
                    <MaintenanceAlerts 
                        alerts={tripData.maintenanceAlerts}
                        currentKm={currentKm}
                        onAddAlert={onAddAlert}
                        onMarkAsDone={onMarkAlertAsDone}
                    />
                    <ImageAnalyzer />
                </div>
            )}

            {/* TAB 4: IA ASSIST (NEW) */}
            {activeTab === 'ia_assist' && (
                <div className="space-y-6 fade-in">
                   <h3 className="text-2xl font-bold text-white mb-2">Assistente Inteligente</h3>
                   <p className="text-gray-400 mb-4">Diagnóstico mecânico avançado, mapas e busca na web.</p>
                   <SmartAssistant vehicleContext={`${tripData.vehicleType} placa ${tripData.plate}`} />
                   <div className="bg-gray-800 p-4 rounded text-sm text-gray-400">
                        <p><strong>Dica:</strong> Use a aba "Diagnóstico" para descrever barulhos estranhos ou falhas. A IA usará raciocínio avançado (Thinking) para ajudar.</p>
                   </div>
                </div>
            )}

            {/* TAB 5: CUSTOS */}
            {activeTab === 'custos' && (
                <div className="space-y-6 fade-in">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-white">Abastecimento e Dados Finais</h3>
                         <div className="grid grid-cols-1 gap-4 mb-4">
                            <div>
                                <label htmlFor="finalKm" className="block text-sm font-medium text-gray-300">KM Final (Odômetro)</label>
                                <input type="number" id="finalKm" value={finalKmInput} onChange={e => setFinalKmInput(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white font-mono text-lg" placeholder="000000" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fuelAdded" className="block text-sm font-medium text-gray-300">Litros</label>
                                    <input type="number" id="fuelAdded" value={fuelAddedInput} onChange={e => setFuelAddedInput(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
                                </div>
                                <div>
                                    <label htmlFor="refuelingCost" className="block text-sm font-medium text-gray-300">Valor (R$)</label>
                                    <input type="number" id="refuelingCost" value={refuelingCostInput} onChange={e => setRefuelingCostInput(e.target.value)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
                                </div>
                            </div>
                            <button onClick={handleUpdate} className="mt-2 w-full py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">Salvar Odômetro/Combustível</button>
                        </div>
                    </div>

                    <ExpenseTracker 
                        expenses={tripData.expenses}
                        onAddExpense={onAddExpense}
                        fuelCost={tripData.refuelingCost}
                    />
                </div>
            )}

            {/* TAB 6: FINALIZAR */}
            {activeTab === 'finalizar' && (
                <div className="space-y-6 fade-in">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <label htmlFor="generalObservations" className="block text-lg font-bold text-white mb-2">Observações Gerais da Viagem</label>
                        <textarea id="generalObservations" rows={4} value={generalObservations} onChange={e => setGeneralObservations(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" placeholder="Alguma ocorrência não listada?" />
                        <button onClick={handleUpdate} className="mt-2 py-2 px-4 bg-gray-600 text-white text-sm rounded hover:bg-gray-500">Salvar Obs.</button>
                    </div>

                    <SignaturePad onSave={onUpdateSignature} />

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-indigo-500">
                         <h3 className="text-2xl font-bold mb-4 text-white">Encerrar Viagem</h3>
                         <p className="text-gray-400 mb-6">Todos os dados serão enviados imediatamente para o gestor da frota via satélite (internet).</p>
                         <div className="flex flex-col gap-4">
                             <button onClick={handleShareWhatsApp} className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                 Compartilhar Relatório
                             </button>
                             <button 
                                onClick={handleSendReport} 
                                disabled={isSaving}
                                className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                             >
                                 {isSaving ? <Loader size="sm" /> : (
                                     <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Finalizar e Enviar para Nuvem
                                     </>
                                 )}
                             </button>
                         </div>
                    </div>
                </div>
            )}

        </div>
      </main>

      {/* Mobile-Optimized Bottom Tab Bar */}
      <nav className="bg-gray-800 border-t border-gray-700 shadow-lg safe-area-pb">
        <div className="flex justify-around max-w-4xl mx-auto">
            {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center p-2 flex-1 transition-colors ${activeTab === tab.id ? 'text-blue-400 border-t-2 border-blue-400 bg-gray-800' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}
                >
                  <div className="mb-1">{tab.icon}</div>
                  <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center">{tab.label}</span>
                </button>
            ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
