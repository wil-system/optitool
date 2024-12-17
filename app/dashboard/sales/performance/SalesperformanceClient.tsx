'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { format } from 'date-fns';
import Modal from '@/app/components/common/Modal';

interface Props {
  initialData: any[];
  channels: any[];
}

interface FormData {
  performance: number;
  achievementRate: number;
  temperature: number;
  xs85: number;
  s90: number;
  m95: number;
  l100: number;
  xl105: number;
  xxl110: number;
  xxxl120: number;
}

interface SalesPlan {
  id: string;
  season: string;
  plan_date: string;
  plan_time: string;
  channel_code?: string;
  channel_name: string;
  channel_detail: string;
  product_category: string;
  product_name: string;
  set_id: string;
  sale_price: number;
  commission_rate: number;
  target_quantity: number;
}

interface PerformanceData {
  salesPlanId: number;
  performance: number;
  achievementRate: number;
  // ... 다른 필요한 필드들
}

interface SalesPerformance {
  id: number;
  sales_plan_id: number;
  performance: number;
  achievement_rate: number;
  temperature: number;
  created_at: string;
  updated_at: string;
  plan_date: string;
  plan_time: string;
  season: string;
  channel_name: string;
  channel_detail: string;
  product_category: string;
  product_name: string;
  set_id: string;
  sale_price: number;
  target_quantity: number;
  commission_rate: number;
}

