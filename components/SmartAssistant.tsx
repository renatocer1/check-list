
import React, { useState } from 'react';
import { diagnoseVehicleIssue, findNearbyServices, searchInfo } from '../services/geminiService';
import Loader from './Loader';
import { MapPinIcon } from './icons/MapPinIcon';

interface SmartAssistantProps {
  vehicleContext: string;
}

const SmartAssistant: React.FC<SmartAssistantProps> = ({ vehicleContext }) => {
  const [mode, setMode] = useState<'chat' | 'diagnose' | 'maps'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    let response = '';

    try {
      if (mode === 'diagnose') {
        response = await diagnoseVehicleIssue(userMsg, vehicleContext);
      } else if (mode === 'maps') {
        // Try to get location
        await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    response = await findNearbyServices(userMsg, pos.coords.latitude, pos.coords.longitude);
                    resolve();
                },
                async () => {
                    response = "Preciso da sua localização. Habilite o GPS.";
                    resolve();
                }
            );
        });
      } else {
        // General Chat with Search Grounding capability implicitly via generic helper or just context
        // For specific "news/info" we use searchInfo, else generic.
        // Let's use searchInfo if it looks like a query about external data, else basic chat logic (omitted for brevity, using search as default for "Smart" feel)
        response = await searchInfo(userMsg); 
      }
    } catch (err) {
      response = "Desculpe, tive um erro ao processar.";
    }

    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-[500px]">
      <div className="bg-gray-700 p-2 flex justify-around text-sm">
        <button onClick={() => setMode('chat')} className={`flex-1 py-2 rounded ${mode === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Info & Web</button>
        <button onClick={() => setMode('diagnose')} className={`flex-1 py-2 rounded ${mode === 'diagnose' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Diagnóstico (Thinking)</button>
        <button onClick={() => setMode('maps')} className={`flex-1 py-2 rounded ${mode === 'maps' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Mapas</button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-900/50">
        {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
                <p className="mb-2 text-3xl">🤖</p>
                <p>Olá! Sou sua IA Avançada.</p>
                {mode === 'chat' && <p className="text-xs">Pergunte sobre preços, leis ou notícias.</p>}
                {mode === 'diagnose' && <p className="text-xs">Descreva um problema mecânico complexo. Vou pensar profundamente sobre isso.</p>}
                {mode === 'maps' && <p className="text-xs">Procure por "Borracheiro", "Posto Diesel", etc.</p>}
            </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-gray-700 p-3 rounded-lg rounded-bl-none">
                    <Loader size="sm" />
                </div>
            </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
        <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder={mode === 'maps' ? "O que procura por perto?" : "Digite sua mensagem..."}
            className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
        />
        <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
      </form>
    </div>
  );
};

export default SmartAssistant;
