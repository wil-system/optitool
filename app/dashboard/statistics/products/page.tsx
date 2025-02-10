'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import DateRangePicker from '@/app/components/statistics/DateRangePicker';
import PeriodSelector from '@/app/components/statistics/PeriodSelector';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { IProductStatistics } from '@/app/types/statistics';
import { format } from 'date-fns';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GroupedStatistics {
  [date: string]: IProductStatistics[];
}

export default function ProductStatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [chartViews, setChartViews] = useState<Record<string, boolean>>({});
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
        period
      });

      if (period === 'custom' && startDate && endDate) {
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/statistics/products?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || '데이터 조회 실패');
      
      const sortedData = Object.fromEntries(
        Object.entries(data as Record<string, IProductStatistics[]>)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      ) as GroupedStatistics;
      
      setStatistics(sortedData);
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = async (newPeriod: 'daily' | 'monthly' | 'yearly' | 'custom') => {
    setIsLoading(true);
    setStatistics({}); // 기존 데이터 초기화
    setPeriod(newPeriod);
    
    if (newPeriod === 'custom') {
      setStartDate(null);
      setEndDate(null);
      setIsLoading(false);
    } else {
      try {
        const params = new URLSearchParams({
          period: newPeriod
        });

        const response = await fetch(`/api/statistics/products?${params}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '데이터 조회 실패');
        }
        
        const sortedData = Object.fromEntries(
          Object.entries(data as Record<string, IProductStatistics[]>)
            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        );

        setStatistics(sortedData);
      } catch (error) {
        console.error('통계 조회 중 오류:', error);
        alert('데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchStatistics();
    }
  }, [period]);

  const toggleChart = (date: string) => {
    setChartViews(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const renderTable = (products: IProductStatistics[]) => {
    // 데이터가 2개 미만이면 총계를 표시하지 않음
    const showTotals = products.length >= 2;

    // 총계 계산 (데이터가 2개 이상일 때만)
    const totals = showTotals ? products.reduce((acc, product) => ({
      sales_amount: (acc.sales_amount || 0) + (product.sales_amount || 0),
      target: (acc.target || 0) + (product.target || 0),
      performance: (acc.performance || 0) + (product.performance || 0),
      // 온도가 있는 항목만 포함하여 평균 계산을 위한 데이터 수집
      temperature_sum: (acc.temperature_sum || 0) + (product.temperature || 0),
      temperature_count: (acc.temperature_count || 0) + (product.temperature ? 1 : 0),
    }), {} as { 
      sales_amount: number; 
      target: number; 
      performance: number; 
      temperature_sum: number;
      temperature_count: number;
    }) : null;

    // 총 달성률과 평균 온도 계산 (데이터가 2개 이상일 때만)
    const totalAchievementRate = totals && totals.target > 0 
      ? ((totals.performance / totals.target) * 100)
      : 0;

    const averageTemperature = totals && totals.temperature_count > 0
      ? (totals.temperature_sum / totals.temperature_count).toFixed(1)
      : '0';


    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">카테고리</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">세트품번</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">채널</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">상세채널</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">운영횟수</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">판매금액</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">목표</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">실적</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">달성률</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">전환율</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">점유율</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">{product.product_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.set_product_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.channel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.channel_detail || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.operation_count}회</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.sales_amount?.toLocaleString()}원</td>

                <td className="px-6 py-4 whitespace-nowrap text-right">{product.target?.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.performance?.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {product.target && product.target > 0 
                    ? ((product.performance || 0) / product.target * 100).toFixed(1)
                    : '0'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.temperature || '0'}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">{product.share?.toFixed(1)}%</td>
              </tr>
            ))}
            {/* 총계 행 - 데이터가 2개 이상일 때만 표시 */}
            {showTotals && totals && (
              <tr className="bg-gray-50 font-bold">
                <td className="px-6 py-4 whitespace-nowrap">총계</td>
                <td className="px-6 py-4 whitespace-nowrap text-right" colSpan={4}></td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {products.reduce((sum, p) => sum + p.operation_count, 0)}회
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {totals.sales_amount.toLocaleString()}원
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {totals.target.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {totals.performance.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {totalAchievementRate.toFixed(1) || '0'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {averageTemperature || '0'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">100%</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChart = (products: IProductStatistics[]) => {
    const filteredProducts = products.filter(product => product.sales_amount > 0);

    return (
      <div className="h-[400px]">
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
    );
  };

  const formatDateRange = (date: string, period: string, startDate: Date | null, endDate: Date | null) => {
    if (period === 'custom' && startDate && endDate) {
      return `${format(startDate, 'yyyy년 MM월 dd일')} ~ ${format(endDate, 'yyyy년 MM월 dd일')}`;
    }

    switch (period) {
      case 'yearly':
        return `${date}년`;
      case 'monthly': {
        const [year, month] = date.split('-');
        return `${year}년 ${month}월`;
      }
      case 'daily':
        return format(new Date(date), 'yyyy년 MM월 dd일');
      default:
        return date;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">상품별 통계</h1>
        
        <div className="flex items-center space-x-4 mb-6">
          <PeriodSelector period={period} onPeriodChange={handlePeriodChange} />
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
            <LoadingSpinner />
          </div>
        ) : Object.keys(statistics).length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">표시할 데이터가 없습니다.</p>
          </div>
        ) : (
          <div>
            {Object.entries(statistics).map(([date, products]) => (
              <div key={date} className="mb-8 bg-white rounded-lg shadow-md">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {formatDateRange(date, period, startDate, endDate)}
                  </h2>
                  <button
                    onClick={() => toggleChart(date)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                  >
                    {chartViews[date] ? '테이블 보기' : '차트 보기'}
                  </button>
                </div>
                <div className="p-4">
                  {chartViews[date] ? renderChart(products) : renderTable(products)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 