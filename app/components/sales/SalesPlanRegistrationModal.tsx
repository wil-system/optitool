'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/app/components/common/Modal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ISalesPlans } from '@/app/types/database';

interface Channel {
  id: number;
  channel_code: string;
  channel_name: string;
  channel_details?: string[];
}

interface Category {
  id: number;
  category_name: string;
}

interface SetProduct {
  id: number;
  set_id: string;
  set_name: string;
  is_active: boolean;
  remarks : string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  channels: Channel[];
  categories: Category[];
  setIds: SetProduct[];
  editData?: ISalesPlans;
  isPerformanceEdit?: boolean;
}

export default function SalesPlanRegistrationModal({ isOpen, onClose, onSuccess, channels, categories, setIds, editData, isPerformanceEdit }: Props) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [channelDetails, setChannelDetails] = useState<string[]>([]);
  
  const [formattedSalePrice, setFormattedSalePrice] = useState('');
  const [formattedCommissionRate, setFormattedCommissionRate] = useState('');
  const [formattedTarget, setFormattedTarget] = useState('');
  
  const initialFormData = {
    product_name: '',
    product_summary: '',
    quantity_composition: '',
    set_id: '',
    product_code: '',
    sale_price: '',
    commission_rate: '',
    target_quantity: '',
    channel_detail: '',
    is_undecided: false
  };
  

  const [formData, setFormData] = useState({
    season_year: '',
    season_type: 'SS',
    ...initialFormData
  });
  const [productCode, setProductCode] = useState('');

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 미확정 상태를 위한 state 추가
  const [isUndecided, setIsUndecided] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedChannel(null);
      setSelectedCategory(null);
      setChannelDetails([]);
      setFormattedSalePrice('');
      setFormattedCommissionRate('');
      setFormattedTarget('');
      setIsUndecided(false); // 모달 열릴 때 미확정 상태 초기화
      setFormData({
        season_year: '',
        season_type: 'SS',
        ...initialFormData
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (editData) {
      const seasonYear = editData.season.substring(0, 2);
      const seasonType = editData.season.substring(2);
      
      const selectedSet = setIds.find(set => set.id === editData.set_info?.id);
      
      setFormData({
        season_year: seasonYear,
        season_type: seasonType as 'SS' | 'FW',
        product_name: editData.product_name,
        product_summary: editData.product_summary || '',
        quantity_composition: editData.quantity_composition || '',
        product_code: editData.product_code,
        sale_price: editData.sale_price.toString(),
        commission_rate: editData.commission_rate.toString(),
        target_quantity: editData.target_quantity.toString(),
        set_id: selectedSet?.set_id || '',
        channel_detail: editData.channel_detail || '',
        is_undecided: editData.is_undecided || false
      });

      setSelectedDate(new Date(editData.plan_date));
      setSelectedTime(new Date(`2000-01-01T${editData.plan_time}`));
      
      setIsUndecided(editData.is_undecided || false);

      const channel = channels.find(ch => ch.id === editData.channel_id);
      setSelectedChannel(channel || null);
      
      if (channel?.channel_details) {
        setChannelDetails(channel.channel_details);
      }
      
      const category = categories.find(cat => cat.category_name === editData.product_category);
      setSelectedCategory(category || null);
    }
  }, [editData, channels, categories, setIds]);

  const handleChannelChange = (channelId: string) => {
    const selected = channels.find(ch => ch.id === Number(channelId));
    setSelectedChannel(selected || null);
    
    if (selected?.channel_details) {
      setChannelDetails(selected.channel_details);
    } else {
      setChannelDetails([]);
    }
  };

  const formatPrice = (value: string, isFocused: boolean) => {
    const number = value.replace(/[^\d]/g, '');
    if (!number) return '';
    return isFocused ? number : Number(number).toLocaleString() + '원';
  };

  const formatCommissionRate = (value: string, isFocused: boolean) => {
    const number = value.replace(/[^\d]/g, '');
    if (!number) return '';
    if (Number(number) > 100) return isFocused ? '100' : '100%';
    return isFocused ? number : number + '%';
  };

  const formatTarget = (value: string, isFocused: boolean) => {
    const number = value.replace(/[^\d]/g, '');
    if (!number) return '';
    return isFocused ? number : Number(number).toLocaleString() + '개';
  };

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value, false);
    setFormattedSalePrice(formatted);
    setFormData({
      ...formData,
      sale_price: e.target.value.replace(/[^\d]/g, '')
    });
  };

  const handleCommissionRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCommissionRate(e.target.value, false);
    setFormattedCommissionRate(formatted);
    setFormData({
      ...formData,
      commission_rate: e.target.value.replace(/[^\d]/g, '')
    });
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTarget(e.target.value, false);
    setFormattedTarget(formatted);
    setFormData({
      ...formData,
      target_quantity: e.target.value.replace(/[^\d]/g, '')
    });
  };

  const handleSetIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setFormData({
      ...formData,
      set_id: selectedId
    });
  };

  const validateForm = () => {
    if (!selectedDate) {
      alert('날짜를 선택해주세요.');
      return false;
    }
    if (!selectedTime) {
      alert('시간을 선택해주세요.');
      return false;
    }
    if (!selectedChannel) {
      alert('판매채널을 선택해주세요.');
      return false;
    }
    if (!selectedCategory) {
      alert('카테고리를 선택해주세요.');
      return false;
    }
    if (!formData.set_id.trim()) {
      alert('세트품번을 입력해주세요.');
      return false;
    }
    if (!formData.product_code.trim()) {
      alert('상품코드를 입력해주세요.');
      return false;
    }

    return true;
  };

  const handleSeasonYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setFormData(prev => ({
      ...prev,
      season_year: value
    }));
  };

  const handleSeasonTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      season_type: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const selectedSet = setIds.find(set => set.set_id === formData.set_id);
      if (!selectedSet) {
        throw new Error('유효하지 않은 세트품번입니다.');
      }

      const data = {
        season: `${formData.season_year}${formData.season_type}`,
        plan_date: format(selectedDate!, 'yyyy-MM-dd'),
        plan_time: format(selectedTime!, 'HH:mm:ss'),
        channel_id: selectedChannel.id,
        channel_code: selectedChannel.channel_code,
        channel_detail: (e.target as HTMLFormElement).channel_detail.value,
        product_category: selectedCategory?.category_name || '',
        product_name: formData.product_name,
        product_summary: formData.product_summary,
        quantity_composition: formData.quantity_composition,
        set_id: selectedSet.id,
        product_code: formData.product_code,
        sale_price: Number(formData.sale_price),
        commission_rate: Number(formData.commission_rate),
        target_quantity: Number(formData.target_quantity),
        is_undecided: isUndecided
      };

      const url = editData 
        ? `/api/sales/plans/${editData.id}`
        : '/api/sales/plans';
      
      const response = await fetch(url, {
        method: editData ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '등록 실패');
      }

      alert(editData ? '판매계획이 수정되었습니다.' : '판매계획이 등록되었습니다.');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    }
  };

  const currentDate = new Date();
  const isToday = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
  const minTime = isToday ? currentDate : new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="판매계획 등록">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          {/* 시즌/날짜 정보 */}
          <div className="flex space-x-4">
            <div className="w-20">
              <label className="block text-sm font-medium text-gray-700 mb-1">시즌연도</label>
              <input
                type="text"
                value={formData.season_year}
                onChange={handleSeasonYearChange}
                placeholder="YY"
                maxLength={2}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                required
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">시즌</label>
              <select
                value={formData.season_type}
                onChange={handleSeasonTypeChange}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                required
              >
                <option value="SS">SS</option>
                <option value="FW">FW</option>
              </select>
            </div>
            <div className="w-44">
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy년 M월 d일"
                locale={ko}
                placeholderText="날짜 선택"
                minDate={new Date()}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                wrapperClassName="w-full"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
              <select
                id="planTime"
                value={selectedTime ? format(selectedTime, 'HH:mm') : ''}
                onChange={(e) => setSelectedTime(e.target.value ? new Date(`2000-01-01T${e.target.value}`) : null)}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                <option value="">시간 선택</option>
                {Array.from({ length: 144 }, (_, i) => {
                  const hour = Math.floor(i / 6).toString().padStart(2, '0');
                  const minute = (i % 6 * 10).toString().padStart(2, '0');
                  const timeValue = `${hour}:${minute}`;
                  const currentTime = new Date();
                  const optionTime = new Date(currentTime.setHours(parseInt(hour), parseInt(minute)));
                  
                  if (isToday && optionTime <= new Date()) {
                    return null;
                  }

                  return (
                    <option key={timeValue} value={`${timeValue}`}>
                      {timeValue}
                    </option>
                  );
                }).filter(Boolean)}
              </select>
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품코드</label>
              <input
                type="text"
                value={formData.product_code}
                onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">세트품번</label>
              <select
                value={formData.set_id|| ''}
                onChange={(e) => setFormData({ ...formData, set_id: e.target.value })}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                <option value="">선택하세요</option>
                {setIds.map((set) => (
                  <option key={set.id} value={set.set_id}>
                    {set.remarks? `${set.set_id} - ${set.set_name} - ${set.remarks}` : `${set.set_id} - ${set.set_name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 채널 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">판매채널</label>
              <select
                onChange={(e) => handleChannelChange(e.target.value)}
                value={selectedChannel?.id || ''}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                <option value="">선택하세요</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.channel_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">채널상세</label>
              <select
                name="channel_detail"
                value={formData.channel_detail}
                onChange={(e) => setFormData({ ...formData, channel_detail: e.target.value })}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                <option value="">선택하세요</option>
                {channelDetails.map((detail, index) => (
                  <option key={index} value={detail}>
                    {detail}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 카테고리 및 추가 구성 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                onChange={(e) => {
                  const selected = categories.find(cat => cat.id === Number(e.target.value));
                  setSelectedCategory(selected || null);
                }}
                value={selectedCategory?.id || ''}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                <option value="">선택하세요</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">추가 구성</label>
              <input
                type="text"
                value={formData.quantity_composition}
                onChange={(e) => setFormData({...formData, quantity_composition: e.target.value})}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* 판매 정보 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">판매가</label>
              <input
                type="text"
                value={focusedField === 'price' ? formData.sale_price : formatPrice(formData.sale_price, false)}
                onChange={handleSalePriceChange}
                onFocus={() => setFocusedField('price')}
                onBlur={() => setFocusedField(null)}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수수료율</label>
              <input
                type="text"
                value={focusedField === 'commission' ? formData.commission_rate : formatCommissionRate(formData.commission_rate, false)}
                onChange={handleCommissionRateChange}
                onFocus={() => setFocusedField('commission')}
                onBlur={() => setFocusedField(null)}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">목표수량</label>
              <input
                type="text"
                value={focusedField === 'target' ? formData.target_quantity : formatTarget(formData.target_quantity, false)}
                onChange={handleTargetChange}
                onFocus={() => setFocusedField('target')}
                onBlur={() => setFocusedField(null)}
                className="block w-full h-10 rounded-md border-0 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>

        {/* 미확정 체크박스 추가 - 폼 하단에 배치 */}
        <div className="mt-6 mb-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isUndecided}
              onChange={(e) => setIsUndecided(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">미확정</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            등록
          </button>
        </div>
      </form>
    </Modal>
  );
} 