'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/app/components/common/Modal';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  channels: any[];
  categories: any[];
  setIds: any[];
}

export default function SalesPlanRegistrationModal({ isOpen, onClose, onSuccess, channels, categories, setIds }: Props) {
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
    target_quantity: ''
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [productCode, setProductCode] = useState('');

  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      setFormData(initialFormData);
    }
  }, [isOpen]);

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
    if (!formData.product_name.trim()) {
      alert('상품명을 입력해주세요.');
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
    if (!formData.sale_price) {
      alert('판매가를 입력해주세요.');
      return false;
    }
    if (!formData.commission_rate) {
      alert('수수료율을 입력해주세요.');
      return false;
    }
    if (!formData.target_quantity) {
      alert('목표수량을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const data = {
        season: '24FW',
        plan_date: format(selectedDate!, 'yyyy-MM-dd'),
        plan_time: format(selectedTime!, 'HH:mm:ss'),
        channel_id: selectedChannel.id,
        channel_code: selectedChannel.channel_code,
        channel_detail: (e.target as HTMLFormElement).channel_detail.value,
        product_category: selectedCategory?.category_name || '',
        product_name: formData.product_name,
        product_summary: formData.product_summary,
        quantity_composition: formData.quantity_composition,
        set_id: formData.set_id,
        product_code: formData.product_code,
        sale_price: Number(formData.sale_price),
        commission_rate: Number(formData.commission_rate),
        target_quantity: Number(formData.target_quantity)
      };

      console.log('전송 데이터:', data);

      const response = await fetch('/api/sales/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '등록 실패');
      }

      alert('판매계획이 등록되었습니다.');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : '판매계획 등록 중 오류가 발생했습니다.');
    }
  };

  const currentDate = new Date();
  const isToday = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
  const minTime = isToday ? currentDate : new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="판매계획 등록">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">날짜</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="yyyy-MM-dd"
                  minDate={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">시간</label>
                <DatePicker
                  selected={selectedTime}
                  onChange={(time) => setSelectedTime(time)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="HH:mm"
                  timeFormat="HH:mm"
                  minTime={minTime}
                  maxTime={new Date(new Date().setHours(23, 59, 59, 999))} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">상품코드</label>
              <input
                type="text"
                value={formData.product_code}
                onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">세트품번</label>
              <select
                value={formData.set_id}
                onChange={handleSetIdChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                style={{ minWidth: '300px' }}
              >
                <option value="">선택하세요</option>
                {setIds.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.set_id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">판매채널</label>
              <select
                onChange={(e) => handleChannelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedChannel?.id || ''}
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
              <label className="block text-sm font-medium text-gray-700">채널상세</label>
              <select
                name="channel_detail"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">선택하세요</option>
                {channelDetails.map((detail, index) => (
                  <option key={index} value={detail}>
                    {detail}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">카테고리</label>
              <select
                onChange={(e) => {
                  const selected = categories.find(cat => cat.id === Number(e.target.value));
                  setSelectedCategory(selected || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedCategory?.id || ''}
              >
                <option value="">선택하세요</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">상품 정보</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">상품명</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">요약 상품명</label>
              <input
                type="text"
                value={formData.product_summary}
                onChange={(e) => setFormData({...formData, product_summary: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">추가 구성</label>
              <input
                type="text"
                value={formData.quantity_composition}
                onChange={(e) => setFormData({...formData, quantity_composition: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">판매가</label>
              <input
                type="text"
                value={focusedField === 'price' ? formData.sale_price : formatPrice(formData.sale_price, false)}
                onChange={handleSalePriceChange}
                onFocus={() => setFocusedField('price')}
                onBlur={() => setFocusedField(null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="판매가"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">수수료율</label>
                <input
                  type="text"
                  value={focusedField === 'commission' ? formData.commission_rate : formatCommissionRate(formData.commission_rate, false)}
                  onChange={handleCommissionRateChange}
                  onFocus={() => setFocusedField('commission')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="수수료율"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">목표수량</label>
                <input
                  type="text"
                  value={focusedField === 'target' ? formData.target_quantity : formatTarget(formData.target_quantity, false)}
                  onChange={handleTargetChange}
                  onFocus={() => setFocusedField('target')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="목표수량"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
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