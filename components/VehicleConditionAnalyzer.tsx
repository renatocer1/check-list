
import React, { useState } from 'react';
import { analyzeVehicleDamage, editDamageImage, generateReferenceImage } from '../services/geminiService';
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
    
    // Advanced Image Features State
    const [generatedRefImage, setGeneratedRefImage] = useState<string | null>(null);
    const [editInstruction, setEditInstruction] = useState('');

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
                
                // Check if user wants to edit first (simple implementation logic: direct analysis, but could add edit step)
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

    const handleGenerateReference = async () => {
        if (!partName) {
            setError("Digite o nome da peça para gerar referência.");
            return;
        }
        setIsLoading(true);
        const base64 = await generateReferenceImage(partName);
        if (base64) {
            setGeneratedRefImage(`data:image/png;base64,${base64}`);
        } else {
            setError("Falha ao gerar imagem de referência.");
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-white">Análise de Conservação do Veículo</h3>
            
            <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-300">Registre qualquer avaria ou gere uma imagem de referência para comparação.</p>
                
                <input
                      type="text"
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      placeholder="Nome da Peça (ex: Farol Dianteiro)"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                      disabled={isLoading}
                />

                <div className="flex gap-2 flex-wrap">
                    <label htmlFor="damage-capture" className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
                       <CameraIcon className="w-5 h-5" />
                       <span>{isLoading ? '...' : 'Analisar Foto'}</span>
                       <input id="damage-capture" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} disabled={isLoading} />
                    </label>
                    
                    <button 
                        onClick={handleGenerateReference}
                        disabled={isLoading || !partName}
                        className="flex-1 min-w-[120px] py-2 px-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-600 transition-all"
                    >
                        Gerar Referência
                    </button>
                </div>
                
                {isLoading && <Loader size="sm" />}
                {error && <p className="text-red-400 text-sm">{error}</p>}

                {/* Generated Reference Image Display */}
                {generatedRefImage && (
                    <div className="mt-4 p-2 bg-gray-800 rounded border border-purple-500/50">
                        <p className="text-xs text-purple-300 mb-1">Imagem de Referência (Gerada por IA):</p>
                        <img src={generatedRefImage} alt="Referência" className="w-full rounded-md" />
                        <button onClick={() => setGeneratedRefImage(null)} className="mt-2 text-xs text-gray-400 underline">Fechar</button>
                    </div>
                )}
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
