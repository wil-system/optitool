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
import ChannelDetailModal from '@/app/components/statistics/ChannelDetailModal';
import { IChannelDetailStatistics, IChannelStatistics, IDailyStatistics } from '@/app/types/statistics';

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
  const [chartViews, setChartViews] = useState<IChartView>({});
  const [selectedChannel, setSelectedChannel] = useState<IChannelDetailStatistics[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStatistics = async (currentPeriod = period) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        period: currentPeriod
      });

      if (currentPeriod === 'custom' && startDate && endDate) {
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/statistics/channels?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || '데이터 조회 실패');
      
      setStatistics(data);
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    
    if (newPeriod === 'custom') {
      setStartDate(null);
      setEndDate(null);
      setDisplayStartDate(null);
      setDisplayEndDate(null);
      setStatistics([]);
    } else {
      setStartDate(null);
      setEndDate(null);
      setDisplayStartDate(null);
      setDisplayEndDate(null);
      fetchStatistics(newPeriod);
    }
  };

  const handleSearch = () => {
    if (!startDate || !endDate) {
      alert('기간을 선택해주세요.');
      return;
    }
    setDisplayStartDate(startDate);
    setDisplayEndDate(endDate);
    fetchStatistics('custom');
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchStatistics(period);
    }
  }, []);

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
      if (currentPeriod === 'custom' && displayStartDate && displayEndDate) {
        const formatKST = (date: Date) => {
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        };
        return `${formatKST(displayStartDate)} ~ ${formatKST(displayEndDate)}`;
      }

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

  const formatDateRange = (stats: IDailyStatistics[]) => {
    if (period === 'custom' && displayStartDate && displayEndDate) {
      const formatKST = (date: Date) => {
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };

      return `${formatKST(displayStartDate)} ~ ${formatKST(displayEndDate)}`;
    }
    return formatDate(stats[0]?.date || '', period);
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
    return stats;
  };

  const handleChannelClick = async (channelId: string, date: string) => {
    try {
      const params = new URLSearchParams({
        date: date,
        period: period
      });

      const response = await fetch(`/api/statistics/channels/${channelId}/detail?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setSelectedChannel(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('채널 상세 정보 조회 실패:', error);
    }
  };

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
          <div className="text-center py-10">
            <p className="text-gray-500">데이터를 불러오는 중...</p>
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
                    <div className="px-6 py-4 bg-gray-50 rounded-t-lg flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {index === 0 ? formatDate(dailyStats.date, period) : 
                          period === 'custom' ? '' : formatDate(dailyStats.date, period)}
                      </h3>
                      <button
                        onClick={() => toggleChart(dailyStats.date)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
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
                              <th className="w-1/7 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                채널명
                              </th>
                              <th className="w-1/7 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 판매수량
                              </th>
                              <th className="w-1/7 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 판매금액
                              </th>
                              <th className="w-1/7 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 목표
                              </th>
                              <th className="w-1/7 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 실적
                              </th>
                              <th className="w-1/7 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                전체 달성률
                              </th>
                              <th className="w-1/7 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                점유율
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {dailyStats.channels.map((stat) => (
                              <tr 
                                key={stat.id} 
                                onClick={() => handleChannelClick(stat.id, dailyStats.date)}
                                className="hover:bg-gray-50 cursor-pointer"
                              >
                                <td className="w-0 px-4 py-3 whitespace-nowrap text-left">
                                  {stat.channel_name}
                                </td>
                                <td className="w-1/7 px-4 py-3 whitespace-nowrap text-right">
                                  {stat.quantity.toLocaleString()}
                                </td>
                                <td className="w-1/7 px-4 py-3 whitespace-nowrap text-right">
                                  {stat.amount.toLocaleString()}원
                                </td>
                                <td className="w-1/7 px-4 py-3 whitespace-nowrap text-right">
                                  {stat.target_quantity ? stat.target_quantity.toLocaleString() : '0'}개
                                </td>
                                <td className="w-1/7 px-4 py-3 whitespace-nowrap text-right">
                                  {stat.performance ? stat.performance.toLocaleString() : '0'}개
                                </td>
                                <td className="w-1/7 px-4 py-3 whitespace-nowrap text-right">
                                  {stat.achievement_rate != null ? stat.achievement_rate.toFixed(1) : '0'}%
                                </td>
                                <td className="w-1/7 px-4 py-3 whitespace-nowrap text-right">
                                  {stat.share != null ? stat.share.toFixed(1) : '0'}%
                                </td>
                              </tr>
                            ))}
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
      
      <ChannelDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedChannel}
      />
    </DashboardLayout>
  );
} 