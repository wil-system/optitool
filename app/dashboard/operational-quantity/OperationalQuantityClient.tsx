'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import AssortmentModal from './AssortmentModal';
import { IProduct } from '@/app/types/database';

interface ISetQuantity {
  id: string;
  set_id: string;
  set_name: string;
  remark: string;
  individual_product_ids: string[];
  is_active: boolean;
  product_name: string;
  xs_size: number;
  s_size: number;
  m_size: number;
  l_size: number;
  xl_size: number;
  xxl_size: number;
  fourxl_size: number;
  operational_quantity: number;
}

export default function OperationalQuantityClient() {
  const [data, setData] = useState<ISetQuantity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<{  
    id: string;
    setId: string;
    setName: string;
    remark: string;
    groupedProducts: any[];
    } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/operational-quantity');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '데이터 조회 실패');
      }

      setData(result);
    } catch (err) {
      console.error('데이터 조회 중 오류:', err);
      setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = async (id: string, setId: string, setName: string) => {
    try {
      const response = await fetch(`/api/operational-quantity/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '데이터 조회 실패');
      }

      setSelectedSet({
        id,
        setId,
        setName,
        remark: result.remark,
        groupedProducts: result.groupedProducts,
      });
    } catch (err) {
      console.error('세트 상품 상세 조회 중 오류:', err);
      alert('세트 상품 상세 정보를 가져오는데 실패했습니다.');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">에러: {error}</div>;

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">입력</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세트품번</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
 
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleOpenModal(item.id, item.set_id, item.set_name)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    입력
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.set_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.set_id}</td>
                <td className="px-6 py-4 text-center">{item.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모달 컴포넌트 */}
      {selectedSet && (
        <AssortmentModal
          isOpen={!!selectedSet}
          onClose={() => setSelectedSet(null)}
          setId={selectedSet.setId}
          setName={selectedSet.setName}
          groupedProducts={selectedSet.groupedProducts}
        />
      )}
    </div>
  );
} 