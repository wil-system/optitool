import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: DateRangePickerProps) {
  return (
    <div className="flex items-center space-x-4">
      <DatePicker
        selected={startDate}
        onChange={(date: Date | null) => onStartDateChange(date)}
        selectsStart
        startDate={startDate || undefined}
        endDate={endDate || undefined}
        dateFormat="yyyy-MM-dd"
        className="px-3 py-2 border rounded"
        placeholderText="시작일"
      />
      <span>~</span>
      <DatePicker
        selected={endDate}
        onChange={(date: Date | null) => onEndDateChange(date)}
        selectsEnd
        startDate={startDate || undefined}
        endDate={endDate || undefined}
        minDate={startDate || undefined}
        dateFormat="yyyy-MM-dd"
        className="px-3 py-2 border rounded"
        placeholderText="종료일"
      />
    </div>
  );
} 