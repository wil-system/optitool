'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { format } from 'date-fns';
import Modal from '@/app/components/common/Modal';
import SalesPlanRegistrationModal from '@/app/components/sales/SalesPlanRegistrationModal';
import { ISalesPerformance, ISalesPlans, ISalesPlanWithPerformance } from '@/app/types/database';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface IChannel {
  id: number;
  channel_code: string;
  channel_name: string;
}

interface ICategory {
  id: number;
  category_name: string;
}

interface ISetProduct {
  id: number;
  set_id: string;
  set_name: string;
  remarks: string;
}

interface Props {
  initialData: ISalesPerformance[];
  channels: IChannel[];
  categories: ICategory[];
  setIds: ISetProduct[];
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
  usOrder: number;
}

export default function SalesPerformanceClient() {
  const itemsPerPage = 12;
  
  const [data, setData] = useState<ISalesPlans[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ISalesPlans | null>(null);
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
    xxxl120: 0,
    usOrder: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ISalesPlans[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    season: true,
    channel: true,
    channelDetail: true,
    category: true,
    productName: true,
    setId: true
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState<ISalesPlanWithPerformance | null>(null);
  const [sets, setSets] = useState<ISetProduct[]>([]);
  const [channels, setChannels] = useState<IChannel[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: String(page - 1),
        dataType: 'sales'
      });

      const [performanceResponse, setsResponse, channelsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/sales/performance?${params}`),
        fetch('/api/sets'),
        fetch('/api/channels'),
        fetch('/api/categories')
      ]);

      if (!performanceResponse.ok || !setsResponse.ok || !channelsResponse.ok || !categoriesResponse.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const [performanceResult, setsResult, channelsResult, categoriesResult] = await Promise.all([
        performanceResponse.json(),
        setsResponse.json(),
        channelsResponse.json(),
        categoriesResponse.json()
      ]);

      if (performanceResult.error) {
        throw new Error(performanceResult.error);
      }

      if (performanceResult.data) {
        setData(performanceResult.data);
        setHasMore(performanceResult.hasMore);
        setCurrentPage(page);
        setTotalPages(performanceResult.totalPages);
      }

      // 추가 데이터 설정
      setSets(setsResult.data || []);
      setChannels(channelsResult.data || []);
      setCategories(categoriesResult.data || []);

    } catch (error) {
      setError(error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const getTotalSum = () => {
    return formData.xs85 + formData.s90 + formData.m95 + formData.l100 + 
           formData.xl105 + formData.xxl110 + formData.xxxl120 + formData.usOrder;
  };

  useEffect(() => {
    const totalSum = getTotalSum();
    setFormData(prev => ({
      ...prev,
      //performance: totalSum,
      achievementRate: selectedPlan ? Number(((formData.performance / selectedPlan.target_quantity) * 100).toFixed(2)) : 0
    }));
  }, [formData.performance, selectedPlan]);

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

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }

    const filteredData = data.filter(plan => {
      const searchValue = searchTerm.toLowerCase();
      return (
        (searchFilters.season && plan.season?.toLowerCase().includes(searchValue)) ||
        (searchFilters.channel && plan.channel_name?.toLowerCase().includes(searchValue)) ||
        (searchFilters.channelDetail && plan.channel_detail?.toLowerCase().includes(searchValue)) ||
        (searchFilters.category && plan.product_category?.toLowerCase().includes(searchValue)) ||
        (searchFilters.productName && plan.product_name?.toLowerCase().includes(searchValue)) ||
        (searchFilters.setId && plan.set_info?.set_id?.toString().toLowerCase().includes(searchValue))
      );
    });
    
    setSearchResults(filteredData);
    setIsSearchActive(true);
    setCurrentPage(1);
  };

  const displayData = isSearchActive ? searchResults : data;

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '원';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRowClick = (e: React.MouseEvent, plan: ISalesPlans) => {
    e.preventDefault();
    const firstCell = e.currentTarget.firstElementChild as HTMLElement;
    const firstCellRect = firstCell.getBoundingClientRect();
    
    setPopupPosition({
      x: firstCellRect.left + (firstCellRect.width / 2),
      y: firstCellRect.top + window.scrollY
    });
    
    if (selectedPlan?.id === plan.id) {
      setShowPopup(!showPopup);
    } else {
      setSelectedPlan(plan);
      setShowPopup(true);
    }
  };

  const handleRegisterClick = (plan: ISalesPlans, e: React.MouseEvent) => {
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
      xxxl120: 0,
      usOrder: 0
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
          salesPlanId: String(selectedPlan.id),
          performance: formData.performance,
          achievementRate: formData.achievementRate,
          temperature: formData.temperature,
          xs_size: formData.xs85,
          s_size: formData.s90,
          m_size: formData.m95,
          l_size: formData.l100,
          xl_size: formData.xl105,
          xxl_size: formData.xxl110,
          fourxl_size: formData.xxxl120,
          usOrder: formData.usOrder
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

  const formatNumber = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseFormattedNumber = (value: string) => {
    return Number(value.replace(/,/g, ''));
  };

  const handleEditClick = (e: React.MouseEvent, plan: ISalesPlans) => {
    e.stopPropagation();
    // ISalesPlans 데이터를 ISalesPlanWithPerformance 형식으로 변환하여 전달
    const editData: Partial<ISalesPlanWithPerformance> = {
      id: String(plan.id),
      season: plan.season,
      plan_date: plan.plan_date,
      plan_time: plan.plan_time,
      channel_name: plan.channel_name,
      set_item_code: plan.set_info?.set_id,
      product_name: plan.set_info?.set_name || plan.product_name,
      sale_price: plan.sale_price,
      commission_rate: plan.commission_rate || 0,
      target_quantity: plan.target_quantity,
      quantity_composition: plan.quantity_composition,
    };
    setSelectedPlanData(editData as ISalesPlanWithPerformance);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    fetchData(currentPage);
  };

  const handleDelete = async (e: React.MouseEvent, planId: number) => {
    e.stopPropagation();
    if (window.confirm('이 판매계획을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/sales/performance/${planId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || '삭제 실패');
        }

        alert('판매계획이 삭제되었습니다.');
        setShowPopup(false);
        fetchData(currentPage);
      } catch (error) {
        console.error('Error:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              판매실적 목록
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
                  className="pl-10 pr-4 py-2 border border-border rounded-lg w-80 bg-card text-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">운영시즌</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">일자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">상품코드</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">판매채널</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">채널상세</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">상품명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">추가 구성</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">세트품번</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">판매가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">수수료</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">목표</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {displayData.map((plan) => (
                  <tr 
                    key={plan.id}
                    className={`hover:bg-muted cursor-pointer 
                      ${selectedPlan?.id === plan.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''} 
                      ${plan.is_undecided ? 'text-red-600' : 'text-foreground'}`}
                    onClick={(e) => handleRowClick(e, plan)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.season}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(plan.plan_date), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.plan_time?.substring(0, 5)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.product_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.channel_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.channel_detail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.product_category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.set_info?.set_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.quantity_composition || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{plan.set_info?.set_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatPrice(plan.sale_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{plan.commission_rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {plan.target_quantity.toLocaleString()}개
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedPlan && showPopup && (
            <div 
              className="fixed bg-card shadow-lg rounded-lg z-50 border border-border"
              style={{
                left: `${popupPosition.x}px`,
                top: `${popupPosition.y}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="flex flex-row gap-1 p-1">
                <button
                  onClick={(e) => handleRegisterClick(selectedPlan, e)}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  등록
                </button>
                <button
                  onClick={(e) => handleDelete(e, selectedPlan.id)}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  삭제
                </button>
              </div>
            </div>
          )}

          {showPopup && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowPopup(false)}
            />
          )}

          <div className="bg-card px-4 py-3 flex items-center justify-center border-t border-border sm:px-6">
            <div className="flex justify-center items-center">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-border rounded-lg mr-2 disabled:opacity-50 text-foreground hover:bg-muted"
              >
                이전
              </button>
              
              <span className="mx-4 text-sm text-foreground">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasMore || data.length === 0}
                className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 text-foreground hover:bg-muted"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-xl font-semibold mb-4 text-center text-foreground">실적 입력</h3>
                    <div className="space-y-6 w-full">
                      <div className="bg-blue-100 dark:bg-blue-950/30 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-4 text-center">기본 정보</h3>
                        <div className="grid grid-cols-3 gap-6">
                          <div className="bg-card p-3 rounded-md border-2 border-border shadow">
                            <label className="block text-sm font-medium text-foreground mb-1">
                              실적
                              <span className="text-sm text-muted-foreground ml-2">
                                (목표: {selectedPlan ? formatNumber(selectedPlan.target_quantity) : '0'}개)
                              </span>
                            </label>
                            <input
                              type="text"
                              className="block w-full rounded-md border-2 border-border bg-muted text-foreground text-center"
                              value={formData.performance || ''}
                              onChange={(e) => setFormData({...formData, performance: parseFormattedNumber(e.target.value)})}
                            />
                          </div>
                          <div className="bg-card p-3 rounded-md border-2 border-border shadow">
                            <label className="block text-sm font-medium text-foreground mb-1 text-center">달성율 (%)</label>
                            <input
                              type="text"
                              className="block w-full rounded-md border-2 border-border bg-muted text-muted-foreground cursor-not-allowed text-center"
                              value={formData.achievementRate.toFixed(2)}
                              disabled
                            />
                          </div>
                          <div className="bg-card p-3 rounded-md border-2 border-border shadow">
                            <label className="block text-sm font-medium text-foreground mb-1 text-center">전환율 (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              className="block w-full rounded-md border-2 border-border bg-card text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                              value={formData.temperature || ''}
                              onChange={(e) => setFormData({...formData, temperature: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-100 dark:bg-green-950/30 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 shadow">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-4 text-center">사이즈별 수량</h3>
                        <div className="grid grid-cols-7 gap-4">
                          {[
                            { label: '85(XS)', key: 'xs85' },
                            { label: '90(S)', key: 's90' },
                            { label: '95(M)', key: 'm95' },
                            { label: '100(L)', key: 'l100' },
                            { label: '105(XL)', key: 'xl105' },
                            { label: '110(XXL)', key: 'xxl110' },
                            { label: '120(4XL)', key: 'xxxl120' }
                          ].map(({ label, key }) => (
                            <div key={key} className="bg-card p-3 rounded-md border-2 border-border shadow">
                              <label className="block text-xs font-medium text-foreground mb-1 text-center">{label}</label>
                              <input
                                type="number"
                                className="block w-full rounded-md border-2 border-border bg-card text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                                value={formData[key as keyof FormData] || ''}
                                onChange={(e) => setFormData({...formData, [key]: Number(e.target.value)})}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-yellow-100 dark:bg-yellow-950/30 p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 shadow">
             
                        <div className="flex justify-center">
                          <div className="w-48 bg-card p-3 rounded-md border-2 border-border shadow">
                            <label className="block text-xs font-medium text-foreground mb-1 text-center">미주 주문량</label>
                            <input
                              type="number"
                              className="block w-full rounded-md border-2 border-border bg-card text-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                              value={formData.usOrder || ''}
                              onChange={(e) => setFormData({...formData, usOrder: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-muted px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  등록
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-card text-base font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedPlanData && (
        <SalesPlanRegistrationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          channels={channels}
          editData={selectedPlanData}
        />
      )}
    </DashboardLayout>
  );
}