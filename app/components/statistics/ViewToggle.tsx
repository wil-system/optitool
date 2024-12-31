interface ViewToggleProps {
  view: 'list' | 'chart';
  onViewChange: (view: 'list' | 'chart') => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => onViewChange('list')}
        className={`px-4 py-2 rounded ${
          view === 'list' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        리스트
      </button>
      <button
        onClick={() => onViewChange('chart')}
        className={`px-4 py-2 rounded ${
          view === 'chart' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        차트
      </button>
    </div>
  );
} 