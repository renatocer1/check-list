
const TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 minutos em milissegundos
const TRIAL_START_KEY = 'checklist_trial_start_date';
const AUTH_KEY = 'checklist_device_authorized';

export const initializeTrial = () => {
  if (!localStorage.getItem(TRIAL_START_KEY)) {
    localStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
  }
};

export const isTrialActive = (): boolean => {
  const startStr = localStorage.getItem(TRIAL_START_KEY);
  if (!startStr) return true; // Se não tem data ainda, é o primeiro acesso (será inicializado)

  const startDate = new Date(startStr).getTime();
  const now = new Date().getTime();
  const elapsed = now - startDate;

  return elapsed < TRIAL_DURATION_MS;
};

export const getTrialTimeRemaining = (): number => {
  const startStr = localStorage.getItem(TRIAL_START_KEY);
  if (!startStr) return 0;
  
  const startDate = new Date(startStr).getTime();
  const now = new Date().getTime();
  const elapsed = now - startDate;
  
  return Math.max(0, TRIAL_DURATION_MS - elapsed);
};

export const isDeviceAuthorized = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};

export const authorizeDevice = () => {
  localStorage.setItem(AUTH_KEY, 'true');
};

export const verifyUnlockCode = (inputCode: string): boolean => {
  // Código mestre definido pelo criador
  return inputCode.trim().toUpperCase() === 'CHE123';
};
