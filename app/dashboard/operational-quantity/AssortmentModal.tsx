'use client';

import { useState } from 'react';
import { IProduct } from '@/app/types/database';

interface IGroupedProduct {
  groupName: string;
  items: {
    product_code: string;
    product_name: string;
    specification: string;
    total: number;
    warehouse_106: number;
    warehouse_3333: number;
    warehouse_12345: number;
    size?: string;
  }[];
}

interface IAssortmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  setId: string;
  setName: string;
  groupedProducts?: IGroupedProduct[];
}

export default function AssortmentModal({ isOpen, onClose, setId, setName, groupedProducts = [] }: IAssortmentModalProps) {
  const [assortments, setAssortments] = useState<{ [key: string]: number }>({
    xs_size: 0,
    s_size: 0,
    m_size: 0,
    l_size: 0,
    xl_size: 0,
    xxl_size: 0,
    fourxl_size: 0,
  });

  const [calculatedQuantities, setCalculatedQuantities] = useState<{ [key: string]: number }>({
    xs_size: 0,
    s_size: 0,
    m_size: 0,
    l_size: 0,
    xl_size: 0,
    xxl_size: 0,
    fourxl_size: 0,
  });

  const sizeLabels = {
    xs_size: 'XS',
    s_size: 'S',
    m_size: 'M',
    l_size: 'L',
    xl_size: 'XL',
    xxl_size: 'XXL',
    fourxl_size: '4XL',
  };

  // 사이즈별 최소 재고 계산 함수를 상단으로 이동
  const calculateMinStockBySizes = () => {
    const sizeStocks: { [key: string]: number } = {
      'XS': Infinity,
      'S': Infinity,
      'M': Infinity,
      'L': Infinity,
      'XL': Infinity,
      'XXL': Infinity,
      '4XL': Infinity
    };

    groupedProducts.forEach(group => {
      group.items.forEach(item => {
        if (item.size && item.total !== undefined) {
          sizeStocks[item.size] = Math.min(sizeStocks[item.size], item.total);
        }
      });
    });

    // Infinity 값을 0으로 변환
    Object.keys(sizeStocks).forEach(size => {
      if (sizeStocks[size] === Infinity) {
        sizeStocks[size] = 0;
      }
    });

    return sizeStocks;
  };

  const minStocks = calculateMinStockBySizes();

  // 아소트 입력 총합계 계산
  const totalAssortmentPercentage = Object.entries(sizeLabels)
    .reduce((total, [size, label]) => {
      if (minStocks[label] === 0) return total;
      return total + (assortments[size] || 0);
    }, 0);

  // 운영가능 총 수량 계산
  const calculateOperationalQuantity = (quantities: { [key: string]: number }) => {
    const validQuantities = Object.values(quantities).filter(q => q > 0);
    return validQuantities.length > 0 ? Math.min(...validQuantities) : 0;
  };

  const handleInputChange = (size: string, value: string) => {
    const sizeLabel = sizeLabels[size as keyof typeof sizeLabels];
    const minStock = minStocks[sizeLabel];
    
    // 최소 재고가 0인 경우 입력 무시
    if (minStock === 0) return;

    const numValue = value === '' ? 0 : parseInt(value, 10);
    setAssortments(prev => ({
      ...prev,
      [size]: numValue
    }));

    // 입력된 퍼센트를 소수점으로 변환하여 계산 (예: 10% -> 0.1)
    const percentageRate = numValue / 100;
    const calculatedQuantity = percentageRate > 0 ? Math.round(minStock / percentageRate) : 0;

    setCalculatedQuantities(prev => ({
      ...prev,
      [size]: calculatedQuantity
    }));
  };

  // 운영가능 총 수량
  const operationalQuantity = calculateOperationalQuantity(calculatedQuantities);

  // 사이즈별 할당 수량 계산
  const calculateAssortmentQuantity = (percentage: number, minStock: number) => {
    if (minStock === 0 || percentage === 0) return 0;
    return Math.round(operationalQuantity * (percentage / 100));
  };

  const handleSubmit = async () => {
    try {
      // 입력값 검증
      if (totalAssortmentPercentage > 100) {
        alert('아소트 총합이 100%를 초과할 수 없습니다.');
        return;
      }

      if (totalAssortmentPercentage === 0) {
        alert('아소트 값을 입력해주세요.');
        return;
      }

      const response = await fetch('/api/operational-quantity/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setId,
          setName,
          assortments,
          calculatedQuantities: Object.entries(sizeLabels).reduce((acc, [size, label]) => ({
            ...acc,
            [size]: calculateAssortmentQuantity(assortments[size], minStocks[label])
          }), {}),
          totalQuantity: operationalQuantity
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      alert('운영가능 수량이 저장되었습니다.');
      onClose();
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{setName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 왼쪽: 세트 구성 상품 목록 */}
          <div>
            <h3 className="text-base font-semibold mb-2">세트 구성 상품</h3>
            <div className="space-y-3">
              {groupedProducts?.map((group, groupIndex) => (
                <div key={groupIndex} className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-blue-600">{group.groupName}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-2 py-1">사이즈</th>
                          <th className="text-center px-2 py-1">총 재고</th>
                          <th className="text-center px-2 py-1">화성창고</th>
                          <th className="text-center px-2 py-1">인천창고</th>
                          <th className="text-center px-2 py-1">반품창고</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item, itemIndex) => (
                          <tr key={itemIndex} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-2 py-1">
                              <div className="font-medium">{item.size || '-'}</div>
                              <div className="text-xs text-gray-500">{item.product_code}</div>
                            </td>
                            <td className="px-2 py-1 text-center font-medium">{item.total}</td>
                            <td className="px-2 py-1 text-center">{item.warehouse_106}</td>
                            <td className="px-2 py-1 text-center">{item.warehouse_3333}</td>
                            <td className="px-2 py-1 text-center">{item.warehouse_12345}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 사이즈별 아소트 입력, 사이즈별 운영 가능 재고, 운영가능 총 수량 */}
          <div className="space-y-3">
            {/* 사이즈별 아소트 입력 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-base font-semibold mb-2">사이즈별 아소트</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-1.5">사이즈</th>
                    <th className="text-center px-3 py-1.5">최소 재고</th>
                    <th className="text-center px-3 py-1.5">아소트 입력(%)</th>
                    <th className="text-center px-3 py-1.5">할당 수량</th>
                    <th className="text-center px-3 py-1.5">계산된 수량</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(sizeLabels).map(([size, label]) => (
                    <tr key={size} className="border-t border-gray-200">
                      <td className="px-3 py-2 font-medium">{label}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-medium ${minStocks[label] === 0 ? 'text-red-500' : 'text-blue-600'}`}>
                          {minStocks[label]}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-2">
                          {minStocks[label] === 0 ? (
                            <div className="w-20 text-center text-gray-500">-</div>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={assortments[size]}
                              onChange={(e) => handleInputChange(size, e.target.value)}
                              className="w-20 border rounded-lg px-2 py-1 text-center text-sm"
                            />
                          )}
                          <span className="text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-medium text-purple-600">
                        {calculateAssortmentQuantity(assortments[size], minStocks[label])}
                      </td>
                      <td className="px-3 py-2 text-center font-medium text-green-600">
                        {calculatedQuantities[size]}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={2} className="px-3 py-2 text-right font-medium">총합계</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-20 text-center font-bold ${
                          totalAssortmentPercentage > 100 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {totalAssortmentPercentage}
                        </span>
                        <span className="text-gray-500">%</span>
                      </div>
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 사이즈별 운영 가능 재고 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-base font-semibold mb-2">사이즈별 운영 가능 재고</h3>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(sizeLabels).map(([size, label]) => (
                  <div key={size} className="text-center">
                    <div className="text-sm font-medium text-gray-600">{label}</div>
                    <div className={`text-base font-bold ${
                      minStocks[label] === 0 ? 'text-red-500' : 'text-blue-600'
                    }`}>
                      {calculateAssortmentQuantity(assortments[size], minStocks[label])}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 운영가능 총 수량 표시 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-base font-semibold mb-2">운영가능 총 수량</h3>
              <div className="w-full px-3 py-1.5 text-xl font-bold text-blue-600">
                {operationalQuantity.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
} 