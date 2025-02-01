'use client';

import { useState, useEffect } from 'react';
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

        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">

          </div>

        </div>

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
                      <div className="text-xs">{plan.set_name}</div>
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
    </DashboardLayout>
  );
} 