'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';


interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  type: '회의' | '업무' | '기타';
}

interface SalesPlan {
  id: number;
  plan_date: string;
  plan_time: string;
  channel_name: string;
  product_name: string;
  target_quantity: number;
  set_name: string;
  quantity_composition: string;
}


interface DaySchedule {
  date: number;
  month: number;
  year: number;
  schedules: ScheduleItem[];
  salesPlans: SalesPlan[];
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: ScheduleItem;
  onSave: (schedule: ScheduleItem) => void;
  onDelete?: () => void;
}

const ScheduleModal = ({ isOpen, onClose, schedule, onSave, onDelete }: ScheduleModalProps) => {
  const [title, setTitle] = useState(schedule?.title || '');
  const [time, setTime] = useState(schedule?.time || '');
  const [type, setType] = useState<'회의' | '업무' | '기타'>(schedule?.type || '회의');

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg w-96">
          <h3 className="text-lg font-bold mb-4">{schedule ? '일정 수정' : '새 일정'}</h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
            placeholder="일정 제목"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as '회의' | '업무' | '기타')}
            className="w-full mb-4 p-2 border rounded"
          >
            <option value="회의">회의</option>
            <option value="업무">업무</option>
            <option value="기타">기타</option>
          </select>
          <div className="flex justify-end gap-2">
            {schedule && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                삭제
              </button>
            )}
            <button
              onClick={() => onSave({ id: schedule?.id || Date.now().toString(), title, time, type })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              저장
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    )
  );
};

const ScheduleItem = ({ schedule, onClick }: { schedule: ScheduleItem; onClick: (schedule: ScheduleItem) => void }) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(schedule);
      }}
      className={`text-xs p-1 rounded cursor-pointer ${
        schedule.type === '회의' ? 'bg-blue-100 text-blue-800' :
        schedule.type === '업무' ? 'bg-green-100 text-green-800' :
        'bg-gray-100 text-gray-800'
      }`}
    >
      {schedule.time} {schedule.title}
    </div>
  );
};

// 채널별 색상 매핑을 위한 객체
const channelColors: { [key: string]: string } = {};
const colorClasses = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800',
  'bg-red-100 text-red-800',
  'bg-orange-100 text-orange-800',
  'bg-teal-100 text-teal-800',
  'bg-cyan-100 text-cyan-800',
  'bg-lime-100 text-lime-800',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-rose-100 text-rose-800',
  'bg-amber-100 text-amber-800',
  'bg-blue-200 text-blue-900',
  'bg-green-200 text-green-900',
  'bg-purple-200 text-purple-900',
  'bg-pink-200 text-pink-900',
  'bg-indigo-200 text-indigo-900',
  'bg-red-200 text-red-900',
  'bg-orange-200 text-orange-900',
];

