import React, { useState, useCallback, useRef } from 'react';
import { analyzeImage } from '../services/geminiService';
import Loader from './Loader';
import { CameraIcon } from './icons/CameraIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsReadingFile(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setImageMimeType(file.type);
        setIsReadingFile(false);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  const handleAnalyze = useCallback(async () => {
    if (!image || !prompt) {
      setAnalysis("Por favor, carregue uma imagem e insira uma pergunta.");
      return;
    }
    setIsLoading(true);
    setAnalysis('');
    try {
      const base64Data = image.split(',')[1];
      const result = await analyzeImage(prompt, base64Data, imageMimeType || 'image/jpeg');
      setAnalysis(result);
    } catch (error) {
      setAnalysis("Ocorreu um erro ao analisar a imagem.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [image, prompt, imageMimeType]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
      <h3 className="text-xl font-bold mb-4 text-white">Analisador de Imagem com IA</h3>
      <div className="space-y-4 flex-grow flex flex-col">
        <div className="flex-grow bg-gray-900/50 rounded-lg flex items-center justify-center p-2 min-h-[150px]">
          {isReadingFile ? <Loader size="md" /> : image ? (
            <img src={image} alt="Upload preview" className="max-h-48 object-contain rounded-md" />
          ) : (
             <div className="text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="mt-2 block text-sm font-medium">Use os botões abaixo para enviar uma imagem</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-all transform active:scale-95">
                <CameraIcon className="w-5 h-5" /> Tirar Foto
            </button>
             <button onClick={() => galleryInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-all transform active:scale-95">
                <PaperclipIcon className="w-5 h-5" /> Anexar
            </button>
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageChange} className="hidden" />
            <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageChange} className="hidden" />
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="O que você quer saber sobre a imagem?"
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading || isReadingFile || !image || !prompt}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Analisando...' : 'Analisar Imagem'}
        </button>
        {isLoading && <Loader size="md" />}
        {analysis && (
          <div className="mt-4 bg-gray-900/70 p-4 rounded-lg overflow-y-auto max-h-32">
            <p className="text-gray-300 whitespace-pre-wrap">{analysis}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;