
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ChecklistItem, TripData } from "../types";
import { VEHICLE_CONDITION_CODES } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// --- EXISTING FEATURES ---

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

    return response.text || "Não foi possível analisar.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Desculpe, erro na análise.";
  }
};

export const summarizeChecklistIssues = async (items: ChecklistItem[]): Promise<string> => {
  const issues = items.filter(item => !item.checked && item.observation);
  if (issues.length === 0) {
    return "Checklist ok. Nenhuma pendência.";
  }
  const prompt = `Resuma problemas: ${issues.map(item => `- ${item.label}: ${item.observation}`).join('\n')}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) { return "Erro ao resumir."; }
};

export const analyzeVehicleDamage = async (imageBase64: string, mimeType: string): Promise<{ damageCode: string; description: string } | null> => {
  const codes = Object.entries(VEHICLE_CONDITION_CODES).map(([code, desc]) => `${code} = ${desc}`).join(', ');
  const prompt = `Analise a imagem. Identifique o dano e classifique: ${codes}.`;

  try {
     const imagePart = { inlineData: { data: imageBase64, mimeType } };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, {text: prompt}] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            damageCode: { type: Type.STRING },
            description: { type: Type.STRING },
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) { return null; }
};

export const getImprovementSuggestion = async (tripData: TripData): Promise<string> => {
  const prompt = `Dê uma dica rápida e útil de segurança ou economia para um motorista de ${tripData.vehicleType}.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
  } catch { return "Dirija com cuidado!"; }
};

// --- NEW ADVANCED FEATURES ---

// 1. Thinking Mode for Complex Diagnostics
export const diagnoseVehicleIssue = async (problemDescription: string, vehicleContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Atue como um mecânico especialista sênior. O motorista relatou: "${problemDescription}". Veículo: ${vehicleContext}. Pense passo a passo nas possíveis causas, sintomas correlacionados e recomende a ação imediata.`,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Budget ajustado para resposta rápida mas pensada
      }
    });
    return response.text || "Não consegui formular um diagnóstico.";
  } catch (error) {
    console.error("Thinking mode error:", error);
    return "Erro ao processar diagnóstico complexo.";
  }
};

// 2. Maps Grounding
export const findNearbyServices = async (query: string, lat: number, lng: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Encontre: ${query}. Forneça nomes, endereços e avaliações se possível.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      }
    });
    // Extract chunks for UI if needed, but returning text is simpler for now
    return response.text || "Nenhum local encontrado nas proximidades.";
  } catch (error) {
    console.error("Maps grounding error:", error);
    return "Erro ao buscar no mapa.";
  }
};

// 3. Search Grounding
export const searchInfo = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Pesquise informações recentes sobre: ${query}. Responda de forma resumida para um motorista.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    return response.text || "Sem informações encontradas.";
  } catch (error) {
    console.error("Search grounding error:", error);
    return "Erro na pesquisa.";
  }
};

// 4. Image Editing (Nano Banana / Gemini Flash Image)
export const editDamageImage = async (imageBase64: string, mimeType: string, instruction: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: instruction } // e.g., "Circule o arranhão em vermelho"
        ]
      }
    });
    
    // Iterate to find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Image editing error:", error);
    return null;
  }
};

// 5. Image Generation (Reference Parts)
export const generateReferenceImage = async (partName: string): Promise<string | null> => {
  try {
    // Using generateContent for 3-pro-image-preview as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `Uma foto técnica e clara de uma peça automotiva nova: ${partName}, fundo branco, alta qualidade.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

// Export AI instance for Live API usage in components
export { ai };
