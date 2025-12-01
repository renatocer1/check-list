
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { TripData } from '../types';

// --- CONFIGURAÇÃO DO FIREBASE ---
// VOCÊ DEVE SUBSTITUIR ISSO PELAS SUAS CHAVES DO CONSOLE DO FIREBASE
// 1. Vá em https://console.firebase.google.com/
// 2. Crie um projeto novo
// 3. Adicione um Web App
// 4. Copie a config e cole abaixo
const firebaseConfig = {
  apiKey: "API_KEY_MOCK_SUBSTITUA_PELO_SEU",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicializa Firebase apenas se não tiver sido inicializado
let app;
let db: any;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("Erro ao inicializar Firebase. Verifique a configuração em services/firebase.ts", e);
}

const TRIPS_COLLECTION = 'trips';

export const saveTripToCloud = async (tripData: TripData): Promise<string> => {
  if (!db) throw new Error("Firebase não configurado.");
  
  try {
    // Adiciona timestamp de criação do servidor
    const docRef = await addDoc(collection(db, TRIPS_COLLECTION), {
      ...tripData,
      createdAt: Timestamp.now()
    });
    console.log("Viagem salva com ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Erro ao salvar viagem: ", e);
    throw new Error("Falha ao salvar no banco de dados online.");
  }
};

export const subscribeToTrips = (callback: (trips: TripData[]) => void) => {
  if (!db) return () => {};

  const q = query(collection(db, TRIPS_COLLECTION), orderBy("createdAt", "desc"));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const trips: TripData[] = [];
    querySnapshot.forEach((doc) => {
      // Convertemos os dados do Firestore para nossa interface
      const data = doc.data() as any;
      trips.push({ ...data, id: doc.id });
    });
    callback(trips);
  }, (error) => {
    console.error("Erro ao buscar dados do Firebase:", error);
  });

  return unsubscribe;
};
