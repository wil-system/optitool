import React, { useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';

interface Props {
  initialData: {
    productCode?: string;
    productName?: string;
    category?: string;
    brand?: string;
    status?: string;
  }[];
}

const ProductListClient = ({ initialData }: Props) => {
  // 검색 필터 상태 초기값을 모두 true로 설정
  const [searchFilters, setSearchFilters] = useState({
    productCode: true,
    productName: true,
    category: true,
    brand: true,
    status: true
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={searchFilters.productCode}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, productCode: e.target.checked }))}
                  />
                  <span className="ml-2">상품코드</span>
                </label>
                {/* ... 다른 체크박스들도 ��일한 형식으로 ... */}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  className="pl-10 pr-4 py-2 border rounded-lg w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                검색
              </button>
            </div>
          </div>

          {/* ... 테이블 분 유지 ... */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductListClient; 