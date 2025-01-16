import { useState } from 'react';
import { IChannelDetailStatistics } from '@/app/types/statistics';

interface IChannelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IChannelDetailStatistics[] | null;
}

export default function ChannelDetailModal({ isOpen, onClose, data }: IChannelDetailModalProps) {
  const [selectedSetCode, setSelectedSetCode] = useState<number | null>(null);
  const [selectedSetProductCode, setSelectedSetProductCode] = useState<string | null>(null);
  const [individualCodes, setIndividualCodes] = useState<{ product_code: string; product_name: string }[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (!isOpen || !data) return null;

  const handleSetCodeClick = async (setCode: number, setProductCode: string) => {
    try {
      const response = await fetch(`/api/products/set/${setCode}/items`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setIndividualCodes(data);
      setSelectedSetCode(setCode as number | null);
      setSelectedSetProductCode(setProductCode);
      setIsPopupOpen(true);
    } catch (error) {
      console.error('개별품목코드 조회 실패:', error);
    }
  };

  const headers = [
    { key: 'date', label: '일자' },
    { key: 'time', label: '시간' },
    { key: 'channel_detail', label: '채널상세' },
    { key: 'category', label: '카테고리' },
    { key: 'product_name', label: '상품명' },
    { key: 'set_product_code', label: '세트품번' },
    { key: 'target', label: '목표' },
    { key: 'performance', label: '실적' },
    { key: 'sales_amount', label: '판매금액' },
    { key: 'achievement_rate', label: '달성률' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-[95%] max-w-7xl p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h2 className="text-xl font-bold">채널 상세 정보</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.channel_detail}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product_name}</td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap cursor-pointer text-blue-600 hover:text-blue-800"
                    onClick={() => handleSetCodeClick(item.set_id , item.set_product_code)}
                  >
                    {item.set_product_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.target?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.performance?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.sales_amount?.toLocaleString()}원</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.achievement_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isPopupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">세트품번: {selectedSetProductCode}</h3>
                <button 
                  onClick={() => setIsPopupOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 overflow-y-auto flex-1">
                <ul className="space-y-2">
                  {individualCodes.map((item, index) => (
                    <li 
                      key={index}
                      className="bg-gray-50 p-2 rounded text-sm"
                    >
                      {item.product_code} - {item.product_name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 