import React from 'react';

interface PeriodSelectorProps {
  period: 'daily' | 'monthly' | 'yearly' | 'custom';
  onPeriodChange: (period: 'daily' | 'monthly' | 'yearly' | 'custom') => void;
}

export default function PeriodSelector({ period, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => onPeriodChange('daily')}
        className={`px-4 py-2 rounded-lg ${
          period === 'daily'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        일별
      </button>
      <button
        onClick={() => onPeriodChange('monthly')}
        className={`px-4 py-2 rounded-lg ${
          period === 'monthly'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        월별
      </button>
      <button
        onClick={() => onPeriodChange('yearly')}
        className={`px-4 py-2 rounded-lg ${
          period === 'yearly'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        연도별
      </button>
      <button
        onClick={() => onPeriodChange('custom')}
        className={`px-4 py-2 rounded-lg ${
          period === 'custom'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        기간별
      </button>
    </div>
  );
} 