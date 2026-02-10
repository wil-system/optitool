'use client';

import { useState, useEffect, useCallback } from 'react';
import { IInventoryData } from '@/app/types/inventory';
import { format } from 'date-fns';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { RefreshCw, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 진행 상태를 위한 타입 정의
type ProgressStatus = {
  zone: 'pending' | 'complete' | 'error' | null;
  login: 'pending' | 'complete' | 'error' | null;
  inventory: 'pending' | 'complete' | 'error' | null;
};

export default function InventoryClient() {
  const [data, setData] = useState<IInventoryData[]>([]);
  const [filteredData, setFilteredData] = useState<IInventoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState({
    product_code: true,
    item_number: true,
    product_name: true,
  });

  // Zone과 Session ID를 저장할 상태 추가
  const [ecountZone, setEcountZone] = useState<string | null>(null);
  const [ecountSessionId, setEcountSessionId] = useState<string | null>(null);

  // 진행 상태를 위한 상태 추가
  const [progress, setProgress] = useState<ProgressStatus>({
    zone: null,
    login: null,
    inventory: null,
  });

  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const ITEMS_PER_PAGE = 12;

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
      const response = await fetch('/api/ecount/sync-status?type=ecount_inventory_sync');
      const result = await response.json();
      if (result.success) {
        setLastSyncDate(result.last_sync_at);
        checkSyncAvailability(result.last_sync_at);
      }
    } catch (error) {
      console.error('동기화 상태 조회 오류:', error);
    }
  }, [checkSyncAvailability]);

  // 컴포넌트 마운트 시 localStorage에서 값 불러오기
  useEffect(() => {
    const savedZone = localStorage.getItem('ecountZone');
    const savedSessionId = localStorage.getItem('ecountSessionId');
    if (savedZone) setEcountZone(savedZone);
    if (savedSessionId) setEcountSessionId(savedSessionId);

    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  const fetchInventoryHistory = useCallback(async (backgroundLoad = false) => {
    try {
      if (!backgroundLoad) {
        setIsLoading(true);
      }
      const selectedFields = [];
      if (searchFields.product_code) selectedFields.push('product_code');
      if (searchFields.item_number) selectedFields.push('item_number');
      if (searchFields.product_name) selectedFields.push('product_name');

      const response = await fetch(
        `/api/inventory/history?page=${currentPage - 1}&size=${ITEMS_PER_PAGE}&searchTerm=${searchTerm}&searchFields=${selectedFields.join(',')}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setData(result.data);
      setFilteredData(result.data);
      setTotalPages(result.totalPages);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('재고 이력 조회 에러:', err);
      setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, searchFields]);

  // 컴포넌트 마운트 시 inventory_history 데이터 로드
  useEffect(() => {
    fetchInventoryHistory(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ECOUNT에서 데이터 동기화
  const syncFromEcount = async () => {
    if (syncMessage) return;

    try {
      setIsSyncing(true);
      setError(null);
      setProgress({ zone: null, login: null, inventory: null });

      let currentZone = ecountZone;
      let currentSessionId = ecountSessionId;

      // Zone 정보가 없는 경우 먼저 조회
      if (!currentZone) {
        setProgress(prev => ({ ...prev, zone: 'pending' }));
        const zoneResponse = await fetch('/api/ecount/zone');
        const zoneResult = await zoneResponse.json();
        
        if (!zoneResult.success) {
          setProgress(prev => ({ ...prev, zone: 'error' }));
          throw new Error(zoneResult.error);
        }
        
        currentZone = zoneResult.data.zone;
        localStorage.setItem('ecountZone', zoneResult.data.zone);
        setEcountZone(currentZone);
        setProgress(prev => ({ ...prev, zone: 'complete' }));
      }

      // Session ID가 없는 경우 로그인 수행
      if (!currentZone) {
        throw new Error('Zone 정보가 없습니다.');
      }

      setProgress(prev => ({ ...prev, login: 'pending' }));
      const loginResponse = await fetch('/api/ecount/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zone: currentZone }),
      });
      
      const loginResult = await loginResponse.json();
      
      if (!loginResult.success) {
        setProgress(prev => ({ ...prev, login: 'error' }));
        throw new Error(loginResult.error);
      }
      
      currentSessionId = loginResult.data.sessionId;
      localStorage.setItem('ecountSessionId', loginResult.data.sessionId);
      setEcountSessionId(currentSessionId);
      setProgress(prev => ({ ...prev, login: 'complete' }));

      // 재고 데이터 조회
      setProgress(prev => ({ ...prev, inventory: 'pending' }));
      const response = await fetch(`/api/ecount/inventory?zone=${currentZone}&sessionId=${currentSessionId}`);
      const result = await response.json();

      if (!result.success) {
        setProgress(prev => ({ ...prev, inventory: 'error' }));
        throw new Error(result.error);
      }

      setProgress(prev => ({ ...prev, inventory: 'complete' }));
      
      // 동기화 상태 업데이트
      await fetch('/api/ecount/sync-status?action=update&type=ecount_inventory_sync', {
        method: 'POST'
      });

      alert('동기화가 완료되었습니다.');
      fetchSyncStatus();
      
      // 데이터 다시 로드
      setCurrentPage(1);
      if (currentPage === 1) {
        await fetchInventoryHistory(false);
      }

    } catch (err) {
      console.error('데이터 동기화 에러:', err);
      setError(err instanceof Error ? err.message : '데이터 동기화 중 오류가 발생했습니다.');
      
      localStorage.removeItem('ecountZone');
      localStorage.removeItem('ecountSessionId');
      setEcountZone(null);
      setEcountSessionId(null);
      fetchSyncStatus();
    } finally {
      setIsSyncing(false);
    }
  };

  // 검색 실행 함수
  const handleSearch = () => {
    setCurrentPage(1);
    if (currentPage === 1) {
      fetchInventoryHistory(false);
    }
  };

  // 테이블 렌더링
  const renderTable = () => {
    return (
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="font-semibold w-[120px]">품목코드</TableHead>
              <TableHead className="font-semibold w-[120px]">품번</TableHead>
              <TableHead className="font-semibold w-[200px]">품목명</TableHead>
              <TableHead className="text-center font-semibold w-[100px]">사이즈</TableHead>
              <TableHead className="text-right font-semibold w-[100px]">합계</TableHead>
              <TableHead className="text-right font-semibold bg-blue-50/50 w-[120px]">(신)반품창고</TableHead>
              <TableHead className="text-right font-semibold bg-blue-50/50 w-[120px]">106-화성창고</TableHead>
              <TableHead className="text-right font-semibold bg-blue-50/50 w-[120px]">인천창고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-sm">{item.product_code}</TableCell>
                  <TableCell className="font-mono text-sm">{item.item_number || '-'}</TableCell>
                  <TableCell className="font-medium truncate" title={item.product_name}>
                    {item.product_name}
                  </TableCell>
                  <TableCell className="text-center text-sm">{item.specification || '-'}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{item.total?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.warehouse_3333?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.warehouse_106?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.warehouse_12345?.toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground h-32">
                  표시할 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
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
        {isLoading && !isSyncing && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[9999] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
          <h3 className="text-lg font-semibold text-foreground">
            창고재고수량
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={searchFields.product_code}
                  onChange={(e) => setSearchFields({
                    ...searchFields,
                    product_code: e.target.checked
                  })}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">품목코드</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={searchFields.item_number}
                  onChange={(e) => setSearchFields({
                    ...searchFields,
                    item_number: e.target.checked
                  })}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">품번</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={searchFields.product_name}
                  onChange={(e) => setSearchFields({
                    ...searchFields,
                    product_name: e.target.checked
                  })}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">품목명</span>
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
                <Search className="h-5 w-5 text-muted-foreground" />
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
                onClick={syncFromEcount}
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
                    <RefreshCw className="w-4 h-4 mr-2" />
                    ECOUNT 동기화
                  </>
                )}
              </button>
              {syncMessage ? (
                <span className="text-[10px] text-red-500 absolute -bottom-4 right-0 font-medium whitespace-nowrap">
                  {syncMessage}
                </span>
              ) : lastSyncDate && (
                <span className="text-[10px] text-muted-foreground absolute -bottom-4 right-0 font-medium whitespace-nowrap">
                  마지막 동기화: {format(new Date(lastSyncDate), 'yyyy-MM-dd HH:mm')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-100">
            <p className="text-sm text-red-600">에러: {error}</p>
          </div>
        )}

        {/* 데이터 테이블 */}
        <div className="overflow-x-auto">
          {renderTable()}
        </div>

        {/* 페이지네이션 */}
        {filteredData.length > 0 && totalPages > 1 && (
          <div className="px-4 py-4 flex justify-center items-center border-t border-border">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md mr-2 disabled:opacity-50 text-sm hover:bg-muted"
            >
              이전
            </button>
            <span className="mx-4 text-sm text-foreground font-medium">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={!hasMore}
              className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm hover:bg-muted"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 