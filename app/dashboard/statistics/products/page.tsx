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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductStatistics {
  id: string;
  product_name: string;
  quantity: number;
  amount: number;
}

export default function ProductStatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [view, setView] = useState<'list' | 'chart'>('list');
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [statistics, setStatistics] = useState<ProductStatistics[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate?.toISOString() || '',
        endDate: endDate?.toISOString() || '',
        period,
        page: currentPage.toString()
      });

      console.log('요청 파라미터:', params.toString());

      const response = await fetch(`/api/statistics/products?${params}`);
      const data = await response.json();
      
      console.log('API 응답:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      setStatistics(data || []);
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  }, [startDate, endDate, period, currentPage]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">상품별 통계</h1>
        
        <div className="flex justify-between mb-6">
          <div className="flex space-x-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            <PeriodSelector period={period} onPeriodChange={setPeriod} />
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>

        {view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상품명
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    판매수량
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    판매금액
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.map((stat) => (
                  <tr key={stat.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stat.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {stat.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {stat.amount.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[600px]">
            <Bar
              data={{
                labels: statistics.map(stat => stat.product_name),
                datasets: [
                  {
                    label: '판매수량',
                    data: statistics.map(stat => stat.quantity),
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                  },
                  {
                    label: '판매금액',
                    data: statistics.map(stat => stat.amount),
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
        )}
      </div>
    </DashboardLayout>
  );
} 