import React from 'react';
import Loader from './Loader';

interface AITipsProps {
  tip: string;
  isLoading: boolean;
  onGetTip: () => void;
}

const AITips: React.FC<AITipsProps> = ({ tip, isLoading, onGetTip }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-white">Dicas da IA</h3>
      <div className="bg-gray-900/50 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
        {isLoading ? (
          <Loader size="sm" />
        ) : (
          <p className="text-center text-gray-300 italic">
            {tip || "Peça uma dica para otimizar sua viagem!"}
          </p>
        )}
      </div>
      <button
        onClick={onGetTip}
        disabled={isLoading}
        className="mt-4 w-full py-2 px-4 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? 'Pensando...' : 'Me Dê uma Dica!'}
      </button>
    </div>
  );
};

export default AITips;
