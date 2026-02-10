"use client"

import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { format } from 'date-fns';

interface ISizeData {
  size: string;
  quantity: number;
  percent: number;
}

interface IOperationalQuantity {
  id: string;
  set_id: string;
  set_name: string;
  sizes: ISizeData[];
  total_quantity: number;
  created_at: string;
}

export default function OperationalQuantityListClient() {
  const [data, setData] = useState<IOperationalQuantity[]>([]);
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

      const response = await fetch(`/api/operational-quantity/list?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
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

  const handleSearch = () => {
    // products/list/page.tsx 패턴: 페이지를 0으로 리셋 후, 이미 0이면 수동 호출
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
      [field]: !prev[field],
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/operational-quantity/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // 삭제 후 현재 페이지 유지(비어있어도 사용자가 이전 눌러 이동 가능)
      if (currentPage === 0) {
        fetchData(false);
      } else {
        setCurrentPage(0);
      }
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-card shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
          <h3 className="text-lg font-semibold text-foreground">
            운영수량 목록
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
                className="pl-10 pr-4 py-2 border border-border rounded-lg w-64 md:w-80 text-sm bg-card text-foreground"
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
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    등록일자
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    상품명
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    세트번호
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[800px]">
                    사이즈별 수량
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    총 수량
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                      등록된 운영수량 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="">
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          {format(new Date(item.created_at), 'yyyy-MM-dd')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          {format(new Date(item.created_at), "HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{item.set_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground">{item.set_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2 min-w-[800px]">
                          {item.sizes.map((sizeData, index) => (
                            <div 
                              key={index} 
                              className="flex-1 flex flex-col items-center bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 shadow-sm "
                            >
                              <div className="text-lg font-bold text-foreground mb-2">
                                {sizeData.size}
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="text-sm font-medium text-foreground">
                                  {sizeData.quantity.toLocaleString()}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {sizeData.percent}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <div className="text-sm font-bold text-blue-700">
                            {item.total_quantity.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">총계</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
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
    </div>
  );
} 