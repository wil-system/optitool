'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  type: '회의' | '업무' | '기타';
}

interface DaySchedule {
  date: number;
  schedules: ScheduleItem[];
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

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'전체' | '회의' | '업무' | '기타'>('전체');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 달력 데이터 생성
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: DaySchedule[] = [];
    
    // 이전 달의 마지막 날짜들 채우기
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i).getDate(),
        schedules: []
      });
    }
    
    // 현재 달의 날짜들 채우기
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: i,
        schedules: []
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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="p-2 border rounded"
            >
              <option value="전체">전체</option>
              <option value="회의">회의</option>
              <option value="업무">업무</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            새 일정
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="p-2 text-center font-medium bg-gray-50">
              {day}
            </div>
          ))}
          
          {generateCalendarDays().map((day, index) => (
            <div 
              key={index}
              className="min-h-[120px] p-2 border border-gray-200 hover:bg-gray-50"
              onClick={() => {
                setSelectedSchedule(null);
                setIsModalOpen(true);
              }}
            >
              <div className="text-sm mb-1">{day.date}</div>
              <div className="space-y-1">
                {schedules
                  .filter(s => filterType === '전체' || s.type === filterType)
                  .map((schedule) => (
                    <ScheduleItem
                      key={schedule.id}
                      schedule={schedule}
                      onClick={(schedule) => {
                        setSelectedSchedule(schedule);
                        setIsModalOpen(true);
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
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