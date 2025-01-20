'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface Props {
  initialData: any[];
  channels: any[];
}

interface SalesPerformance {
  set_id: any;
  set_name: any;
  product_name: any;
  product_category: any;
  channel_detail: any;
  channel_name: any;
  season: any;
  id: number;
  sales_plan_id: number;
  performance: number;
  achievement_rate: number;
  temperature: number;
  created_at: string;
  updated_at: string;
  plan_date: string | null;
  plan_time: string | null;
  target_quantity: number;
  product_code: string;
  sale_price: number;
}

type SearchFilterKey = 'season' | 'channel' | 'channelDetail' | 'category' | 'productName' | 'setId';

export default function SalesPerformanceListClient({ initialData, channels }: Props) {
  const itemsPerPage = 10;
  const [data, setData] = useState<SalesPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState<Record<SearchFilterKey, { checked: boolean; label: string }>>({
    season: { checked: true, label: '시즌' },
    channel: { checked: true, label: '판매채널' },
    channelDetail: { checked: true, label: '채널상세' },
    category: { checked: true, label: '카테고리' },
    productName: { checked: true, label: '상품명' },
    setId: { checked: true, label: '세트품번' }
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<SalesPerformance | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [performanceToDelete, setPerformanceToDelete] = useState<SalesPerformance | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage - 1),
        size: '12',  // 페이지 사이즈 12로 통일
        searchTerm: appliedSearchTerm,
        searchFields: Object.entries(searchFilters)
          .filter(([_, value]) => value.checked)
          .map(([key]) => key)
          .join(',')
      });

      const response = await fetch(`/api/sales/performance/list?${params}`);
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }

      const { data, totalPages: pages } = await response.json();
      setData(data || []);
      setTotalPages(pages);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : '데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getChannelName = (channelCode: string | null) => {
    if (!channelCode) return '';
    const channel = channels.find(ch => ch.channel_code === channelCode);
    return channel?.channel_name || '';
  };

  const filteredData = data.filter(item => {
    if (appliedSearchTerm === '') return true;
    
    const searchValue = appliedSearchTerm.toLowerCase().trim();
    return (
      (searchFilters.season.checked && item.season?.toString().toLowerCase().includes(searchValue)) ||
      (searchFilters.channel.checked && item.channel_name?.toString().toLowerCase().includes(searchValue)) ||
      (searchFilters.channelDetail.checked && item.channel_detail?.toString().toLowerCase().includes(searchValue)) ||
      (searchFilters.category.checked && item.product_category?.toString().toLowerCase().includes(searchValue)) ||
      (searchFilters.productName.checked && item.product_name?.toString().toLowerCase().includes(searchValue)) ||
      (searchFilters.setId.checked && item.set_id?.toString().toLowerCase().includes(searchValue))
    );
  });

  
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRowClick = (item: any) => {
    setSelectedPerformance(item);
    setIsDetailModalOpen(true);
  };

  const calculateSizeTotal = (item: any) => {
    const sizes = [
      item.xs85 || 0,
      item.s90 || 0,
      item.m95 || 0,
      item.l100 || 0,
      item.xl105 || 0,
      item.xxl110 || 0,
      item.xxxl120 || 0
    ];
    return sizes.reduce((acc, curr) => acc + curr, 0);
  };

  const calculateSizePercent = (size: number, total: number) => {
    if (total === 0) return 0;
    return ((size / total) * 100).toFixed(1);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '';
    try {
      return timeString.substring(0, 5);
    } catch (error) {
      return timeString;
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('ko-KR');
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/sales/performance/list/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: false }),
      });

      if (!response.ok) {
        throw new Error('삭제 처리 중 오류가 발생했습니다.');
      }

      // 성공적으로 삭제된 후 데이터 새로고침
      await fetchData();
      setIsDeleteModalOpen(false);
      setPerformanceToDelete(null);
    } catch (error) {
      console.error('Error deleting performance:', error);
      alert('삭제 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: SalesPerformance) => {
    e.stopPropagation(); // 행 클릭 이벤트 전파 방지
    setPerformanceToDelete(item);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-red-800">오류 발생</h3>
            </div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              다시 시도
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data.length) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-lg">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">데이터가 없습니다</h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">표시할 판매실적이 없습니다.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              판매실적 목록
            </h3>
            <div className="flex items-center gap-4">
              {/* 검색 필터 체크박스 */}
              <div className="flex items-center gap-2">
                {Object.entries(searchFilters).map(([key, value]) => (
                  <label key={key} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={value.checked}
                      onChange={(e) => setSearchFilters(prev => ({
                        ...prev,
                        [key as SearchFilterKey]: { ...prev[key as SearchFilterKey], checked: e.target.checked }
                      }))}
                    />
                    <span className="ml-2 text-sm text-gray-600">{value.label}</span>
                  </label>
                ))}
              </div>
              {/* 검색창 */}
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

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">운영시즌</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품코드</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매채널</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널상세</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세트품번</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">목표</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">실적</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">달성률</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">판매금액</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"> </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors duration-150 ease-in-out group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-600">{item.season}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-600">{formatDate(item.plan_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-600">{formatTime(item.plan_time)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-600">{item.product_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-600">{item.channel_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-600">{item.channel_detail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-600">{item.product_category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:text-blue-600">{item.set_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right group-hover:text-blue-600">{formatNumber(item.target_quantity)}개</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right group-hover:text-blue-600">{formatNumber(item.performance)}개</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right group-hover:text-blue-600">{item.achievement_rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right group-hover:text-blue-600">{formatPrice(item.sale_price * item.performance)}원</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={(e) => handleDeleteClick(e, item)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white px-4 py-3 flex items-center justify-center border-t border-gray-200 sm:px-6">
            <nav className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
              >
                이전
              </button>
              <span className="mx-4 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
              >
                다음
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {isDetailModalOpen && selectedPerformance && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">판매실적 상세정보</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 컨텐츠 */}
            <div className="grid grid-cols-12 gap-4">
              {/* 기본 정보 & 상품 정보 */}
              <div className="col-span-8 grid grid-cols-2 gap-4">
                {/* 상품명 */}
                <div className="col-span-2 bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">상품명</h3>
                  <p className="text-xl font-bold text-blue-800">{selectedPerformance.set_name}</p>
                </div>

                {/* 기본 정보 */}
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">기본 정보</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="space-y-1 p-3 bg-white rounded shadow-sm border border-blue-100  transition-all">
                      <p className="text-blue-600 font-semibold">일자</p>
                      <p className="font-medium text-gray-800">{formatDate(selectedPerformance.plan_date)}</p>
                    </div>
                    <div className="space-y-1 p-3 bg-white rounded shadow-sm border border-blue-100 transition-all">
                      <p className="text-blue-600 font-semibold">시간</p>
                      <p className="font-medium text-gray-800">{formatTime(selectedPerformance.plan_time)}</p>
                    </div>
                    <div className="space-y-1 p-3 bg-white rounded shadow-sm border border-blue-100 h transition-all">
                      <p className="text-blue-600 font-semibold">온도</p>
                      <p className="font-medium text-gray-800">{selectedPerformance.temperature}°C</p>
                    </div>
                    <div className="space-y-1 p-3 bg-white rounded shadow-sm border border-blue-100  transition-all">
                      <p className="text-blue-600 font-semibold">카테고리</p>
                      <p className="font-medium text-gray-800">{selectedPerformance.product_category}</p>
                    </div>
                    <div className="space-y-1 p-3 bg-white rounded shadow-sm border border-blue-100  transition-all">
                      <p className="text-blue-600 font-semibold">상품코드</p>
                      <p className="font-medium text-gray-800">{selectedPerformance.product_code}</p>
                    </div>
                    <div className="space-y-1 p-3 bg-white rounded shadow-sm border border-blue-100  transition-all">
                      <p className="text-blue-600 font-semibold">판매채널</p>
                      <p className="font-medium text-gray-800">{selectedPerformance.channel_name}</p>
                    </div>
                    <div className="space-y-1 p-3 bg-white rounded shadow-sm border border-blue-100  transition-all">
                      <p className="text-blue-600 font-semibold">채널상세</p>
                      <p className="font-medium text-gray-800">{selectedPerformance.channel_detail}</p>
                    </div>
                    <div className="space-y-1 p-3 bg-white rounded shadow-sm border border-blue-100  transition-all">
                      <p className="text-blue-600 font-semibold">세트품번</p>
                      <p className="font-medium text-gray-800">{selectedPerformance.set_id}</p>
                    </div>
                  </div>
                </div>

                {/* 실적 정보 */}
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">실적 정보</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg text-center">
                      <p className="text-blue-600 font-semibold">목표</p>
                      <p className="text-lg font-bold">{formatNumber(selectedPerformance.target_quantity)}개</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg text-center">
                      <p className="text-blue-600 font-semibold">실적</p>
                      <p className="text-lg font-bold ">{formatNumber(selectedPerformance.performance)}개</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg text-center">
                      <p className="text-blue-600 font-semibold">달성률</p>
                      <p className="text-lg font-bold ">{selectedPerformance.achievement_rate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 사이즈별 정보 */}
              <div className="col-span-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-600 mb-3">사이즈별 정보</h3>
                <div className="space-y-2">
                  {(() => {
                    // 모든 사이즈의 값을 미리 계산하여 최대값 찾기
                    const sizeValues = [
                      { label: 'XS(85)', key: 'xs85' },
                      { label: 'S(90)', key: 's90' },
                      { label: 'M(95)', key: 'm95' },
                      { label: 'L(100)', key: 'l100' },
                      { label: 'XL(105)', key: 'xl105' },
                      { label: 'XXL(110)', key: 'xxl110' },
                      { label: 'XXXL(120)', key: 'xxxl120' }
                    ].map(size => ({
                      ...size,
                      value: Number(selectedPerformance[size.key as keyof SalesPerformance]) || 0
                    }));

                    const maxValue = Math.max(...sizeValues.map(size => size.value));
                    const total = calculateSizeTotal(selectedPerformance);

                    return sizeValues.map(size => {
                      const percent = calculateSizePercent(size.value, total);

                      return (
                        <div key={size.label} className="flex items-center bg-white p-2.5 rounded-md text-sm shadow-sm border border-blue-100">
                          <span className="w-20 font-medium text-gray-700">{size.label}</span>
                          <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${size.value === maxValue && size.value !== 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className={`w-28 text-right text-sm font-medium ${size.value === maxValue && size.value !== 0 ? 'text-red-600' : 'text-gray-700'}`}>
                            {formatNumber(size.value)}개 <span className="text-gray-500">({percent}%)</span>
                          </span>
                        </div>
                      );
                    });
                  })()}
                  <div className="border-t border-blue-200 mt-3 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">총 합계</span>
                      <span className="text-lg font-bold text-blue-600">{formatNumber(calculateSizeTotal(selectedPerformance))}개</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 추가 */}
      {isDeleteModalOpen && performanceToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">삭제 확인</h3>
            <p className="text-sm text-gray-500 mb-4">
              정말로 이 판매실적을 삭제하시겠습니까?<br />
              상품명: {performanceToDelete.set_name}<br />
              세트품번: {performanceToDelete.set_id}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(performanceToDelete.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 