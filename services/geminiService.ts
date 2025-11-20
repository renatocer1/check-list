
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ChecklistItem, TripData } from "../types";
import { VEHICLE_CONDITION_CODES } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this context, we assume the key is present.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Desculpe, não consegui analisar a imagem.";
  }
};

export const summarizeChecklistIssues = async (items: ChecklistItem[]): Promise<string> => {
  const issues = items.filter(item => !item.checked && item.observation);
  if (issues.length === 0) {
    return "Todos os itens do checklist foram verificados e estão em conformidade. Nenhuma pendência encontrada.";
  }

  const prompt = `
    Você é um assistente de gestão de frotas. Resuma os seguintes problemas encontrados durante um checklist de veículo de forma clara e direta.
    O resumo deve ser útil para um gerente de manutenção.
    
    Itens com problemas:
    ${issues.map(item => `- ${item.label}: ${item.observation}`).join('\n')}
    
    Gere um resumo conciso.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizing issues:", error);
    return "Não foi possível gerar o resumo dos problemas do checklist.";
  }
};

export const analyzeVehicleDamage = async (imageBase64: string, mimeType: string): Promise<{ damageCode: string; description: string } | null> => {
  const codes = Object.entries(VEHICLE_CONDITION_CODES).map(([code, desc]) => `${code} = ${desc}`).join(', ');
  const prompt = `Analise a imagem de uma parte de um veículo. Identifique o tipo de dano principal e classifique-o com um dos seguintes códigos: ${codes}. Descreva o dano de forma concisa.`;

  try {
     const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, {text: prompt}] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            damageCode: {
              type: Type.STRING,
              description: `Um dos códigos: ${Object.keys(VEHICLE_CONDITION_CODES).join(', ')}`,
            },
            description: {
              type: Type.STRING,
              description: 'Uma breve descrição do dano visível na imagem.',
            },
          }
        }
      }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as { damageCode: string; description: string };
  } catch (error) {
    console.error("Error analyzing vehicle damage:", error);
    return null;
  }
};

export const getImprovementSuggestion = async (tripData: TripData): Promise<string> => {
  const kmPercorridos = tripData.finalKm > tripData.initialKm ? tripData.finalKm - tripData.initialKm : 0;
  const consumoCombustivel = kmPercorridos > 0 && tripData.fuelAdded > 0 ? (kmPercorridos / tripData.fuelAdded).toFixed(2) : 'N/A';
  const checklistIssues = tripData.checklist.filter(i => !i.checked);
  const conditionIssues = tripData.vehicleConditions;
  const totalDespesas = tripData.expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const prompt = `
    Você é um assistente especialista em gestão de frotas, finanças e segurança no trânsito.
    Baseado nos dados parciais da viagem abaixo, gere uma dica útil e personalizada para o motorista.
    A dica deve ser curta (1 a 2 frases), amigável e focada em um aspecto relevante: segurança, economia de combustível, gastos ou manutenção.

    Dados da Viagem:
    - Veículo: ${tripData.vehicleType}
    - KM Percorridos até agora: ${kmPercorridos} km
    - Consumo Médio: ${consumoCombustivel} km/l
    - Itens de checklist com problemas: ${checklistIssues.length}
    - Avarias reportadas: ${conditionIssues.length}
    - Número de paradas: ${tripData.stops.length}
    - Total de Despesas Extras (sem combustível): R$ ${totalDespesas.toFixed(2)}

    Exemplos de Dicas:
    - "Notei algumas paradas. Lembre-se de fazer um alongamento rápido para manter o foco na estrada!"
    - "Seus gastos com alimentação estão um pouco altos, que tal planejar a próxima parada em um local mais econômico?"
    - "Com ${checklistIssues.length} ${checklistIssues.length === 1 ? 'item' : 'itens'} pendente no checklist, que tal verificar novamente a iluminação antes de pegar a estrada à noite?"

    Gere uma nova dica relevante para o contexto atual.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting improvement suggestion:", error);
    return "Não foi possível gerar uma dica no momento. Mantenha a direção segura!";
  }
};
