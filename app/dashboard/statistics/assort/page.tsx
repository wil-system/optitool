'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import DateRangePicker from '@/app/components/statistics/DateRangePicker';
import ViewToggle from '@/app/components/statistics/ViewToggle';
import PeriodSelector from '@/app/components/statistics/PeriodSelector';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { IAssortStatistics } from '@/app/types/statistics';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GroupedStatistics {
  [date: string]: IAssortStatistics[];
}

export default function AssortStatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewStates, setViewStates] = useState<Record<string, 'list' | 'chart'>>({});
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
        period,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() })
      });

      const response = await fetch(`/api/statistics/assort?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '데이터를 불러오는데 실패했습니다.');
      }

      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      alert('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchStatistics();
    }
  }, [period]);

  const renderTable = (products: IAssortStatistics[]) => {
    const productTotals = products.map(product => ({
      ...product,
      total_order: (
        (product.xs_size || 0) +
        (product.s_size || 0) +
        (product.m_size || 0) +
        (product.l_size || 0) +
        (product.xl_size || 0) +
        (product.xxl_size || 0) +
        (product.fourxl_size || 0)
      )
    }));

    const grandTotal = productTotals.reduce((sum, product) => sum + product.total_order, 0);

    // 각 행의 아소트 비율 중 최대값과 0%를 제외한 최소값 찾기
    const getMinMaxAssort = (product: typeof productTotals[0]) => {
      const assorts = [
        { size: 'xs', value: product.xs_assort },
        { size: 's', value: product.s_assort },
        { size: 'm', value: product.m_assort },
        { size: 'l', value: product.l_assort },
        { size: 'xl', value: product.xl_assort },
        { size: 'xxl', value: product.xxl_assort },
        { size: 'fourxl', value: product.fourxl_assort }
      ];
      const max = Math.max(...assorts.map(a => a.value));
      // 0%를 제외한 최소값 찾기
      const nonZeroValues = assorts.map(a => a.value).filter(v => v > 0);
      const min = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;
      return { max, min };
    };

    const getAssortColor = (value: number, max: number, min: number) => {
      if (value === 0) return 'text-gray-400';  // 0%는 회색
      if (value === max) return 'text-red-600';  // 최대값은 빨간색
      if (value === min) return 'text-sky-600';  // 0%를 제외한 최소값은 하늘색
      return '';
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">세트품번</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">XS</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">S</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">M</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">L</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">XL</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">XXL</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">4XL</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">총 주문수량</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productTotals.map((product, index) => {
              const { max, min } = getMinMaxAssort(product);
              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{product.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.set_product_code}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${getAssortColor(product.xs_assort, max, min)}`}>
                    {product.xs_size?.toLocaleString()} ({product.xs_assort}%)
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${getAssortColor(product.s_assort, max, min)}`}>
                    {product.s_size?.toLocaleString()} ({product.s_assort}%)
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${getAssortColor(product.m_assort, max, min)}`}>
                    {product.m_size?.toLocaleString()} ({product.m_assort}%)
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${getAssortColor(product.l_assort, max, min)}`}>
                    {product.l_size?.toLocaleString()} ({product.l_assort}%)
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${getAssortColor(product.xl_assort, max, min)}`}>
                    {product.xl_size?.toLocaleString()} ({product.xl_assort}%)
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${getAssortColor(product.xxl_assort, max, min)}`}>
                    {product.xxl_size?.toLocaleString()} ({product.xxl_assort}%)
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${getAssortColor(product.fourxl_assort, max, min)}`}>
                    {product.fourxl_size?.toLocaleString()} ({product.fourxl_assort}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                    {product.total_order.toLocaleString()}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-50 font-bold">
              <td className="px-6 py-4 whitespace-nowrap" colSpan={9}>총계</td>
              <td className="px-6 py-4 whitespace-nowrap text-right">{grandTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderChart = (products: IAssortStatistics[]) => {
    return (
      <div className="h-[400px] flex justify-start">
        <div className="w-full max-w-4xl">
          <Bar
            data={{
              labels: products.map(product => product.product_name),
              datasets: [
                {
                  label: 'XS',
                  data: products.map(product => product.xs_assort),
                  backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
                {
                  label: 'S',
                  data: products.map(product => product.s_assort),
                  backgroundColor: 'rgba(54, 162, 235, 0.5)',
                },
                {
                  label: 'M',
                  data: products.map(product => product.m_assort),
                  backgroundColor: 'rgba(255, 206, 86, 0.5)',
                },
                {
                  label: 'L',
                  data: products.map(product => product.l_assort),
                  backgroundColor: 'rgba(75, 192, 192, 0.5)',
                },
                {
                  label: 'XL',
                  data: products.map(product => product.xl_assort),
                  backgroundColor: 'rgba(153, 102, 255, 0.5)',
                },
                {
                  label: 'XXL',
                  data: products.map(product => product.xxl_assort),
                  backgroundColor: 'rgba(255, 159, 64, 0.5)',
                },
                {
                  label: '4XL',
                  data: products.map(product => product.fourxl_assort),
                  backgroundColor: 'rgba(201, 203, 207, 0.5)',
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
                  text: '사이즈별 아소트 비율'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: '비율 (%)'
                  }
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
        <h1 className="text-2xl font-bold mb-6">아소트 통계</h1>
        
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
                    : renderChart(products)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 