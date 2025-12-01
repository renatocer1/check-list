
import React, { useState } from 'react';
import { verifyUnlockCode, authorizeDevice } from '../utils/authSecurity';

const AccessLock: React.FC<{ onUnlock: () => void, onAdminAccess: () => void }> = ({ onUnlock, onAdminAccess }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyUnlockCode(inputCode)) {
      authorizeDevice();
      onUnlock();
    } else {
      setError(true);
      setInputCode('');
    }
  };

  const handleRequestAccess = () => {
    const phoneNumber = "5521987058114";
    const text = `Olá! Meu período de teste de 30 minutos no App de Checklist acabou. Gostaria de adquirir o código de liberação definitiva.`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-600/20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Período de Teste Expirado</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Seus 30 minutos de acesso gratuito acabaram. Para continuar utilizando o Checklist Inteligente, solicite seu código de liberação.
        </p>
        
        <form onSubmit={handleUnlock} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Código de Acesso"
              value={inputCode}
              onChange={(e) => { setError(false); setInputCode(e.target.value); }}
              className="w-full text-center bg-gray-700 border-2 border-gray-600 rounded-lg py-3 px-4 text-xl text-white font-bold tracking-widest focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500 uppercase"
            />
            {error && <p className="text-red-400 text-xs mt-2">Código incorreto. Tente novamente.</p>}
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95"
          >
            Liberar App
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col gap-3">
          <button 
            onClick={handleRequestAccess}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Pedir acesso via WhatsApp
          </button>
          
          <button onClick={onAdminAccess} className="text-xs text-gray-500 hover:text-gray-300 transition-colors mt-2">
            Área do Gestor (Login)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessLock;
