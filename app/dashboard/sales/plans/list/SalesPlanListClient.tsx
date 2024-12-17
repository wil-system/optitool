'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

 
interface SalesPlan {
  id: number;
  season: string;
  plan_date: string;
  plan_time: string;
  channel_code: string;
  channel_name: string;
  channel_detail: string;
  product_category: string;
  product_name: string;
  product_summary: string;
  quantity_composition: string;
  set_id: string;
  product_code: string;
  sale_price: number;
  commission_rate: number;
  target_quantity: number;
}

interface Channel {
  channel_code: string;
  channel_name: string;
}

interface Props {
  initialData: SalesPlan[];
  channels: Channel[];
}

const SalesPlanListClient = ({ initialData, channels }: Props) => {
  const [salesPlans, setSalesPlans] = useState<SalesPlan[]>(initialData || []);
  const [channelsData, setChannelsData] = useState(channels || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchFilters, setSearchFilters] = useState({
    season: true,
    channel: true,
    channelDetail: true,
    category: true,
    productName: true,
    setId: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sales/plans/list');
        const result = await response.json();
        
        setSalesPlans(result.data);
        setChannelsData(result.channels);
      } catch (error) {
        console.error('데이터 로드 중 오류 발생:', error);
      }
    };

    fetchData();
  }, []);

  const filteredPlans = salesPlans?.filter(plan => {
    if (appliedSearchTerm === '') return true;
    
    const searchValue = appliedSearchTerm.toLowerCase();
    return (
      (searchFilters.season && plan.season.toLowerCase().includes(searchValue)) ||
      (searchFilters.channel && plan.channel_name.toLowerCase().includes(searchValue)) ||
      (searchFilters.channelDetail && plan.channel_detail.toLowerCase().includes(searchValue)) ||
      (searchFilters.category && plan.product_category.toLowerCase().includes(searchValue)) ||
      (searchFilters.productName && plan.product_name.toLowerCase().includes(searchValue)) ||
      (searchFilters.setId && plan.set_id.toLowerCase().includes(searchValue))
    );
  }) || [];

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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {plan.target_quantity.toLocaleString()}
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
    </DashboardLayout>
  );
};

export default SalesPlanListClient;