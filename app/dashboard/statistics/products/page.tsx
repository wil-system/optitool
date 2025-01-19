'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import DateRangePicker from '@/app/components/statistics/DateRangePicker';
import ViewToggle from '@/app/components/statistics/ViewToggle';
import PeriodSelector from '@/app/components/statistics/PeriodSelector';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { IProductStatistics } from '@/app/types/statistics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GroupedStatistics {
  [date: string]: IProductStatistics[];
}

interface ViewState {
  [key: string]: 'list' | 'chart';
}

export default function ProductStatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewStates, setViewStates] = useState<ViewState>({});
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [statistics, setStatistics] = useState<GroupedStatistics>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (period === 'custom' && (!startDate || !endDate)) {
      alert('기간을 선택해주세요.');
      return;
    }
    fetchStatistics();
  };

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        period: period
      });

      if (period === 'custom' && startDate && endDate) {
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/statistics/products?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || '데이터 조회 실패');
      
      setStatistics(data);
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchStatistics();
    }
  }, [period]);

  const renderTable = (products: IProductStatistics[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">세트품번</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">채널</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상세채널</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매금액</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">목표</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">실적</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">달성률</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">온도</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">점유율</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">{product.product_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
              <td className="px-6 py-4 whitespace-nowrap">{product.set_product_code}</td>
              <td className="px-6 py-4 whitespace-nowrap">{product.channel}</td>
              <td className="px-6 py-4 whitespace-nowrap">{product.channel_detail}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">{product.sales_amount?.toLocaleString()}원</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">{product.target?.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">{product.performance?.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">{product.achievement_rate?.toFixed(1)}%</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">{product.temperature}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">{product.share?.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderChart = (products: IProductStatistics[]) => {
    const filteredProducts = products.filter(product => product.sales_amount > 0);

    return (
      <div className="h-[400px] flex justify-start">
        <div className="w-full max-w-4xl">
          <Bar
            data={{
              labels: filteredProducts.map(product => `${product.product_name} (${product.channel})`),
              datasets: [
                {
                  label: '실적',
                  data: filteredProducts.map(product => product.performance),
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                },
                {
                  label: '목표',
                  data: filteredProducts.map(product => product.target),
                  backgroundColor: 'rgba(255, 99, 132, 0.5)',
                }
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: '상품별 판매 현황'
                }
              }
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">상품별 통계</h1>
        
        <div className="flex items-center space-x-4 mb-6">
          <PeriodSelector period={period} onPeriodChange={setPeriod} />
          {period === 'custom' && (
            <>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                검색
              </button>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div>
            {Object.entries(statistics).map(([date, products]) => (
              <div key={date} className="mb-8 bg-white rounded-lg shadow-md">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-bold">{date}</h2>
                  <ViewToggle 
                    view={viewStates[date] || 'list'} 
                    onViewChange={(newView) => {
                      setViewStates(prev => ({
                        ...prev,
                        [date]: newView
                      }));
                    }} 
                  />
                </div>
                <div className="p-4">
                  {(viewStates[date] || 'list') === 'list' 
                    ? renderTable(products) 
                    : renderChart(products)
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 