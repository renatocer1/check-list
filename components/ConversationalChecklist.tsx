import React, { useState, useEffect, useCallback } from 'react';
import { ChecklistItem } from '../types';
import { generateSpeech } from '../services/geminiService';
import { playAudio } from '../services/audioService';
import Loader from './Loader';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import ChecklistItemModal from './ChecklistItemModal';

interface ConversationalChecklistProps {
  items: ChecklistItem[];
  driverName: string;
  vehicleType: string;
  onUpdateItem: (itemId: string, data: Partial<Omit<ChecklistItem, 'id' | 'label'>>) => void;
  onComplete: () => void;
}

const ConversationalChecklist: React.FC<ConversationalChecklistProps> = ({ items, driverName, vehicleType, onUpdateItem, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true);
    setCurrentQuestion(text);
    const audio = await generateSpeech(text);
    if (audio) {
      await playAudio(audio);
    }
    setIsSpeaking(false);
  }, []);
  
  const proceedToNextQuestion = useCallback(() => {
     setCurrentIndex(prev => prev + 1);
  }, []);

  const askNextQuestion = useCallback(() => {
    if (currentIndex < items.length) {
      const item = items[currentIndex];
      const question = `Vamos checar: ${item.label}. Está tudo certo?`;
      speak(question);
    } else if (!isCompleted) {
      setIsCompleted(true);
      const completionMessage = "Excelente! Checklist concluído. Tenha uma ótima viagem!";
      speak(completionMessage);
      onComplete();
    }
  }, [currentIndex, items, speak, onComplete, isCompleted]);

  useEffect(() => {
    const startConversation = async () => {
      await new Promise(res => setTimeout(res, 500)); 
      const welcomeMessage = `Olá ${driverName}! Vamos preparar seu ${vehicleType} para a viagem. Vou te guiar pelo checklist.`;
      speak(welcomeMessage).then(() => {
        if (!isCompleted) {
          askNextQuestion();
        }
      });
    };
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (currentIndex > 0 && !isCompleted && !editingItem) {
      askNextQuestion();
    }
  }, [currentIndex, isCompleted, askNextQuestion, editingItem]);

  const handleAnswer = (answer: boolean) => {
    if (currentIndex < items.length) {
      const item = items[currentIndex];
      onUpdateItem(item.id, { checked: answer });

      if (!answer) {
        setEditingItem(item); // Open modal for details
      } else {
        proceedToNextQuestion();
      }
    }
  };
  
  const handleModalSave = (observation: string, imageUrl?: string) => {
    if (editingItem) {
      onUpdateItem(editingItem.id, { observation, imageUrl });
    }
    setEditingItem(null);
    proceedToNextQuestion();
  };
  
  const handleModalClose = () => {
    setEditingItem(null);
    proceedToNextQuestion();
  };

  const progress = (currentIndex / items.length) * 100;

  return (
    <>
      {editingItem && (
        <ChecklistItemModal 
          item={editingItem}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
        <h3 className="text-xl font-bold mb-4 text-white">Checklist Conversacional</h3>
        
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
          <p className="text-right text-sm text-gray-400 mt-1">{currentIndex} de {items.length} itens checados</p>
        </div>
        
        <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg p-4 min-h-[80px]">
          {isSpeaking && !currentQuestion ? <Loader size="sm" /> : 
          <p className="text-lg text-center text-gray-200 font-medium">
            {isCompleted ? "Checklist Concluído!" : currentQuestion}
          </p>
          }
        </div>

        {!isCompleted && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(true)}
              disabled={isSpeaking || !!editingItem}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            >
              <CheckIcon className="w-5 h-5" />
              Sim
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={isSpeaking || !!editingItem}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            >
              <XIcon className="w-5 h-5"/>
              Não
            </button>
          </div>
        )}
        
        <div className="mt-4 overflow-y-auto max-h-48 pr-2">
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={item.id} className={`flex items-center justify-between p-2 rounded-md text-sm transition-all ${index > currentIndex ? 'opacity-50' : ''} ${item.checked ? 'bg-green-500/20 text-green-300' : 'bg-gray-700/50 text-gray-400'}`}>
                <span className="flex-grow">{item.label}</span>
                 {!item.checked && item.observation && <span className="text-yellow-400 text-xs mr-2">(Com Obs.)</span>}
                {index < currentIndex ? (item.checked ? <CheckIcon className="w-5 h-5 text-green-400"/> : <XIcon className="w-5 h-5 text-red-400"/>) : null}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </>
  );
};

export default ConversationalChecklist;