// 채널별 색상 할당 함수
const getChannelColor = (channelName: string) => {
  if (!channelColors[channelName]) {
    const colorIndex = Object.keys(channelColors).length % colorClasses.length;
    channelColors[channelName] = colorClasses[colorIndex];
  }
  return channelColors[channelName];
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'전체' | '회의' | '업무' | '기타'>('전체');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [salesPlans, setSalesPlans] = useState<SalesPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'internal' | 'external'>('external');
  const [hideEmptySlots, setHideEmptySlots] = useState(true);

  // 시간대 생성 로직 수정
  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      return `${hour.toString().padStart(2, '0')}:30`;
    });
  }, []);

  // 현재 월의 날짜 배열 생성
  const getDaysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: lastDay }, (_, i) => {
      const date = new Date(year, month, i + 1);
      // 한국 시간대로 날짜 포맷팅
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

  // 채널별 방송 횟수 계산
  const broadcastCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    salesPlans.forEach(plan => {
      const channel = plan.channel_name;
      counts[channel] = (counts[channel] || 0) + 1;
    });
    return counts;
  }, [salesPlans]);

  // timeSlots를 필터링하는 함수 수정
  const getActiveTimeSlots = useMemo(() => {
    const activeTimes = new Set<string>();
    
    // 모든 판매계획의 시간을 확인
    salesPlans.forEach(plan => {
      const planTime = plan.plan_time.substring(0, 5);
      const [hour, minute] = planTime.split(':').map(Number);
      
      // 해당 시간의 이전 30분 슬롯을 활성화
      const slotHour = minute < 30 ? 
        (hour === 0 ? 23 : hour - 1) : 
        hour;
      const slotTime = `${slotHour.toString().padStart(2, '0')}:30`;
      activeTimes.add(slotTime);
    });
    
    // 활성화된 시간대만 필터링하여 정렬된 배열 반환
    return timeSlots
      .filter(time => activeTimes.has(time))
      .sort((a, b) => {
        const [hourA] = a.split(':').map(Number);
        const [hourB] = b.split(':').map(Number);
        return hourA - hourB;
      });
  }, [salesPlans, timeSlots]);

  // timeSlots 계산 로직 수정
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
    
    // 첫날과 마지막 날도 한국 시간 기준으로 설정
    const firstDay = new Date(new Date(year, month, 1).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const lastDay = new Date(new Date(year, month + 1, 0).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    
    const days: DaySchedule[] = [];
    
    // 이전 달의 마지막 날짜들 채우기
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate.getDate(),
        month: prevDate.getMonth(),
        year: prevDate.getFullYear(),
        schedules: [],
        salesPlans: []
      });
    }
    
    // 현재 달의 날짜들 채우기
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      const formattedDate = currentDate.toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Seoul'
      });
      
      const daySchedules = schedules.filter(s => s.time.split(' ')[0] === formattedDate);
      const daySalesPlans = salesPlans.filter(p => p.plan_date === formattedDate);
      
      days.push({
        date: i,
        month: month,
        year: year,
        schedules: daySchedules,
        salesPlans: daySalesPlans
      });
    }
    
    return days;
  };

  const handleSaveSchedule = (schedule: ScheduleItem) => {
    if (selectedSchedule) {
      setSchedules(schedules.map(s => s.id === schedule.id ? schedule : s));
    } else {
      setSchedules([...schedules, schedule]);
    }
    setIsModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleDeleteSchedule = () => {
    if (selectedSchedule) {
      setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
      setIsModalOpen(false);
      setSelectedSchedule(null);
    }
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              이전달
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              오늘
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              다음달
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewType('external')}
            className={`px-4 py-2 rounded-lg ${
              viewType === 'external' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            외부 공유용
          </button>
          <button
            onClick={() => setViewType('internal')}
            className={`px-4 py-2 rounded-lg ${
              viewType === 'internal' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            내부 공유용
          </button>
        </div>

        {viewType === 'external' ? (
          <div>
            <div className="grid grid-cols-7 gap-1">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="p-2 text-center font-medium bg-gray-50">
                  {day}
                </div>
              ))}
              
              {generateCalendarDays().map((day, index) => {
                const today = new Date();
                const koreaToday = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
                
                // 날짜, 월, 연도가 모두 일치하는지 확인
                const isToday = 
                  koreaToday.getDate() === day.date && 
                  koreaToday.getMonth() === day.month && 
                  koreaToday.getFullYear() === day.year;

                return (
                  <div 
                    key={index}
                    className={`min-h-[120px] p-2 border ${
                      isToday 
                        ? 'border-blue-300 border-[1.5px] bg-blue-50/50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className={`text-sm mb-1 ${
                      isToday 
                        ? 'font-semibold text-blue-500' 
                        : ''
                    }`}>
                      {day.date}
                    </div>
                    <div className="space-y-1">
                      {day.salesPlans && day.salesPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`text-xs p-1 rounded ${getChannelColor(plan.channel_name)}`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{plan.plan_time.substring(0, 5)}</span>
                            <span className="font-medium">{plan.channel_name}</span>
                          </div>
                          <div className="text-xs">{plan.quantity_composition ? plan.set_name + ' + ' + plan.quantity_composition : plan.set_name}</div>
                        </div>

                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <ScheduleModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedSchedule(null);
              }}
              schedule={selectedSchedule || undefined}
              onSave={handleSaveSchedule}
              onDelete={handleDeleteSchedule}
            />
          </div>
        ) : (
          <div className="mt-4">
            {/* 채널별 방송 횟수 헤더 영역 수정 */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">채널별 방송 횟수</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hideEmptySlots"
                    checked={hideEmptySlots}
                    onChange={(e) => setHideEmptySlots(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="hideEmptySlots" className="text-sm text-gray-600">
                    빈 시간대 숨기기
                  </label>
                </div>
              </div>
              <div className="flex gap-4 flex-wrap">
                {Object.entries(broadcastCounts).map(([channel, count]) => (
                  <div 
                    key={channel} 
                    className={`px-3 py-2 rounded-lg shadow ${getChannelColor(channel)}`}
                  >
                    <span className="font-medium">{channel}</span>
                    <span className="ml-2">{count}회</span>
                  </div>
                ))}
                {/* 방송 합계 추가 */}
                <div className="px-3 py-2 rounded-lg shadow bg-red-200">
                  <span className="font-medium">방송합계</span>
                  <span className="ml-2">
                    {Object.values(broadcastCounts).reduce((sum, count) => sum + count, 0)}회
                  </span>
                </div>
              </div>
            </div>

            {/* 시간표 부분 수정 */}
            <div className="flex flex-col gap-0">
              {/* 상단 스크롤바 */}
              <div className="overflow-x-scroll">
                <div className="min-w-full" style={{ height: '6px' }} />
              </div>
              
              {/* 테이블 */}
              <div className="overflow-x-scroll scrollbar-sync">
                <table className="min-w-full border border-gray-200 table-fixed">
                  <thead className="sticky top-0 z-20 overflow-visible">
                    <tr>
                      <th className="w-16 border bg-gray-50 p-1 sticky left-0 z-30">시간</th>

                      {getDaysInMonth.map(({ date, day }) => (
                        <th 
                          key={date} 
                          className={`border p-1 min-w-[120px] sticky top-0 z-20 ${
                            day === '토' ? 'bg-orange-50' : 
                            day === '일' ? 'bg-red-50' : 
                            'bg-gray-50'
                          }`}
                        >
                          <div className={`text-xs font-medium ${
                            day === '토' ? 'text-orange-700' : 
                            day === '일' ? 'text-red-700' : 
                            ''
                          }`}>
                            {date}일 ({day})
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayTimeSlots.map(time => {
                      const [currentHour] = time.split(':').map(Number);
                      const nextHour = (currentHour + 1) % 24;
                      const timeRangeDisplay = `${time} ~ ${nextHour.toString().padStart(2, '0')}:30`;
                      
                      return (
                        <tr key={time}>
                          <td className="border bg-gray-50 p-1 text-xs sticky left-0 z-10">
                            {timeRangeDisplay}
                          </td>
                          {getDaysInMonth.map(({ fullDate, day }) => {
                            const weekendBg = day === '토' ? 'bg-orange-50/30' : 
                                             day === '일' ? 'bg-red-50/30' : '';
                            
                            return (
                              <td 
                                key={`${fullDate}-${time}`} 
                                className={`border p-1 relative ${weekendBg}`}
                                style={{
                                  backgroundColor: day === '토' ? 'rgb(255 237 213 / 0.3)' : 
                                                 day === '일' ? 'rgb(254 226 226 / 0.3)' : 
                                                 undefined
                                }}
                              >
                                {groupedByDate[fullDate]
                                  ?.filter(plan => {
                                    const planTime = plan.plan_time.substring(0, 5);
                                    const [planHour, planMinute] = planTime.split(':').map(Number);
                                    const [slotHour] = time.split(':').map(Number);
                                    
                                    // 현재 슬롯 시간대(30분)부터 다음 슬롯 시간대(30분) 사이의 데이터
                                    const nextSlotHour = (slotHour + 1) % 24;
                                    
                                    if (planHour === slotHour) {
                                      return planMinute >= 30;
                                    } else if (planHour === nextSlotHour) {
                                      return planMinute < 30;
                                    }
                                    return false;
                                  })
                                  .map(plan => (
                                    <div
                                      key={plan.id}
                                      className={`text-[10px] p-0.5 rounded mb-0.5 ${getChannelColor(plan.channel_name)}`}
                                    >
                                      <div className="flex justify-between items-center whitespace-nowrap">
                                        <span className="font-medium truncate max-w-[70%]">{plan.channel_name}</span>
                                        <span className="text-gray-500 ml-1">{plan.plan_time.substring(0, 5)}</span>
                                      </div>
                                      <div className="truncate">{plan.set_name}</div>
                                      {plan.quantity_composition && (
                                        <div className="text-[9px] text-gray-500 truncate">
                                          + {plan.quantity_composition}
                                        </div>
                                      )}
                                    </div>
                                  ))}
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
        
        /* 스크롤바 동기화를 위한 스타일 */
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