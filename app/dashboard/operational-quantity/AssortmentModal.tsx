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

// 사이즈 정렬 순서
const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '4XL'];

// 사이즈 정렬 함수
const compareSizes = (a: string, b: string): number => {
  // 'FREE' 또는 비슷한 문자열은 항상 마지막으로
  if (a.toUpperCase().includes('FREE')) return 1;
  if (b.toUpperCase().includes('FREE')) return -1;

  // 숫자인 경우 숫자 크기로 비교
  const numA = parseInt(a);
  const numB = parseInt(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  // 하나만 숫자인 경우, 숫자가 먼저 오도록
  if (!isNaN(numA)) return -1;
  if (!isNaN(numB)) return 1;

  // 문자열인 경우 sizeOrder 배열 기준으로 정렬
  const indexA = sizeOrder.indexOf(a);
  const indexB = sizeOrder.indexOf(b);
  
  // sizeOrder에 없는 문자열은 마지막으로 (FREE 앞에)
  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  
  return indexA - indexB;
};

// 동적 사이즈 매핑 함수
const getSizeMapping = (items: any[]) => {
  const sizes = new Set<string>();
  items.forEach(item => {
    if (item.specification) {
      sizes.add(item.specification);
    }
  }); 
  
  // 사이즈 정렬
  return Array.from(sizes)
    .sort(compareSizes)
    .reduce((acc, size) => {
      // 데이터베이스 컬럼명 규칙에 맞게 변환
      const key = size.toLowerCase()
        .replace(/^(\d+)$/, 'size_$1') // 숫자만 있는 경우 (예: "90" -> "size_90")
        .replace('xl', 'xl_size')
        .replace('xs', 'xs_size')
        .replace('s', 's_size')
        .replace('m', 'm_size')
        .replace('l', 'l_size')
        .replace('xxl', 'xxl_size')
        .replace('4xl', 'fourxl_size')
        .replace('free', 'free_size')
        .replace(/[^a-z0-9_]/g, '_'); // 특수문자를 _로 변환
      acc[key] = size;
      return acc;
    }, {} as { [key: string]: string });
};

export default function AssortmentModal({ isOpen, onClose, setId, setName, groupedProducts = [] }: IAssortmentModalProps) {
  // 동적으로 사이즈 매핑 생성
  const sizeLabels = getSizeMapping(groupedProducts.flatMap(group => group.items));
  
  const [assortments, setAssortments] = useState<{ [key: string]: number }>(() => 
    Object.keys(sizeLabels).reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
  );

  const [calculatedQuantities, setCalculatedQuantities] = useState<{ [key: string]: number }>(() =>
    Object.keys(sizeLabels).reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
  );

  // 사이즈별 최소 재고 계산 함수를 상단으로 이동
  const calculateMinStockBySizes = () => {
    const sizeStocks: { [key: string]: number } = {};

    // 모든 그룹의 아이템을 순회하며 사이즈별 최소 재고 계산
    groupedProducts.forEach(group => {
      group.items.forEach(item => {
        if (item.specification) {
          // 해당 사이즈가 처음 나오는 경우 Infinity로 초기화
          if (!(item.specification in sizeStocks)) {
            sizeStocks[item.specification] = Infinity;
          }
          // 현재 재고와 기존 최소값 비교
          sizeStocks[item.specification] = Math.min(
            sizeStocks[item.specification], 
            item.total !== undefined ? item.total : Infinity
          );
        }
      });
    });

    // Infinity 값을 0으로 변환
    Object.keys(sizeStocks).forEach(size => {
      if (sizeStocks[size] === Infinity || isNaN(sizeStocks[size])) {
        sizeStocks[size] = 0;
      }
    });

    return sizeStocks;
  };

  const minStocks = calculateMinStockBySizes();

  // 최소 재고 총합계 계산 함수 추가
  const totalMinStock = Object.values(minStocks).reduce((sum, stock) => sum + stock, 0);

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

      // 사이즈별 수량과 퍼센트를 순서대로 정렬하여 매핑
      const sortedSizes = Object.entries(sizeLabels)
        .sort(([, a], [, b]) => compareSizes(a, b))
        .map(([key, label]) => {
          const percent = assortments[key] || 0;
          // operationalQuantity를 기준으로 수량 계산
          const quantity = percent > 0 ? Math.round(operationalQuantity * (percent / 100)) : 0;
          
          return {
            sizeData: `${label}:${quantity}`,
            percent: percent
          };
        });

      // API 요청 데이터 구성
      const requestData = {
        setId,
        setName,
        totalQuantity: operationalQuantity,
        // size_1부터 size_9까지 순서대로 매핑
        ...sortedSizes.reduce((acc, { sizeData }, index) => ({
          ...acc,
          [`size_${index + 1}`]: sizeData
        }), {}),
        // size_percent_1부터 size_percent_9까지 순서대로 매핑
        ...sortedSizes.reduce((acc, { percent }, index) => ({
          ...acc,
          [`size_percent_${index + 1}`]: percent || null
        }), {})
      };

      console.log('Request Data:', requestData); // 디버깅용 로그

      const response = await fetch('/api/operational-quantity/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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
                              <div className="font-medium">{item.specification || '-'}</div>
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
                    <td className="px-3 py-2 text-right font-medium">총합계</td>
                    <td className="px-3 py-2 text-center font-medium text-blue-600">
                      {totalMinStock.toLocaleString()}
                    </td>
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