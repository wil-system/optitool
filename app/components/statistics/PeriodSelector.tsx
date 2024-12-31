interface PeriodSelectorProps {
  period: 'daily' | 'monthly' | 'yearly';
  onPeriodChange: (period: 'daily' | 'monthly' | 'yearly') => void;
}

export default function PeriodSelector({ period, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => onPeriodChange('daily')}
        className={`px-4 py-2 rounded ${
          period === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        일별
      </button>
      <button
        onClick={() => onPeriodChange('monthly')}
        className={`px-4 py-2 rounded ${
          period === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        월별
      </button>
      <button
        onClick={() => onPeriodChange('yearly')}
        className={`px-4 py-2 rounded ${
          period === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        연도별
      </button>
    </div>
  );
} 