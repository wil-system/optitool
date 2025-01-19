'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { format } from 'date-fns';
import SalesPlanRegistrationModal from '@/app/components/sales/SalesPlanRegistrationModal';
import { ISalesPlans } from '@/app/types/database';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface Channel {
  id: number;
  channel_code: string;
  channel_name: string;
}

interface Category {
  id: number;
  category_name: string;
}

interface SetProduct {
  id: number;
  set_id: string;
  set_name: string;
  is_active: boolean;
}

interface Props {
  initialData: ISalesPlans[];
  channels: Channel[];
  categories: Category[];
  setIds: SetProduct[];
}

export default function SalesPlanListClient({ initialData, channels: initialChannels, categories: initialCategories, setIds }: Props) {
  const [data, setData] = useState<ISalesPlans[]>(initialData);
  const [channels, setChannels] = useState(initialChannels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [sets, setSets] = useState<SetProduct[]>(setIds);
  const [selectedPlan, setSelectedPlan] = useState<ISalesPlans | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    season: true,
    channel: true,
    channelDetail: true,
    category: true,
    productName: true,
    setId: true
  });
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        searchTerm: appliedSearchTerm,
        ...(searchFilters.season && { filterSeason: 'true' }),
        ...(searchFilters.channel && { filterChannel: 'true' }),
        ...(searchFilters.channelDetail && { filterChannelDetail: 'true' }),
        ...(searchFilters.category && { filterCategory: 'true' }),
        ...(searchFilters.productName && { filterProductName: 'true' }),
        ...(searchFilters.setId && { filterSetId: 'true' })
      });
      
      const [plansResponse, setsResponse, channelsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/sales/plans/list?${params}`),
        fetch('/api/sets'),
        fetch('/api/channels'),
        fetch('/api/categories')
      ]);
      
      if (!plansResponse.ok || !setsResponse.ok || !channelsResponse.ok || !categoriesResponse.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const [plansResult, setsResult, channelsResult, categoriesResult] = await Promise.all([
        plansResponse.json(),
        setsResponse.json(),
        channelsResponse.json(),
        categoriesResponse.json()
      ]);

      setData(plansResult.data);
      setTotalPages(plansResult.totalPages);
      setSets(setsResult.data || []);
      setChannels(channelsResult.data || []);
      setCategories(categoriesResult.data || []);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1);
    fetchData();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '원';
  };

  const handleRowClick = (plan: ISalesPlans) => {
    setSelectedPlan(selectedPlan?.id === plan.id ? undefined : plan);
  };

  const handleEdit = (e: React.MouseEvent, plan: ISalesPlans) => {
    e.stopPropagation();
    setSelectedPlan(plan);
    setIsEditMode(true);
    setIsRegistrationModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, planId: number) => {
    e.stopPropagation();
    if (window.confirm('이 판매계획을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/sales/plans/${planId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('삭제 실패');
        }

        alert('판매계획이 삭제되었습니다.');
        fetchData();
        setSelectedPlan(undefined);
      } catch (error) {
        console.error('Error:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleModalClose = () => {
    setIsRegistrationModalOpen(false);
    setIsEditMode(false);
    setSelectedPlan(undefined);
  };

  const filteredPlans = data.filter(plan => {
    if (searchTerm === '') return true;
    
    const searchValue = searchTerm.toLowerCase();
    return (
      (searchFilters.season && plan.season?.toLowerCase().includes(searchValue)) ||
      (searchFilters.channel && plan.channel?.channel_name?.toLowerCase().includes(searchValue)) ||
      (searchFilters.channelDetail && plan.channel_detail?.toLowerCase().includes(searchValue)) ||
      (searchFilters.category && plan.product_category?.toLowerCase().includes(searchValue)) ||
      (searchFilters.productName && plan.product_name?.toLowerCase().includes(searchValue)) ||
      (searchFilters.setId && plan.set_info?.set_id?.toLowerCase().includes(searchValue))
    );
  });

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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800">오류 발생</h3>
            <p className="mt-2 text-sm text-red-700">{error.message}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              다시 시도
            </button>
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
              판매계획 목록
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                검색
              </button>
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                계획 추가
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">판매가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">수수료</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">목표</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlans.map((plan) => (
                  <tr 
                    key={plan.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.season}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(plan.plan_date), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.plan_time?.substring(0, 5)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.product_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.channel?.channel_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.channel_detail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.product_category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.set_info?.set_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.set_info?.set_id || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPrice(plan.sale_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{plan.commission_rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {plan.target_quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={(e) => handleEdit(e, plan)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, plan.id)}
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

          <div className="bg-white px-4 py-3 flex items-center justify-center border-t border-gray-200">
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

      {isRegistrationModalOpen && (
        <SalesPlanRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={handleModalClose}
          onSuccess={() => {
            fetchData();
            handleModalClose();
          }}
          channels={channels}
          categories={categories}
          setIds={sets}
          editData={isEditMode ? selectedPlan : undefined}
        />
      )}
    </DashboardLayout>
  );
}