import React, { useState } from 'react';
import { analyzeVehicleDamage } from '../services/geminiService';
import { VehicleConditionItem } from '../types';
import Loader from './Loader';
import { CameraIcon } from './icons/CameraIcon';
import { VEHICLE_CONDITION_CODES } from '../constants';

interface VehicleConditionAnalyzerProps {
    conditions: VehicleConditionItem[];
    onAddCondition: (condition: VehicleConditionItem) => void;
}

const VehicleConditionAnalyzer: React.FC<VehicleConditionAnalyzerProps> = ({ conditions, onAddCondition }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [partName, setPartName] = useState('');

    const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError('');

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            try {
                const base64Image = (reader.result as string).split(',')[1];
                const result = await analyzeVehicleDamage(base64Image, file.type);
                if (result) {
                    onAddCondition({
                        id: new Date().toISOString(),
                        part: partName || 'Não especificado',
                        damageCode: result.damageCode,
                        description: result.description,
                        imageUrl: reader.result as string,
                    });
                } else {
                    setError('Não foi possível analisar a imagem da avaria.');
                }
            } catch (err) {
                setError('Erro ao processar a imagem.');
                console.error(err);
            } finally {
                setIsLoading(false);
                setPartName('');
                e.target.value = ''; // Reset file input
            }
        };
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-white">Análise de Conservação do Veículo</h3>
            
            <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-300">Registre qualquer avaria encontrada no veículo. A IA irá analisar e classificar o dano.</p>
                <div className="flex gap-2">
                    <input
                      type="text"
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      placeholder="Parte do veículo (ex: Para-choque)"
                      className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                      disabled={isLoading}
                    />
                    <label htmlFor="damage-capture" className={`flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'cursor-pointer'}`}>
                       <CameraIcon className="w-5 h-5" />
                       <span>{isLoading ? 'Analisando...' : 'Analisar Avaria'}</span>
                       <input id="damage-capture" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} disabled={isLoading} />
                    </label>
                </div>
                {isLoading && <Loader size="sm" />}
                {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2">
                {conditions.length === 0 && <p className="text-gray-400 text-center text-sm py-4">Nenhuma avaria registrada.</p>}
                {conditions.map(c => (
                     <div key={c.id} className="flex items-start gap-4 bg-gray-900/50 p-3 rounded-lg">
                        <img src={c.imageUrl} alt={c.part} className="w-16 h-16 object-cover rounded-md"/>
                        <div className="flex-grow">
                            <p className="font-bold text-white">{c.part}</p>
                            <p className="text-sm text-yellow-400 font-semibold">{`[${c.damageCode}] ${VEHICLE_CONDITION_CODES[c.damageCode as keyof typeof VEHICLE_CONDITION_CODES] || 'Não Identificado'}`}</p>
                            <p className="text-xs text-gray-300 mt-1">{c.description}</p>
                        </div>
                     </div>
                ))}
            </div>
        </div>
    );
};

export default VehicleConditionAnalyzer;
