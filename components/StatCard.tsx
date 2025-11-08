
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
      <div className="bg-gray-900/50 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">
          {value} <span className="text-lg text-gray-300">{unit}</span>
        </p>
      </div>
    </div>
  );
};

export default StatCard;
