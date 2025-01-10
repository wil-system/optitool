import { useState } from 'react';
import { IChannelDetail } from '@/app/types/statistics';

interface IChannelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IChannelDetail[] | null;
}

export default function ChannelDetailModal({ isOpen, onClose, data }: IChannelDetailModalProps) {
  const [selectedSetCode, setSelectedSetCode] = useState<string | null>(null);
  const [individualCodes, setIndividualCodes] = useState<string[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (!isOpen || !data) return null;

  const handleSetCodeClick = async (setCode: string) => {
    try {
      const response = await fetch(`/api/products/set/${setCode}/items`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setIndividualCodes(data);
      setSelectedSetCode(setCode);
      setIsPopupOpen(true);
    } catch (error) {
      console.error('개별품목코드 조회 실패:', error);
    }
  };

  const headers = [
    { key: 'channel_name', label: '채널명' },
    { key: 'season', label: '운영시즌' },
    { key: 'category', label: '카테고리' },
    { key: 'product_code', label: '상품코드' },
    { key: 'product_name', label: '상품명' },
    { key: 'set_code', label: '세트품번' },
    { key: 'price', label: '판매가격' },
    { key: 'commission_rate', label: '수수료율' },
    { key: 'note', label: '비고' }
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
                  <td className="px-6 py-4 whitespace-nowrap">{item.channel_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.season}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product_name}</td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap cursor-pointer text-blue-600 hover:text-blue-800"
                    onClick={() => handleSetCodeClick(item.set_code)}
                  >
                    {item.set_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.price?.toLocaleString()}원</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.commission_rate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isPopupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">세트품번: {selectedSetCode}</h3>
                <button 
                  onClick={() => setIsPopupOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">개별품목코드</h4>
                <ul className="space-y-2">
                  {individualCodes.map((code, index) => (
                    <li 
                      key={index}
                      className="bg-gray-50 p-2 rounded text-sm"
                    >
                      {code}
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