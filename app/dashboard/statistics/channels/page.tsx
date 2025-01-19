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
  Legend,
  PieController,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { IChannelDetailStatistics, IChannelStatistics, IDailyStatistics } from '@/app/types/statistics';
import { format } from 'date-fns';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PieController,
  ArcElement
);

type PeriodType = 'daily' | 'monthly' | 'yearly' | 'custom';

interface IChartView {
  [key: string]: boolean;
}

export default function ChannelStatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [displayStartDate, setDisplayStartDate] = useState<Date | null>(null);
  const [displayEndDate, setDisplayEndDate] = useState<Date | null>(null);
  const [view, setView] = useState<'list' | 'chart'>('list');
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [statistics, setStatistics] = useState<IDailyStatistics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chartViews, setChartViews] = useState<Record<string, boolean>>({});

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

      const response = await fetch(`/api/statistics/channels?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || '데이터 조회 실패');
      
      // 날짜 기준 내림차순 정렬
      const sortedData = [...data].sort((a, b) => b.date.localeCompare(a.date));
      setStatistics(sortedData);
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = async (newPeriod: PeriodType) => {
    setIsLoading(true);
    setStatistics([]); // 기존 데이터 초기화
    setPeriod(newPeriod);
    
    if (newPeriod === 'custom') {
      setStartDate(null);
      setEndDate(null);
      setDisplayStartDate(null);
      setDisplayEndDate(null);
      setIsLoading(false);
    } else {
      try {
        const params = new URLSearchParams({
          period: newPeriod
        });

        const response = await fetch(`/api/statistics/channels?${params}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '데이터 조회 실패');
        }
        
        // 날짜 기준 내림차순 정렬
        const sortedData = [...data].sort((a, b) => b.date.localeCompare(a.date));
        setStatistics(sortedData);
      } catch (error) {
        console.error('통계 조회 중 오류:', error);
        alert('데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSearch = () => {
    if (!startDate || !endDate) {
      alert('기간을 선택해주세요.');
      return;
    }
    setDisplayStartDate(startDate);
    setDisplayEndDate(endDate);
    fetchStatistics();
  };

  const chartColors = [
    'rgba(255, 99, 132, 0.5)',
    'rgba(54, 162, 235, 0.5)',
    'rgba(255, 206, 86, 0.5)',
    'rgba(75, 192, 192, 0.5)',
    'rgba(153, 102, 255, 0.5)',
    'rgba(255, 159, 64, 0.5)',
    'rgba(201, 203, 207, 0.5)'
  ];

  const formatDate = (dateStr: string, currentPeriod: PeriodType) => {
    try {
      if (!dateStr) return '';
      
      switch (currentPeriod) {
        case 'yearly':
          return `${dateStr}년`;
        case 'monthly': {
          const [year, month] = dateStr.split('-');
          return `${year}년 ${parseInt(month)}월`;
        }
        case 'daily': {
          const date = new Date(dateStr);
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        case 'custom': {
          if (displayStartDate && displayEndDate) {
            return `${format(displayStartDate, 'yyyy년 MM월 dd일')} ~ ${format(displayEndDate, 'yyyy년 MM월 dd일')}`;
          }
          const date = new Date(dateStr);
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        default:
          return dateStr;
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateStr;
    }
  };

  const toggleChart = (date: string) => {
    setChartViews(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const formatDateRange = (date: string) => {
    if (!date) return '';
    
    try {
      switch (period) {
        case 'yearly':
          return `${date}년`;
        case 'monthly': {
          const [year, month] = date.split('-');
          return `${year}년 ${parseInt(month)}월`;
        }
        case 'daily': {
          const parsedDate = new Date(date);
          if (isNaN(parsedDate.getTime())) {
            console.error('Invalid date:', date);
            return date;
          }
          return parsedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        case 'custom': {
          if (displayStartDate && displayEndDate) {
            return `${format(displayStartDate, 'yyyy년 MM월 dd일')} ~ ${format(displayEndDate, 'yyyy년 MM월 dd일')}`;
          }
          const parsedDate = new Date(date);
          if (isNaN(parsedDate.getTime())) {
            console.error('Invalid date:', date);
            return date;
          }
          return parsedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        default:
          return date;
      }
    } catch (error) {
      console.error('Date formatting error:', error, date);
      return date;
    }
  };

  const aggregateStatistics = (stats: IDailyStatistics[]): IDailyStatistics[] => {
    if (period === 'custom' && stats.length > 0) {
      const channelTotals: { [key: string]: IChannelStatistics } = {};
      
      stats.forEach(dailyStat => {
        dailyStat.channels.forEach(channel => {
          if (!channelTotals[channel.id]) {
            channelTotals[channel.id] = {
              ...channel,
              quantity: 0,
              amount: 0,
              share: 0
            };
          }
          channelTotals[channel.id].quantity += channel.quantity;
          channelTotals[channel.id].amount += channel.amount;
        });
      });

      const totalAmount = Object.values(channelTotals).reduce((sum, channel) => sum + channel.amount, 0);
      Object.values(channelTotals).forEach(channel => {
        channel.share = totalAmount > 0 ? (channel.amount / totalAmount) * 100 : 0;
      });

      return [{
        date: stats[0].date,
        channels: Object.values(channelTotals)
      }];
    }
    
    // custom이 아닌 경우 각 날짜별 데이터를 그대로 반환
    return stats.map(stat => ({
      date: stat.date,
      channels: stat.channels.map(channel => ({
        ...channel,
        share: stat.channels.reduce((sum, ch) => sum + ch.amount, 0) > 0
          ? (channel.amount / stat.channels.reduce((sum, ch) => sum + ch.amount, 0)) * 100
          : 0
      }))
    }));
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchStatistics();
    }
  }, []); // 컴포넌트 마운트 시 1회 실행

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">채널별 통계</h1>
        
        <div className="flex justify-between mb-6">
          <div className="flex items-center space-x-4">
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : statistics.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">표시할 데이터가 없습니다.</p>
          </div>
        ) : (
          view === 'list' ? (
            <div className="space-y-6">
              {aggregateStatistics(statistics).map((dailyStats: IDailyStatistics, index: number) => {
                console.log('렌더링 데이터:', dailyStats);
                return (
                  <div key={dailyStats.date} className="bg-white rounded-lg shadow">
                    <div className="px-4 py-4 bg-gray-50 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-2xl font-semibold text-gray-900">
                        {formatDateRange(dailyStats.date)}
                      </h3>
                      <button
                        onClick={() => toggleChart(dailyStats.date)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                      >
                        {chartViews[dailyStats.date] ? '테이블 보기' : '차트 보기'}
                      </button>
                    </div>

                    {chartViews[dailyStats.date] ? (
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="h-[400px]">
                            <Bar
                              data={{
                                labels: dailyStats.channels.map(stat => stat.channel_name),
                                datasets: [{
                                  label: '판매금액',
                                  data: dailyStats.channels.map(stat => stat.amount),
                                  backgroundColor: chartColors,
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'top' },
                                  title: {
                                    display: true,
                                    text: '채널별 판매금액'
                                  }
                                }
                              }}
                            />
                          </div>
                          <div className="h-[400px]">
                            <Pie
                              data={{
                                labels: dailyStats.channels.map(stat => stat.channel_name),
                                datasets: [{
                                  data: dailyStats.channels.map(stat => stat.share),
                                  backgroundColor: chartColors,
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'right' },
                                  title: {
                                    display: true,
                                    text: '채널별 점유율'
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 table-fixed">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                채널명
                              </th>
                              <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                채널상세
                              </th>
                              <th className="w-1/8 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 판매수량
                              </th>
                              <th className="w-1/8 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 판매금액
                              </th>
                              <th className="w-1/8 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 목표
                              </th>
                              <th className="w-1/8 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 실적
                              </th>
                              <th className="w-1/8 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 달성률
                              </th>
                              <th className="w-1/8 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                점유율
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {dailyStats.channels.map((stat) => (
                              <tr 
                                key={stat.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-left">
                                  {stat.channel_name}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-left">
                                  {stat.channel_detail || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {stat.quantity.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {stat.amount.toLocaleString()}원
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {stat.target_quantity ? stat.target_quantity.toLocaleString() : '0'}개
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {stat.performance ? stat.performance.toLocaleString() : '0'}개
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {stat.achievement_rate != null ? stat.achievement_rate.toFixed(1) : '0'}%
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {stat.share != null ? stat.share.toFixed(1) : '0'}%
                                </td>
                              </tr>
                            ))}
                            {dailyStats.channels.length >= 2 && (
                              <tr className="bg-gray-50 font-bold">
                                <td className="px-4 py-3 whitespace-nowrap" colSpan={2}>
                                  총계
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {dailyStats.channels.reduce((sum, stat) => sum + (stat.quantity || 0), 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {dailyStats.channels.reduce((sum, stat) => sum + (stat.amount || 0), 0).toLocaleString()}원
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {dailyStats.channels.reduce((sum, stat) => sum + (stat.target_quantity || 0), 0).toLocaleString()}개
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {dailyStats.channels.reduce((sum, stat) => sum + (stat.performance || 0), 0).toLocaleString()}개
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  {(() => {
                                    const totalTarget = dailyStats.channels.reduce((sum, stat) => sum + (stat.target_quantity || 0), 0);
                                    const totalPerformance = dailyStats.channels.reduce((sum, stat) => sum + (stat.performance || 0), 0);
                                    return totalTarget > 0 ? ((totalPerformance / totalTarget) * 100).toFixed(1) : '0';
                                  })()}%
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">100%</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="h-[400px]">
                <Bar
                  data={{
                    labels: statistics[0]?.channels.map(stat => stat.channel_name) || [],
                    datasets: [
                      {
                        label: '판매금액',
                        data: statistics[0]?.channels.map(stat => stat.amount) || [],
                        backgroundColor: chartColors,
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
                        text: '채널별 판매금액'
                      }
                    }
                  }}
                />
              </div>
              <div className="h-[400px]">
                <Pie
                  data={{
                    labels: statistics[0]?.channels.map(stat => stat.channel_name) || [],
                    datasets: [
                      {
                        data: statistics[0]?.channels.map(stat => stat.share) || [],
                        backgroundColor: chartColors,
                      }
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      title: {
                        display: true,
                        text: '채널별 점유율'
                      }
                    }
                  }}
                />
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
} 