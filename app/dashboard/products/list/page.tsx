'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { IInventoryHistory } from '@/app/types/database';

export default function ProductListPage() {
  const [products, setProducts] = useState<IInventoryHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState({
    product_code: true,
    item_number: true,
    product_name: true,
    barcode: true,
    distribution_code: true
  });
  const [totalPages, setTotalPages] = useState(1);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const checkSyncAvailability = useCallback((lastSync: string | null) => {
    if (!lastSync) {
      setSyncMessage(null);
      return true;
    }

    const lastSyncTime = new Date(lastSync).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - lastSyncTime) / (1000 * 60);

    if (diffMinutes < 10) {
      const nextAvailable = new Date(lastSyncTime + 10 * 60 * 1000);
      const hours = nextAvailable.getHours().toString().padStart(2, '0');
      const minutes = nextAvailable.getMinutes().toString().padStart(2, '0');
      setSyncMessage(`${hours}시 ${minutes}분에 사용 가능`);
      return false;
    } else {
      setSyncMessage(null);
      return true;
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ecount/sync-status');
      const result = await response.json();
      if (result.success) {
        setLastSyncAt(result.last_sync_at);
        checkSyncAvailability(result.last_sync_at);
      }
    } catch (error) {
      console.error('동기화 상태 조회 오류:', error);
    }
  }, [checkSyncAvailability]);

  const fetchProducts = useCallback(async (backgroundLoad = false) => {
    try {
      if (!backgroundLoad) {
        setIsLoading(true);
      }
      
      const activeFields = Object.entries(searchFields)
        .filter(([_, checked]) => checked)
        .map(([field]) => field);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: PAGE_SIZE.toString(),
        searchTerm: searchTerm,
        searchFields: activeFields.join(',')
      });

      const response = await fetch(`/api/products?${params}`);
      
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }

      const { data, totalPages: pages, hasMore } = await response.json();
      
      setProducts(data || []);
      setTotalPages(pages);
      setHasMore(hasMore);
    } catch (error) {
      console.error('상품 목록 조회 중 오류:', error);
      alert('상품 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, searchFields]);

  useEffect(() => {
    // 페이지 변경 시에만 호출
    fetchProducts(true);
    fetchSyncStatus();
    
    const interval = setInterval(fetchSyncStatus, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); 

  const handleSearch = () => {
    // 1. 페이지를 0으로 먼저 초기화
    setCurrentPage(0);
    
    // 2. 만약 현재 페이지가 이미 0이었다면 useEffect가 작동하지 않으므로 수동 호출
    // 현재 페이지가 0이 아니었다면 useEffect([currentPage])에 의해 fetchProducts가 호출됨
    if (currentPage === 0) {
      fetchProducts(false);
    }
  };

  const handleEcountSync = async () => {
    if (syncMessage) return;

    try {
      setIsSyncing(true);
      
      const zoneResponse = await fetch('/api/ecount/zone');
      const zoneResult = await zoneResponse.json();
      if (!zoneResult.success) throw new Error(zoneResult.error);
      const zone = zoneResult.data.zone;

      const loginResponse = await fetch('/api/ecount/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone }),
      });
      const loginResult = await loginResponse.json();
      if (!loginResult.success) throw new Error(loginResult.error);
      const sessionId = loginResult.data.sessionId;

      const syncResponse = await fetch('/api/ecount/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone, sessionId }),
      });

      const syncResult = await syncResponse.json();

      if (!syncResponse.ok) {
        throw new Error(syncResult.error || '동기화 실패');
      }

      alert(syncResult.message);
      fetchSyncStatus();
      fetchProducts();
    } catch (error) {
      console.error('ECOUNT 동기화 에러:', error);
      alert(error instanceof Error ? error.message : '동기화 중 오류가 발생했습니다.');
      fetchSyncStatus();
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  type SearchField = 'product_code' | 'item_number' | 'product_name' | 'barcode' | 'distribution_code';
  const handleSearchFieldChange = (field: SearchField) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          {isSyncing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
              <div className="bg-card p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xl font-bold text-foreground">ECOUNT와 동기화 중입니다</div>
                <p className="text-muted-foreground text-sm">잠시만 기다려 주세요. 페이지를 새로고침하지 마세요.</p>
              </div>
            </div>
          )}
          <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
            <h3 className="text-lg font-semibold text-foreground">
              상품목록
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.product_code}
                    onChange={() => handleSearchFieldChange('product_code')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">품목코드</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.item_number}
                    onChange={() => handleSearchFieldChange('item_number')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">품번</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.product_name}
                    onChange={() => handleSearchFieldChange('product_name')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">품목명</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.barcode}
                    onChange={() => handleSearchFieldChange('barcode')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">바코드</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.distribution_code}
                    onChange={() => handleSearchFieldChange('distribution_code')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">유통코드</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 md:w-80 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
              <div className="flex flex-col items-end relative">
                <button
                  onClick={handleEcountSync}
                  disabled={isSyncing || !!syncMessage}
                  className={`px-4 py-2 rounded-md text-sm flex items-center transition-colors ${
                    isSyncing || !!syncMessage
                      ? 'bg-gray-300 text-muted-foreground cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isSyncing ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      ECOUNT 동기화
                    </>
                  )}
                </button>
                {syncMessage && (
                  <span className="text-[10px] text-red-500 absolute -bottom-4 right-0 font-medium whitespace-nowrap">
                    {syncMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      품목코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      품번
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      품목명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      사이즈
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      바코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      유통코드
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        조회된 상품이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {product.product_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {product.item_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground ">
                          {product.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {product.specification || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {product.barcode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {product.distribution_code || '-'}
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
              disabled={!hasMore || products.length === 0}
              className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm hover:bg-muted"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
