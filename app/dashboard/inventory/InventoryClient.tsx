'use client';

import { useState, useEffect } from 'react';
import { IInventoryData } from '@/app/types/inventory';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import InventoryTable from '@/app/dashboard/inventory/InventoryTable';

// 진행 상태를 위한 타입 정의
type ProgressStatus = {
  zone: 'pending' | 'complete' | 'error' | null;
  login: 'pending' | 'complete' | 'error' | null;
  inventory: 'pending' | 'complete' | 'error' | null;
};

export default function InventoryClient() {
  const [data, setData] = useState<IInventoryData[]>([]);
  const [filteredData, setFilteredData] = useState<IInventoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState({
    product_code: true,
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

  // 컴포넌트 마운트 시 localStorage에서 값 불러오기
  useEffect(() => {
    const savedZone = localStorage.getItem('ecountZone');
    const savedSessionId = localStorage.getItem('ecountSessionId');
    if (savedZone) setEcountZone(savedZone);
    if (savedSessionId) setEcountSessionId(savedSessionId);
  }, []);

  // 컴포넌트 마운트 시 inventory_history 데이터 로드
  useEffect(() => {
    const fetchInventoryHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/inventory/history');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error);
        }

        setData(result.data);
        setFilteredData(result.data);
        
        // 첫 번째 아이템의 업데이트 날짜를 마지막 동기화 날짜로 설정
        if (result.data && result.data.length > 0) {
          setLastSyncDate(result.data[0].updated_at);
        }
      } catch (err) {
        console.error('재고 이력 조회 에러:', err);
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryHistory();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
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
      //if (!currentSessionId) {
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
      //}

      // 재고 데이터 조회
      setProgress(prev => ({ ...prev, inventory: 'pending' }));
      const response = await fetch(`/api/ecount/inventory?zone=${currentZone}&sessionId=${currentSessionId}`);
      const result = await response.json();

      if (!result.success) {
        setProgress(prev => ({ ...prev, inventory: 'error' }));
        throw new Error(result.error);
      }

      setData(result.data);
      setFilteredData(result.data);
      setProgress(prev => ({ ...prev, inventory: 'complete' }));

    } catch (err) {
      console.error('데이터 조회 에러:', err);
      setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      
      localStorage.removeItem('ecountZone');
      localStorage.removeItem('ecountSessionId');
      setEcountZone(null);
      setEcountSessionId(null);
    } finally {
      setLoading(false);
    }
  };

  // 검색 실행 함수
  const handleSearch = () => {
    const filtered = data.filter(item => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        (searchFields.product_code && item.product_code.toLowerCase().includes(searchLower)) ||
        (searchFields.product_name && item.product_name.toLowerCase().includes(searchLower))
      );
    });
    setFilteredData(filtered);
  };

  // Enter 키 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">에러: {error}</div>;

  return (
    <div>
      {/* ECOUNT 데이터 가져오기 버튼과 마지막 동기화 날짜 */}
      <div className="mb-4 flex items-center space-x-4">
        <button
          onClick={fetchData}
          disabled={loading}
          className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg 
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {loading ? '데이터 가져오는 중...' : 'ECOUNT 데이터 가져오기'}
        </button>
        
        {lastSyncDate && (
          <div className="flex items-center text-sm text-gray-600">
            <svg 
              className="w-4 h-4 mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            마지막 동기화: {' '}
            <span className="font-medium ml-1">
              {new Date(lastSyncDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>

      {/* 검색 영역은 데이터가 있을 때만 표시 */}
      {data.length > 0 && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={searchFields.product_code}
                    onChange={(e) => setSearchFields({
                      ...searchFields,
                      product_code: e.target.checked
                    })}
                    className="mr-1"
                  />
                  품목코드
                </label>
                <label className="text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={searchFields.product_name}
                    onChange={(e) => setSearchFields({
                      ...searchFields,
                      product_name: e.target.checked
                    })}
                    className="mr-1"
                  />
                  품목명
                </label>
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
        </div>
      )}

      {error && <div className="text-red-500 mb-4">에러: {error}</div>}
      
      {data.length > 0 ? (
        <InventoryTable data={filteredData} />
      ) : !loading && (
        <div className="text-center text-gray-500 mt-8">
          데이터를 가져오려면 상단의 버튼을 클릭하세요.
        </div>
      )}
    </div>
  );
} 