
import React, { useEffect, useRef, useState } from 'react';
import { ai } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import Loader from './Loader';

interface LiveVoiceAssistantProps {
  driverName: string;
}

const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({ driverName }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Desconectado');
  const [volume, setVolume] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Audio output helpers
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);

  const stopSession = () => {
    if (sessionRef.current) {
      // No explicit close method on the session promise wrapper easily accessible in all versions, 
      // but usually we just stop sending data. 
      // Ideally we would call session.close() if we had the object stored.
      // Since we rely on the promise pattern, we primarily stop the local processing.
    }
    
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsActive(false);
    setStatus('Desconectado');
    setVolume(0);
    audioContextRef.current = null;
  };

  const startSession = async () => {
    setIsActive(true);
    setStatus('Conectando...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Audio Contexts
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('Ouvindo...');
            
            // Setup Input Stream
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Visualizer volume
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              setVolume(Math.sqrt(sum/inputData.length) * 100);

              // Encode PCM
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              // Create binary string manually to avoid external libs
              let binary = '';
              const bytes = new Uint8Array(int16.buffer);
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const b64 = btoa(binary);

              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: b64
                  }
                });
              });
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
            
            inputSourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              // Decode and Play
              const binaryString = atob(audioData);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              // Decode logic
              const dataInt16 = new Int16Array(bytes.buffer);
              const buffer = outAudioCtx.createBuffer(1, dataInt16.length, 24000);
              const channelData = buffer.getChannelData(0);
              for (let i = 0; i < dataInt16.length; i++) {
                channelData[i] = dataInt16[i] / 32768.0;
              }

              const source = outAudioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outAudioCtx.destination);
              
              const currentTime = outAudioCtx.currentTime;
              if (nextStartTimeRef.current < currentTime) {
                nextStartTimeRef.current = currentTime;
              }
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioQueueRef.current.push(source);
            }
          },
          onclose: () => {
             setStatus('Desconectado');
             setIsActive(false);
          },
          onerror: (e) => {
            console.error(e);
            setStatus('Erro na conexão');
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `Você é um assistente de copiloto para o motorista ${driverName}. Seja breve, útil e amigável. Ajude com checklist e dicas de estrada.`,
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Mic access error:", err);
      setStatus('Sem microfone');
      setIsActive(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-4 flex items-center justify-between border border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-red-500 animate-pulse' : 'bg-blue-600'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
           </svg>
        </div>
        <div>
            <h3 className="font-bold text-white">Copiloto de Voz</h3>
            <p className="text-xs text-gray-400">{status}</p>
        </div>
      </div>
      
      {isActive && (
        <div className="flex gap-1 items-end h-8">
            {[1,2,3,4,5].map(i => (
                <div key={i} className="w-1 bg-blue-400 rounded-t transition-all duration-75" style={{ height: `${Math.min(100, Math.max(10, volume * Math.random() * 2))}%` }}></div>
            ))}
        </div>
      )}

      <button 
        onClick={isActive ? stopSession : startSession}
        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isActive ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        {isActive ? 'Parar' : 'Conversar'}
      </button>
    </div>
  );
};

export default LiveVoiceAssistant;
