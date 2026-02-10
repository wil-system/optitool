'use client';

import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import AssortmentModal from './AssortmentModal';

interface ISetQuantity {
  id: string;
  set_id: string;
  set_name: string;
  remark: string;
  individual_product_ids: string[];
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
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 12;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState({
    set_id: true,   // 세트번호
    set_name: true, // 상품명
  });
  const [selectedSet, setSelectedSet] = useState<{  
    id: string;
    setId: string;
    setName: string;
    remark: string;
    groupedProducts: any[];
    } | null>(null);

  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchData = useCallback(async (backgroundLoad = false) => {
    try {
      if (!backgroundLoad) setIsLoading(true);
      setError(null);

      const activeFields = Object.entries(searchFields)
        .filter(([_, checked]) => checked)
        .map(([field]) => field);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: PAGE_SIZE.toString(),
        searchTerm,
        searchFields: activeFields.join(','),
      });

      const response = await fetch(`/api/operational-quantity?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '데이터 조회 실패');
      }

      if (!result.success) {
        throw new Error(result.error || '데이터 조회 실패');
      }

      setData(result.data || []);
      setTotalPages(result.totalPages || 1);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('데이터 조회 중 오류:', err);
      setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, searchFields]);

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

  const handleSearch = () => {
    setCurrentPage(0);
    if (currentPage === 0) {
      fetchData(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (hasMore) setCurrentPage(prev => prev + 1);
  };

  type SearchField = 'set_id' | 'set_name';
  const handleSearchFieldChange = (field: SearchField) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-card shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
          <h3 className="text-lg font-semibold text-foreground">
            운영가능 수량
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={searchFields.set_id}
                  onChange={() => handleSearchFieldChange('set_id')}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">세트번호</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={searchFields.set_name}
                  onChange={() => handleSearchFieldChange('set_name')}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">상품명</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색어를 입력하세요"
                className="pl-10 pr-4 py-2 border rounded-lg w-64 md:w-80 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="absolute left-3 top-2.5">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              검색
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-100">
            <p className="text-sm text-red-600">에러: {error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">입력</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세트번호</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                      조회된 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr key={index} className="hover:bg-muted">
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenModal(item.id, item.set_id, item.set_name)}
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
                        >
                          입력
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.set_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.set_id}</td>
                      <td className="px-6 py-4 text-center">{item.remark}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-4 flex justify-center items-center border-t border-border">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="px-4 py-2 border rounded-md mr-2 disabled:opacity-50 text-sm hover:bg-muted"
          >
            이전
          </button>
          
          <span className="mx-4 text-sm text-foreground font-medium">
            {currentPage + 1} / {totalPages || 1}
          </span>

          <button 
            onClick={handleNextPage}
            disabled={!hasMore || data.length === 0}
            className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm hover:bg-muted"
          >
            다음
          </button>
        </div>
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