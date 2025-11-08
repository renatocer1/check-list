import React, { useRef, useEffect } from 'react';
import { LatLng, StopPoint } from '../types';
import { MapPinIcon } from './icons/MapPinIcon';

interface RouteMapProps {
  route: LatLng[];
  stops: StopPoint[];
}

const RouteMap: React.FC<RouteMapProps> = ({ route, stops }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || route.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    
    const lats = route.map(p => p.lat);
    const lngs = route.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;
    
    const padding = 20;

    const scaleX = (width - 2 * padding) / lngRange;
    const scaleY = (height - 2 * padding) / latRange;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = padding - (minLng * scale) + (width - lngRange * scale) / 2;
    const offsetY = padding - (maxLat * -scale) + (height - latRange * scale) / 2;

    const project = (point: LatLng) => ({
      x: point.lng * scale + offsetX,
      y: -point.lat * scale + offsetY,
    });
    
    // Draw route
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    const startPoint = project(route[0]);
    ctx.moveTo(startPoint.x, startPoint.y);
    route.forEach(point => {
      const { x, y } = project(point);
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#2563EB'; // blue-600
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw start point
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#10B981'; // green-500
    ctx.fill();
    ctx.stroke();

    // Draw end point
    if(route.length > 1) {
        const endPoint = project(route[route.length - 1]);
        ctx.beginPath();
        ctx.arc(endPoint.x, endPoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#EF4444'; // red-500
        ctx.fill();
        ctx.stroke();
    }
    
    // Draw stops
    stops.forEach(stop => {
      const { x, y } = project(stop.location);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#F59E0B'; // yellow-500
      ctx.fill();
    });


  }, [route, stops]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
       <h3 className="text-xl font-bold mb-4 text-white">Mapa da Rota</h3>
       <div className="relative aspect-video bg-gray-900/50 rounded-lg">
        {route.length < 2 ? (
            <div className="flex items-center justify-center h-full text-gray-400">Inicie o rastreamento para ver a rota.</div>
        ) : (
            <canvas ref={canvasRef} className="w-full h-full" />
        )}
       </div>
        <div className="flex justify-around mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Início</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Fim</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Rota</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Parada</div>
        </div>
    </div>
  );
};

export default RouteMap;
