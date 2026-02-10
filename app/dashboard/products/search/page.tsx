'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface IProductSearchItem {
  PROD_CD: string;
  PROD_DES: string;
  SIZE_DES: string;
  UNIT: string;
  IN_PRICE: string;
  OUT_PRICE: string;
  BAR_CODE: string;
  REMARKS: string;
}

export default function ProductSearchPage() {
  const [products, setProducts] = useState<IProductSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ecountZone, setEcountZone] = useState<string | null>(null);
  const [ecountSessionId, setEcountSessionId] = useState<string | null>(null);

  const fetchEcountAuth = async () => {
    let currentZone = ecountZone;
    let currentSessionId = ecountSessionId;

    if (!currentZone) {
      const zoneResponse = await fetch('/api/ecount/zone');
      const zoneResult = await zoneResponse.json();
      if (!zoneResult.success) throw new Error(zoneResult.error);
      currentZone = zoneResult.data.zone;
      setEcountZone(currentZone);
    }

    if (!currentSessionId) {
      const loginResponse = await fetch('/api/ecount/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: currentZone }),
      });
      const loginResult = await loginResponse.json();
      if (!loginResult.success) throw new Error(loginResult.error);
      currentSessionId = loginResult.data.sessionId;
      setEcountSessionId(currentSessionId);
    }

    return { zone: currentZone, sessionId: currentSessionId };
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const { zone, sessionId } = await fetchEcountAuth();

      const response = await fetch(`/api/ecount/product-search?zone=${zone}&sessionId=${sessionId}&prodCd=${searchTerm}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setProducts(result.data || []);
      
    } catch (err) {
      console.error('검색 에러:', err);
      alert(err instanceof Error ? err.message : '조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              품목조회 (ECOUNT 실시간)
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="품목코드 또는 품목명"
                  className="pl-10 pr-4 py-2 border rounded-lg w-80"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '조회 중...' : '조회'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목코드</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">규격</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단위</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">입고단가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">출고단가</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">바코드</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      {isLoading ? <LoadingSpinner /> : '조회된 데이터가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.PROD_CD}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.PROD_CD}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.PROD_DES}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.SIZE_DES}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.UNIT}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {parseFloat(product.IN_PRICE).toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {parseFloat(product.OUT_PRICE).toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.BAR_CODE}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