export default function SalesPlanListClient({ initialData, channels }: Props) {
  const itemsPerPage = 10;
  
  const [data, setData] = useState<SalesPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SalesPerformance | null>(null);
  const [formData, setFormData] = useState<FormData>({
    performance: 0,
    achievementRate: 0,
    temperature: 0,
    xs85: 0,
    s90: 0,
    m95: 0,
    l100: 0,
    xl105: 0,
    xxl110: 0,
    xxxl120: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    season: false,
    channel: false,
    channelDetail: false,
    category: false,
    productName: false,
    setId: false
  });

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/sales/performance?page=${page - 1}&dataType=sales`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        if (page === 1) {
          setData(result.data);
        } else {
          setData(prev => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
        setCurrentPage(page);
      }
    } catch (error) {
      
      setError(error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
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
            <p className="mt-2 text-sm text-gray-500">표시할 판매 계획이 없습니다.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredPlans = data.filter(plan => {
    if (appliedSearchTerm === '') return true;
    
    const searchValue = appliedSearchTerm.toLowerCase();
    return (
      (searchFilters.season && plan.season?.toLowerCase().includes(searchValue)) ||
      (searchFilters.channel && plan.channel_name?.toLowerCase().includes(searchValue)) ||
      (searchFilters.channelDetail && plan.channel_detail?.toLowerCase().includes(searchValue)) ||
      (searchFilters.category && plan.product_category?.toLowerCase().includes(searchValue)) ||
      (searchFilters.productName && plan.product_name?.toLowerCase().includes(searchValue)) ||
      (searchFilters.setId && plan.set_id?.toLowerCase().includes(searchValue))
    );
  });

  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const currentItems = filteredPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '원';
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

  const handleRowClick = (plan: SalesPerformance) => {
    setSelectedRowId(Number(plan.id) === selectedRowId ? null : Number(plan.id));
  };

  const handleRegisterClick = (plan: SalesPerformance, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlan(plan);
    setFormData({
      performance: 0,
      achievementRate: 0,
      temperature: 0,
      xs85: 0,
      s90: 0,
      m95: 0,
      l100: 0,
      xl105: 0,
      xxl110: 0,
      xxxl120: 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !formData.performance) {
      alert('실적을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/sales/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salesPlanId: String(selectedPlan.id)
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('실적이 성공적으로 등록되었습니다.');
        setIsModalOpen(false);
        fetchData(currentPage);
      } else {
        alert(result.message || '실적 등록 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('실적 등록 중 오류 발생:', error);
      alert('실적 등록 중 오류가 발생했습니다.');
    }
  };

  const getTotalSum = () => {
    return formData.xs85 + formData.s90 + formData.m95 + formData.l100 + 
           formData.xl105 + formData.xxl110 + formData.xxxl120;
  };

  const formatNumber = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseFormattedNumber = (value: string) => {
    return Number(value.replace(/,/g, ''));
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              판매실적 등록
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={searchFilters.season}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, season: e.target.checked }))}
                  />
                  <span className="ml-2">운영시즌</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={searchFilters.channel}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, channel: e.target.checked }))}
                  />
                  <span className="ml-2">판매채널</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={searchFilters.channelDetail}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, channelDetail: e.target.checked }))}
                  />
                  <span className="ml-2">채널상세</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={searchFilters.category}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.checked }))}
                  />
                  <span className="ml-2">카테고리</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={searchFilters.productName}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, productName: e.target.checked }))}
                  />
                  <span className="ml-2">상품명</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={searchFilters.setId}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, setId: e.target.checked }))}
                  />
                  <span className="ml-2">세트품번</span>
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

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">운영시즌</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매채널</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널상세</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세트품번</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">판매가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">수수료</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">목표</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">등록</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((plan) => (
                  <tr 
                    key={plan.id} 
                    onClick={() => handleRowClick(plan)} 
                    className={`cursor-pointer relative ${
                      selectedRowId === plan.id 
                        ? 'bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.season}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(plan.plan_date), 'yyyy-MM-dd')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.plan_time?.substring(0, 5)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.channel_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.channel_detail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.product_category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.set_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPrice(plan.sale_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{plan.commission_rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{plan.target_quantity.toLocaleString()}개</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {selectedRowId === plan.id && (
                        <button
                          onClick={(e) => handleRegisterClick(plan, e)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          등록
                        </button>
                      )}
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
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 disabled:opacity-50"
              >
                다음
              </button>
            </nav>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">실적 입력</h2>
            <div className="space-y-6 w-[800px]">
              <div className="bg-blue-100 p-6 rounded-lg border-2 border-blue-200 shadow">
                <h3 className="text-sm font-semibold text-blue-800 mb-4 text-center">기본 정보</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-3 rounded-md border-2 border-gray-300 shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      실적 <span className="text-red-500">*</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (목표: {selectedPlan ? formatNumber(selectedPlan.target_quantity) : '0'}개)
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-md border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center"
                      value={formData.performance ? formatNumber(formData.performance) : ''}
                      onChange={(e) => {
                        const value = parseFormattedNumber(e.target.value);
                        if (!isNaN(value)) {
                          setFormData({
                            ...formData, 
                            performance: value,
                            achievementRate: selectedPlan ? (value / selectedPlan.target_quantity) * 100 : 0
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="bg-white p-3 rounded-md border-2 border-gray-300 shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-center">달성율 (%)</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-2 border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed text-center"
                      value={formData.achievementRate.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="bg-white p-3 rounded-md border-2 border-gray-300 shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-center">당일온도 (��C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="block w-full rounded-md border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                      value={formData.temperature || ''}
                      onChange={(e) => setFormData({...formData, temperature: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-100 p-6 rounded-lg border-2 border-green-200 shadow">
                <h3 className="text-sm font-semibold text-green-800 mb-4 text-center">사이즈별 수량</h3>
                <div className="grid grid-cols-8 gap-4">
                  {[
                    { label: '85(XS)', key: 'xs85' },
                    { label: '90(S)', key: 's90' },
                    { label: '95(M)', key: 'm95' },
                    { label: '100(L)', key: 'l100' },
                    { label: '105(XL)', key: 'xl105' },
                    { label: '110(XXL)', key: 'xxl110' },
                    { label: '120(4XL)', key: 'xxxl120' }
                  ].map(({ label, key }) => (
                    <div key={key} className="bg-white p-3 rounded-md border-2 border-gray-300 shadow">
                      <label className="block text-xs font-medium text-gray-700 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        className="block w-full rounded-md border-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                        value={formData[key as keyof FormData] || ''}
                        onChange={(e) => setFormData({...formData, [key]: Number(e.target.value)})}
                      />
                    </div>
                  ))}
                  <div className="bg-white p-3 rounded-md border-2 border-gray-300 shadow">
                    <label className="block text-xs font-medium text-gray-700 mb-1 text-center">합계</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-2 border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed text-center"
                      value={formatNumber(getTotalSum())}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 shadow"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border-2 border-blue-600 rounded-md hover:bg-blue-700 hover:border-blue-700 shadow"
                >
                  등록
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}