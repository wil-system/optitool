'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface SalesPlan {
  id: string;
  plan_date: string;
  plan_time: string;
  channel_name: string;
  product_name: string;
  additional_composition: string;
  set_item_code: string;
  target_quantity: number;
  sale_price: number;
  commission_rate: number;
  season_year: string;
  season: string;
  total_order_quantity: number;
  net_order_quantity: number;
  total_sales: number;
  net_sales: number;
  achievement_rate: number;
}

interface DaySchedule {
  date: number;
  month: number;
  year: number;
  salesPlans: SalesPlan[];
}

// 채널별 색상 매핑
const channelColors: { [key: string]: { bg: string; text: string; border: string; dot: string } } = {};
const colorPalette = [
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', dot: 'bg-lime-500' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500' },
  { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
];

const getChannelColor = (channelName: string) => {
  if (!channelColors[channelName]) {
    const colorIndex = Object.keys(channelColors).length % colorPalette.length;
    channelColors[channelName] = colorPalette[colorIndex];
  }
  return channelColors[channelName];
};

// 채널별 단순 배경 클래스 (내부용 테이블)
const getChannelBgClass = (channelName: string) => {
  const color = getChannelColor(channelName);
  return `${color.bg} ${color.text}`;
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [salesPlans, setSalesPlans] = useState<SalesPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'internal' | 'external'>('external');
  const [hideEmptySlots, setHideEmptySlots] = useState(true);

  // 시간대 생성
  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      return `${i.toString().padStart(2, '0')}:30`;
    });
  }, []);

  // 현재 월의 날짜 배열
  const getDaysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: lastDay }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const fullDate = date.toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Seoul'
      });

      return {
        date: i + 1,
        day: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
        fullDate: fullDate
      };
    });
  }, [currentDate]);

  // 날짜별 데이터 그룹화
  const groupedByDate = useMemo(() => {
    const result: { [key: string]: SalesPlan[] } = {};

    getDaysInMonth.forEach(({ fullDate }) => {
      result[fullDate] = [];
    });

    salesPlans.forEach(plan => {
      if (result[plan.plan_date]) {
        result[plan.plan_date].push(plan);
      }
    });

    return result;
  }, [salesPlans, getDaysInMonth]);

  // 채널별 방송 횟수
  const broadcastCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    salesPlans.forEach(plan => {
      const channel = plan.channel_name;
      if (channel) {
        counts[channel] = (counts[channel] || 0) + 1;
      }
    });
    return counts;
  }, [salesPlans]);

  // 활성 시간대 필터링
  const getActiveTimeSlots = useMemo(() => {
    const activeTimes = new Set<string>();

    salesPlans.forEach(plan => {
      if (!plan.plan_time) return;
      const planTime = plan.plan_time.substring(0, 5);
      const [hour, minute] = planTime.split(':').map(Number);

      const slotHour = minute < 30 ?
        (hour === 0 ? 23 : hour - 1) :
        hour;
      const slotTime = `${slotHour.toString().padStart(2, '0')}:30`;
      activeTimes.add(slotTime);
    });

    return timeSlots
      .filter(time => activeTimes.has(time))
      .sort((a, b) => {
        const [hourA] = a.split(':').map(Number);
        const [hourB] = b.split(':').map(Number);
        return hourA - hourB;
      });
  }, [salesPlans, timeSlots]);

  const displayTimeSlots = useMemo(() => {
    if (!hideEmptySlots) return timeSlots;
    return getActiveTimeSlots;
  }, [hideEmptySlots, timeSlots, getActiveTimeSlots]);

  useEffect(() => {
    const fetchSalesPlans = async () => {
      setIsLoading(true);
      try {
        const koreaDate = new Date(currentDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const year = koreaDate.getFullYear();
        const month = (koreaDate.getMonth() + 1).toString();

        const response = await fetch(`/api/sales/calendar?year=${year}&month=${month}`);
        const result = await response.json();

        if (result.data) {
          setSalesPlans(result.data);
        }
      } catch (error) {
        console.error('판매계획 조회 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesPlans();
  }, [currentDate]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(new Date(year, month, 1).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const lastDay = new Date(new Date(year, month + 1, 0).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

    const days: DaySchedule[] = [];

    // 이전 달의 마지막 날짜들
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate.getDate(),
        month: prevDate.getMonth(),
        year: prevDate.getFullYear(),
        salesPlans: []
      });
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDayDate = new Date(year, month, i);
      const formattedDate = currentDayDate.toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Seoul'
      });

      const daySalesPlans = salesPlans.filter(p => p.plan_date === formattedDate);

      days.push({
        date: i,
        month: month,
        year: year,
        salesPlans: daySalesPlans
      });
    }

    return days;
  };

  useEffect(() => {
    const topScroll = document.querySelector('.overflow-x-scroll:first-child');
    const bottomScroll = document.querySelector('.overflow-x-scroll:last-child');

    if (topScroll && bottomScroll) {
      const handleScroll = (e: Event) => {
        const source = e.target as HTMLElement;
        const target = source === topScroll ? bottomScroll : topScroll;
        target.scrollLeft = source.scrollLeft;
      };

      topScroll.addEventListener('scroll', handleScroll);
      bottomScroll.addEventListener('scroll', handleScroll);

      return () => {
        topScroll.removeEventListener('scroll', handleScroll);
        bottomScroll.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-card rounded-xl shadow-sm border border-border">
        {/* 헤더 영역 */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex justify-between items-center">
            {/* 왼쪽: 월 네비게이션 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted hover:border-border transition-all duration-200 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-foreground min-w-[140px] text-center">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h2>
              <button
                onClick={handleNextMonth}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted hover:border-border transition-all duration-200 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={handleToday}
                className="ml-2 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-sm"
              >
                오늘
              </button>
            </div>

            {/* 오른쪽: 뷰 전환 */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewType('external')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewType === 'external'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  캘린더
                </span>
              </button>
              <button
                onClick={() => setViewType('internal')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewType === 'internal'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  시간표
                </span>
              </button>
            </div>
          </div>

          {/* 총 방송 건수 요약 */}
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            이번 달 총 <span className="font-semibold text-foreground">{salesPlans.length}건</span>의 방송이 예정되어 있습니다.
          </div>
        </div>

        {viewType === 'external' ? (
          /* ========== 외부 공유용: 캘린더 뷰 ========== */
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                <div
                  key={day}
                  className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${
                    idx === 0                     ? 'text-red-500 bg-red-50/50 dark:bg-red-950/30' :
                    idx === 6 ? 'text-blue-500 bg-blue-50/50 dark:bg-blue-950/30' :
                    'text-muted-foreground bg-muted'
                  }`}
                >
                  {day}
                </div>
              ))}

              {/* 달력 날짜 */}
              {generateCalendarDays().map((day, index) => {
                const today = new Date();
                const koreaToday = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
                const isToday =
                  koreaToday.getDate() === day.date &&
                  koreaToday.getMonth() === day.month &&
                  koreaToday.getFullYear() === day.year;
                const isCurrentMonth = day.month === currentDate.getMonth();
                const dayOfWeek = index % 7;
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;

                return (
                  <div
                    key={index}
                    className={`min-h-[130px] p-2 bg-card transition-colors relative ${
                      !isCurrentMonth ? 'opacity-40' : ''
                    } ${isToday ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/30' : ''}`}
                  >
                    {/* 날짜 숫자 */}
                    <div className={`text-sm mb-1.5 flex items-center gap-1 ${
                      isToday
                        ? 'font-bold'
                        : 'font-medium'
                    }`}>
                      {isToday ? (
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                          {day.date}
                        </span>
                      ) : (
                        <span className={`${
                          isSunday ? 'text-red-500' :
                          isSaturday ? 'text-blue-500' :
                          'text-foreground'
                        }`}>
                          {day.date}
                        </span>
                      )}
                      {day.salesPlans && day.salesPlans.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground ml-auto">
                          {day.salesPlans.length}건
                        </span>
                      )}
                    </div>

                    {/* 방송 일정 카드 */}
                    <div className="space-y-0.5">
                      {day.salesPlans && day.salesPlans.map((plan) => {
                        const color = getChannelColor(plan.channel_name);
                        return (
                          <div
                            key={plan.id}
                            className={`text-[11px] px-1.5 py-1 rounded-md border ${color.bg} ${color.text} ${color.border} transition-all hover:shadow-sm cursor-default`}
                          >
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${color.dot} flex-shrink-0`}></span>
                              <span className="font-semibold truncate">{plan.plan_time?.substring(0, 5)}</span>
                              <span className="truncate font-medium ml-auto">{plan.channel_name}</span>
                            </div>
                            <div className="truncate pl-3 text-[10px] opacity-80">
                              {plan.product_name}
                              {plan.additional_composition && ` + ${plan.additional_composition}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========== 내부 공유용: 시간표 뷰 ========== */
          <div className="p-4">
            {/* 채널별 방송 횟수 */}
            <div className="mb-4 p-4 bg-gradient-to-r from-muted to-blue-50/30 dark:to-blue-950/20 rounded-xl border border-border">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  채널별 방송 횟수
                </h3>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={hideEmptySlots}
                      onChange={(e) => setHideEmptySlots(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform"></div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">빈 시간대 숨기기</span>
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(broadcastCounts).map(([channel, count]) => {
                  const color = getChannelColor(channel);
                  return (
                    <div
                      key={channel}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${color.bg} ${color.text} ${color.border}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${color.dot}`}></span>
                      {channel}
                      <span className="font-bold">{count}회</span>
                    </div>
                  );
                })}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-foreground text-background border-foreground">
                  합계 {Object.values(broadcastCounts).reduce((sum, count) => sum + count, 0)}회
                </div>
              </div>
            </div>

            {/* 시간표 테이블 */}
            <div className="flex flex-col gap-0">
              <div className="overflow-x-scroll">
                <div className="min-w-full" style={{ height: '6px' }} />
              </div>

              <div className="overflow-x-scroll scrollbar-sync rounded-lg border border-border">
                <table className="min-w-full border-collapse table-fixed">
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <th className="w-20 border-b border-r border-border bg-gray-800 dark:bg-gray-900 text-white p-2 sticky left-0 z-30 text-xs font-semibold">
                        시간
                      </th>
                      {getDaysInMonth.map(({ date, day }) => (
                        <th
                          key={date}
                          className={`border-b border-r border-border p-2 min-w-[120px] sticky top-0 z-20 text-xs font-semibold ${
                            day === '토' ? 'bg-blue-600 text-white' :
                            day === '일' ? 'bg-red-500 text-white' :
                            'bg-gray-700 dark:bg-gray-800 text-white'
                          }`}
                        >
                          {date}일 ({day})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayTimeSlots.map((time, rowIdx) => {
                      const [currentHour] = time.split(':').map(Number);
                      const nextHour = (currentHour + 1) % 24;
                      const timeRangeDisplay = `${time} ~ ${nextHour.toString().padStart(2, '0')}:30`;

                      return (
                        <tr key={time} className={rowIdx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                          <td className="border-b border-r border-border bg-muted p-1.5 text-[11px] font-medium text-muted-foreground sticky left-0 z-10 whitespace-nowrap">
                            {timeRangeDisplay}
                          </td>
                          {getDaysInMonth.map(({ fullDate, day }) => {
                            return (
                              <td
                                key={`${fullDate}-${time}`}
                                className={`border-b border-r border-border/50 p-1 ${
                                  day === '토' ? 'bg-blue-50/20 dark:bg-blue-950/10' :
                                  day === '일' ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                                }`}
                              >
                                {groupedByDate[fullDate]
                                  ?.filter(plan => {
                                    if (!plan.plan_time) return false;
                                    const planTime = plan.plan_time.substring(0, 5);
                                    const [planHour, planMinute] = planTime.split(':').map(Number);
                                    const [slotHour] = time.split(':').map(Number);

                                    const nextSlotHour = (slotHour + 1) % 24;

                                    if (planHour === slotHour) {
                                      return planMinute >= 30;
                                    } else if (planHour === nextSlotHour) {
                                      return planMinute < 30;
                                    }
                                    return false;
                                  })
                                  .map(plan => {
                                    const color = getChannelColor(plan.channel_name);
                                    return (
                                      <div
                                        key={plan.id}
                                        className={`text-[10px] p-1 rounded-md mb-0.5 border ${color.bg} ${color.text} ${color.border}`}
                                      >
                                        <div className="flex justify-between items-center whitespace-nowrap">
                                          <span className="font-semibold truncate max-w-[70%]">{plan.channel_name}</span>
                                          <span className="opacity-60 ml-1 text-[9px]">{plan.plan_time?.substring(0, 5)}</span>
                                        </div>
                                        <div className="truncate font-medium">{plan.product_name}</div>
                                        {plan.additional_composition && (
                                          <div className="text-[9px] opacity-60 truncate">
                                            + {plan.additional_composition}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-sync {
          scrollbar-gutter: stable;
        }

        .overflow-x-scroll {
          scrollbar-width: auto;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }

        .overflow-x-scroll::-webkit-scrollbar {
          height: 6px;
        }

        .overflow-x-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-x-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
      `}</style>
    </DashboardLayout>
  );
}
