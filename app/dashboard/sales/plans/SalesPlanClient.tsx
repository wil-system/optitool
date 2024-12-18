'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';
import { supabase } from '@/utils/supabase';
import { format } from 'date-fns';

interface Channel {
  id: number;
  channel_code: string;
  channel_name: string;
  channel_details: string[];
}

interface SetProduct {
  id: string;
  set_id: string;
  set_name: string;
  is_active: boolean;
}

interface Category {
  category_code: string;
  category_name: string;
  category_details: string[];
}

interface Props {
  initialData: {
    channels: Channel[];
    sets: SetProduct[];
    categories: Category[];
  };
}

const SalesPlanClient = ({ initialData }: Props) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  
  // 초기 데이터로 상태 초기화
  const [channels] = useState<Channel[]>(initialData.channels);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelDetails, setChannelDetails] = useState<string[]>([]);
  const [sets] = useState<SetProduct[]>(initialData.sets);
  const [categories] = useState<Category[]>(initialData.categories);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryDetails, setCategoryDetails] = useState<string[]>([]);

  // 상태 추가
  const [formattedSalePrice, setFormattedSalePrice] = useState<string>('');
  const [formattedCommissionRate, setFormattedCommissionRate] = useState<string>('');
  const [formattedTarget, setFormattedTarget] = useState<string>('');

  // 채널 선택 시 채널상세 업데이트
  const handleChannelChange = (channelId: string) => {
    const selected = channels.find(ch => ch.id === Number(channelId));
    setSelectedChannel(selected || null);
    setChannelDetails(selected?.channel_details || []);
  };

  // 카테고리 선택 핸들러 추가
  const handleCategoryChange = (categoryCode: string) => {
    console.log('Selected category code:', categoryCode); // 디버깅용
    const selected = categories.find(cat => cat.category_name === categoryCode);
    console.log('Found category:', selected); // 디버깅용
    
    if (!categoryCode) return; // 빈 값 선택 시 리턴

    setSelectedCategory(selected || null);
    setCategoryDetails(selected?.category_details || []);
  };

  // 엔터키 방지 함수 추가
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.currentTarget as HTMLFormElement;

    // 필수 필드 검증
    if (!selectedDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    if (!selectedTime) {
      alert('시간을 선택해주세요.');
      return;
    }

    if (!selectedChannel) {
      alert('판매채널을 선택해주세요.');
      return;
    }

    // 단위와 쉼표 제거 후 숫자로 변환
    const targetQuantity = Number(formattedTarget.replace(/[개,]/g, ''));
    
    // 목표 수량 검증
    if (!targetQuantity || targetQuantity <= 0) {
      alert('유효한 목표 수량을 입력해주세요.');
      return;
    }

    try {
      const formData = {
        season: '24FW',
        plan_date: format(selectedDate, 'yyyy-MM-dd'),
        plan_time: selectedTime.toTimeString().split(' ')[0],
        channel_id: selectedChannel?.id,
        channel_code: selectedChannel?.channel_code,
        channel_detail: form.channel_detail.value || '',
        product_category: selectedCategory?.category_name || '',
        product_name: form.product_name.value || '',
        product_summary: form.product_summary.value || '',
        quantity_composition: form.quantity_composition.value || '',
        set_id: form.set_id.value || '',
        product_code: form.product_code.value || '',
        sale_price: Number(formattedSalePrice.replace(/[원,]/g, '')) || 0,
        commission_rate: Number(formattedCommissionRate.replace('%', '')) || 0,
        target_quantity: Number(formattedTarget.replace(/[개,]/g, ''))
      };

      console.log('전송할 데이터:', formData);

      const response = await fetch('/api/sales/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log('API 응답:', result);

      if (!response.ok) {
        throw new Error(result.error || '판매계획 등록에 실패했습니다.');
      }

      alert('판매계획이 등록되었습니다.');
      
      // 폼 초기화
      form.reset();
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedChannel(null);
      setSelectedCategory(null);
      setFormattedSalePrice('');
      setFormattedCommissionRate('');
      setFormattedTarget('');

    } catch (error) {
      console.error('Error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      alert('판매계획 등록 중 오류가 발생했습니다.');
    }
  };

  // 디버깅을 위해 categories 데이터 로깅 추가
  useEffect(() => {
    console.log('Categories data:', categories);
  }, [categories]);

  useEffect(() => {
    console.log('Categories:', categories);
    console.log('Selected Category:', selectedCategory);
  }, [categories, selectedCategory]);

  // 날짜 선택 핸들러
  const handleDateChange = (date: Date | null) => {
    console.log('Selected Date Object:', date);
    console.log('ISO String:', date?.toISOString());
    console.log('Local Date String:', date?.toLocaleDateString());
    setSelectedDate(date);
  };

  useEffect(() => {
    if (selectedCategory) {
      setCategoryDetails(selectedCategory.category_details || []);
    }
  }, [selectedCategory]);

  useEffect(() => {
    console.log('세트 데이터:', sets.map(set => ({
      ...set,
      is_active: set.is_active
    })));
  }, [sets]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">판매계획</h1>
        
        <form 
          onSubmit={handleSubmit} 
          onKeyDown={handleKeyDown}  // 엔터키 방지 핸들러 추가
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">판매계획 정보</h2>
            
            <div className="grid grid-cols-3 gap-6">
              {/* 첫 번째  */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  운영시즌
                </label>
                <input 
                  type="text" 
                  defaultValue="24FW"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  일자
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="yyyy-MM-dd"
                  className="w-40 px-3 py-2 border border-gray-300 rounded-md"
                  placeholderText="날짜 선택"
                  locale={ko}
                  minDate={new Date()}
                  popperContainer={({ children }) => (
                    <div className="absolute top-full left-0 z-50 mt-1">{children}</div>
                  )}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시간
                </label>
                <DatePicker
                  selected={selectedTime}
                  onChange={(time: Date | null) => {
                    if (selectedDate?.toDateString() === new Date().toDateString() && 
                        time && time < new Date()) {
                      alert('현재 시간 이후로 선택해주세요.');
                      return;
                    }
                    setSelectedTime(time);
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="시간"
                  dateFormat="HH:mm"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                  placeholderText="시간 선택"
                  locale={ko}
                  popperContainer={({ children }) => (
                    <div className="absolute top-full left-0 z-50 mt-1">{children}</div>
                  )}
                />
              </div>

              {/* 두 번째 열 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  판매채널
                </label>
                <select 
                  className="w-48 px-3 py-2 border border-gray-300 rounded-md"
                  onChange={(e) => handleChannelChange(e.target.value)}
                >
                  <option value="" key="default-channel">판매채널 선택</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.channel_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  채널상세
                </label>
                <select 
                  name="channel_detail" 
                  className="w-48 px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!selectedChannel}
                >
                  <option value="" key="default-channel-detail">채널상세 선택</option>
                  {channelDetails.map((detail, index) => (
                    <option key={`${selectedChannel?.id}-detail-${index}`} value={detail}>
                      {detail}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품카테고리
                </label>
                <select 
                  name="product_category"  
                  className="w-48 px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedCategory?.category_name || ''}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="" key="default-category">카테고리 선택</option>
                  {categories?.map((category) => (
                    <option 
                      key={`category-${category.category_name}`}
                      value={category.category_name}
                    >
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 세 번째 열 - 상품명, 요약상품명 */}
              <div className="col-span-3 grid grid-cols-2 gap-6">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    상품명
                  </label>
                  <input 
                    type="text"
                    name="product_name"
                    className="w-96 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    요약상품명
                  </label>
                  <input 
                    type="text"
                    name="product_summary"
                    className="w-80 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 네 번째 열 - 세트품번, 상품코드, 추가구성 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세트품번
                </label>
                <select 
                  name="set_id"
                  className="w-40 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="" key="default-set">세트품번 선택</option>
                  {sets
                    .filter(set => set.is_active !== false)
                    .map((set, index) => (
                      <option 
                        key={`set-${set.set_id}-${index}`}
                        value={set.set_id}
                      >
                        {set.set_id} - {set.set_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품코드
                </label>
                <input 
                  type="text"
                  name="product_code"
                  className="w-40 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  추가구성
                </label>
                <input 
                  type="text" 
                  name="quantity_composition"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>


              {/* 다섯 번째 열에 판매가, 수수료, 목표 배치 */}
              <div className="col-span-3 grid grid-cols-3 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    판매가
                  </label>
                  <input 
                    type="text"
                    name="sale_price"
                    className="w-40 px-3 py-2 pr-12 border border-gray-300 rounded-md text-right"
                    maxLength={11}
                    value={formattedSalePrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      if (value) {
                        setFormattedSalePrice(Number(value).toLocaleString());
                      } else {
                        setFormattedSalePrice('');
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value && !e.target.value.endsWith('원')) {
                        setFormattedSalePrice(e.target.value.replace(/,/g, '').replace(/[^\d]/g, '') 
                          ? Number(e.target.value.replace(/,/g, '').replace(/[^\d]/g, '')).toLocaleString() + '원'
                          : '');
                      }
                    }}
                    onFocus={(e) => {
                      setFormattedSalePrice(e.target.value.replace(/[원,]/g, ''));
                    }}
                    onKeyDown={handleKeyDown}  // 엔터키 방지 추가
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    수수료
                  </label>
                  <input 
                    type="text"
                    name="commission_rate"
                    className="w-40 px-3 py-2 pr-12 border border-gray-300 rounded-md text-right"
                    maxLength={4}
                    value={formattedCommissionRate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      if (value) {
                        const numValue = Math.min(100, Number(value));
                        setFormattedCommissionRate(numValue.toString());
                      } else {
                        setFormattedCommissionRate('');
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value && !e.target.value.endsWith('%')) {
                        setFormattedCommissionRate(e.target.value.replace(/[^\d]/g, '') 
                          ? Math.min(100, Number(e.target.value.replace(/[^\d]/g, ''))).toString() + '%'
                          : '');
                      }
                    }}
                    onFocus={(e) => {
                      setFormattedCommissionRate(e.target.value.replace('%', ''));
                    }}
                    onKeyDown={handleKeyDown}  // 엔터키 방지 추가
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    목표
                  </label>
                  <input 
                    type="text"
                    name="target_quantity"
                    className="w-40 px-3 py-2 pr-12 border border-gray-300 rounded-md text-right"
                    maxLength={11}
                    value={formattedTarget}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      if (value) {
                        setFormattedTarget(Number(value).toLocaleString());
                      } else {
                        setFormattedTarget('');
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value && !e.target.value.endsWith('개')) {
                        setFormattedTarget(e.target.value.replace(/,/g, '').replace(/[^\d]/g, '') 
                          ? Number(e.target.value.replace(/,/g, '').replace(/[^\d]/g, '')).toLocaleString() + '개'
                          : '');
                      }
                    }}
                    onFocus={(e) => {
                      setFormattedTarget(e.target.value.replace(/[개,]/g, ''));
                    }}
                    onKeyDown={handleKeyDown}  // 엔터키 방지 추가
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={() => {
                if(confirm('입력을 취소하시겠습니까?')) {
                  (document.querySelector('form') as HTMLFormElement).reset();
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setSelectedChannel(null);
                  setSelectedCategory(null);
                }
              }}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default SalesPlanClient; 