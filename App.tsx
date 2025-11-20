
import React, { useState, useEffect, useRef } from 'react';
import TripSetup from './components/TripSetup';
import Dashboard from './components/Dashboard';
import { TripData, VehicleType, ChecklistItem, MaintenanceAlert, LatLng, StopPoint, VehicleConditionItem, Expense } from './types';
import { CHECKLIST_ITEMS } from './constants';

const APP_STORAGE_KEY = 'checklistApp_tripData';

const App: React.FC = () => {
  const [tripData, setTripData] = useState<TripData | null>(() => {
    try {
      const saved = localStorage.getItem(APP_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to parse trip data from localStorage", error);
      return null;
    }
  });

  const [tripStarted, setTripStarted] = useState<boolean>(() => !!localStorage.getItem(APP_STORAGE_KEY));
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (tripData) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(tripData));
    } else {
      localStorage.removeItem(APP_STORAGE_KEY);
    }
  }, [tripData]);


  const handleStartTrip = (driverName: string, vehicleType: VehicleType, initialKm: number, plate: string) => {
    const checklistTemplate = CHECKLIST_ITEMS[vehicleType] || [];
    const initialChecklist: ChecklistItem[] = checklistTemplate.map(item => ({ ...item, checked: false, observation: '', imageUrl: '' }));
    
    const defaultAlerts: MaintenanceAlert[] = [
      {
        id: 'default-oil-change',
        name: 'Troca de Óleo do Motor',
        type: 'km',
        kmInterval: 10000,
        lastKm: initialKm,
      }
    ];

    setTripData({
      driverName,
      vehicleType,
      plate,
      startTime: new Date().toISOString(),
      initialKm,
      finalKm: 0,
      fuelAdded: 0,
      refuelingCost: 0,
      checklist: initialChecklist,
      maintenanceAlerts: defaultAlerts,
      route: [],
      stops: [],
      vehicleConditions: [],
      expenses: [],
      generalObservations: '',
      driverSignature: '',
    });
    setTripStarted(true);
  };
  
  const handleEndTrip = () => {
    setTripData(null);
    setTripStarted(false);
  };

  const handleUpdateTrip = (data: Partial<Omit<TripData, 'checklist' | 'maintenanceAlerts'>>) => {
    if (tripData) {
      setTripData(prev => ({ ...prev!, ...data }));
    }
  };

  const handleUpdateChecklistItem = (itemId: string, data: Partial<Omit<ChecklistItem, 'id' | 'label'>>) => {
     if (tripData) {
      const updatedChecklist = tripData.checklist.map(item => 
        item.id === itemId ? { ...item, ...data } : item
      );
      setTripData(prev => ({ ...prev!, checklist: updatedChecklist }));
    }
  };

  const handleAddAlert = (alert: Omit<MaintenanceAlert, 'id'>) => {
    if (tripData) {
      const newAlert = { ...alert, id: new Date().toISOString() };
      setTripData(prev => ({
        ...prev!,
        maintenanceAlerts: [...prev!.maintenanceAlerts, newAlert]
      }));
    }
  };

  const handleMarkAlertAsDone = (alertId: string) => {
    if (tripData) {
      const currentKm = tripData.finalKm > 0 ? tripData.finalKm : tripData.initialKm;
      const updatedAlerts = tripData.maintenanceAlerts.map(alert => {
        if (alert.id === alertId) {
          if (alert.type === 'km') {
            return { ...alert, lastKm: currentKm };
          } else {
            return { ...alert, lastDate: new Date().toISOString() };
          }
        }
        return alert;
      });
      setTripData(prev => ({ ...prev!, maintenanceAlerts: updatedAlerts }));
    }
  };
  
  const handleToggleTracking = () => {
    setIsTracking(prev => !prev);
  };

  const handleAddStop = (description: string) => {
     navigator.geolocation.getCurrentPosition(position => {
        const newStop: StopPoint = {
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          timestamp: new Date().toISOString(),
          description,
        };
        setTripData(prev => prev ? ({ ...prev, stops: [...prev.stops, newStop] }) : null);
      });
  };
  
  const handleAddVehicleCondition = (condition: VehicleConditionItem) => {
    setTripData(prev => prev ? ({ ...prev, vehicleConditions: [...prev.vehicleConditions, condition] }) : null);
  };

  const handleUpdateSignature = (signature: string) => {
     setTripData(prev => prev ? ({ ...prev, driverSignature: signature }) : null);
  };
  
  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    if (tripData) {
        const newExpense = { ...expense, id: new Date().toISOString() };
        setTripData(prev => ({
            ...prev!,
            expenses: [...prev!.expenses, newExpense]
        }));
    }
  };
  
  useEffect(() => {
    if (isTracking) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPoint: LatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setTripData(prev => {
            if (!prev) return null;
            // Prevent adding duplicate points
            const lastPoint = prev.route[prev.route.length - 1];
            if (lastPoint && lastPoint.lat === newPoint.lat && lastPoint.lng === newPoint.lng) {
              return prev;
            }
            return { ...prev, route: [...prev.route, newPoint] };
          });
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTracking]);


  return (
    <div>
      {!tripStarted || !tripData ? (
        <TripSetup onStartTrip={handleStartTrip} />
      ) : (
        <Dashboard 
          tripData={tripData}
          isTracking={isTracking}
          onUpdateTrip={handleUpdateTrip}
          onUpdateChecklistItem={handleUpdateChecklistItem}
          onAddAlert={handleAddAlert}
          onMarkAlertAsDone={handleMarkAlertAsDone}
          onToggleTracking={handleToggleTracking}
          onAddStop={handleAddStop}
          onAddVehicleCondition={handleAddVehicleCondition}
          onUpdateSignature={handleUpdateSignature}
          onAddExpense={handleAddExpense}
          onEndTrip={handleEndTrip}
        />
      )}
    </div>
  );
};

export default App;
