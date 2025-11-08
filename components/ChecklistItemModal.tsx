import React, { useState } from 'react';
import { ChecklistItem } from '../types';
import Loader from './Loader';

interface ChecklistItemModalProps {
  item: ChecklistItem;
  onSave: (observation: string, imageUrl?: string) => void;
  onClose: () => void;
}

const ChecklistItemModal: React.FC<ChecklistItemModalProps> = ({ item, onSave, onClose }) => {
  const [observation, setObservation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    setIsCapturing(false);
  };
  
  const handleSave = () => {
    onSave(observation, image || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Adicionar Detalhes: <span className="text-yellow-400">{item.label}</span></h2>
        
        <div>
          <label htmlFor="observation" className="block text-sm font-medium text-gray-300 mb-1">Observação</label>
          <textarea
            id="observation"
            rows={3}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descreva o problema encontrado..."
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">Anexar Foto</label>
           <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    {image ? (
                        <img src={image} alt="Preview" className="max-h-40 mx-auto rounded-md"/>
                    ) : isCapturing ? (
                        <Loader/>
                    ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                    <div className="flex text-sm text-gray-500">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500 px-3 py-1 transition-transform transform active:scale-95">
                            <span>{image ? 'Trocar Foto' : 'Tirar Foto'}</span>
                            <input id="file-upload" name="file-upload" type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleImageCapture} onClick={() => setIsCapturing(true)} />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">Use a câmera do seu dispositivo</p>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors"
          >
            Pular
          </button>
          <button
            onClick={handleSave}
            disabled={!observation && !image}
            className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistItemModal;