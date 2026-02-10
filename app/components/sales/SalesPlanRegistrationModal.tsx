'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/app/components/common/Modal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ISalesPlanWithPerformance } from '@/app/types/database';
import { supabase } from '@/utils/supabase';
import SetProductSelectionModal from './SetProductSelectionModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: ISalesPlanWithPerformance;
  channels: { id: number; channel_name: string }[];
}

export default function SalesPlanRegistrationModal({ isOpen, onClose, onSuccess, editData, channels }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSetModalOpen, setIsSetSetModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    season_year: '',
    season: 'SS',
    channel_name: '',
    set_item_code: '',
    product_name: '',
    additional_composition: '',
    additional_item_code: '',
    sale_price: '',
    commission_rate: '',
    target_quantity: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          season_year: editData.season_year || '',
          season: editData.season || 'SS',
          channel_name: editData.channel_name || '',
          set_item_code: editData.set_item_code || '',
          product_name: editData.product_name || '',
          additional_composition: editData.additional_composition || '',
          additional_item_code: editData.additional_item_code || '',
          sale_price: editData.sale_price?.toString() || '',
          commission_rate: editData.commission_rate?.toString() || '',
          target_quantity: editData.target_quantity?.toString() || '',
        });
        setSelectedDate(editData.plan_date ? new Date(editData.plan_date) : null);
        setSelectedTime(editData.plan_time?.substring(0, 5) || '');
      } else {
        setFormData({
          season_year: new Date().getFullYear().toString(),
          season: 'SS',
          channel_name: '',
          set_item_code: '',
          product_name: '',
          additional_composition: '',
          additional_item_code: '',
          sale_price: '',
          commission_rate: '',
          target_quantity: '',
        });
        setSelectedDate(null);
        setSelectedTime('');
      }
    }
  }, [isOpen, editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatNumberWithCommas = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString();
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        plan_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
        plan_time: selectedTime ? `${selectedTime}:00` : null,
        sale_price: Number(formData.sale_price || 0),
        commission_rate: Number(formData.commission_rate || 0),
        target_quantity: Number(formData.target_quantity || 0),
      };

      let error;
      if (editData) {
        const { error: updateError } = await supabase
          .from('sales_plans_with_performance')
          .update(submitData)
          .eq('id', editData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('sales_plans_with_performance')
          .insert([submitData]);
        error = insertError;
      }

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving sales plan:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSelect = (set: { set_id: string; set_name: string }) => {
    setFormData(prev => ({
      ...prev,
      set_item_code: set.set_id,
      product_name: set.set_name
    }));
    setIsSetSetModalOpen(false);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editData ? "판매계획 수정" : "판매계획 추가"}
      width="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 시즌 정보 */}
          <div className="space-y-4 border-b border-border pb-4 md:border-b-0 md:pb-0 md:border-r md:pr-6">
            <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              기본 정보
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">시즌년도 (YYYY)</label>
                <input
                  type="text"
                  name="season_year"
                  value={formData.season_year}
                  onChange={handleNumberChange}
                  placeholder="2024"
                  maxLength={4}
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-blue-700 dark:text-blue-300"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">시즌</label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-blue-700 dark:text-blue-300 [&>option]:bg-card [&>option]:text-foreground"
                >
                  <option value="SS">SS</option>
                  <option value="FW">FW</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">일자</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  placeholderText="날짜 선택"
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-blue-700 dark:text-blue-300"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">시작시간</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  step="60"
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-blue-700 dark:text-blue-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">채널</label>
              <select
                name="channel_name"
                value={formData.channel_name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-blue-700 dark:text-blue-300 [&>option]:bg-card [&>option]:text-foreground"
                required
              >
                <option value="">채널 선택</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.channel_name}>
                    {channel.channel_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-600 rounded-full"></span>
              상품 및 판매 정보
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">세트품번</label>
                <div className="relative">
                  <input
                    type="text"
                    name="set_item_code"
                    value={formData.set_item_code}
                    readOnly
                    onClick={() => setIsSetSetModalOpen(true)}
                    className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer hover:border-emerald-400 font-semibold text-emerald-700 dark:text-emerald-300"
                    placeholder="클릭하여 선택"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsSetSetModalOpen(true)}
                    className="absolute right-2 top-1.5 p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">추가품번</label>
                <input
                  type="text"
                  name="additional_item_code"
                  value={formData.additional_item_code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold text-emerald-700 dark:text-emerald-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">상품명</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold text-emerald-700 dark:text-emerald-300"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">추가구성</label>
              <input
                type="text"
                name="additional_composition"
                value={formData.additional_composition}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold text-emerald-700 dark:text-emerald-300"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">판매가</label>
                <input
                  type="text"
                  name="sale_price"
                  value={formatNumberWithCommas(formData.sale_price)}
                  onChange={handlePriceChange}
                  className="w-full px-2 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right font-bold text-emerald-700 dark:text-emerald-300"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">수수료(%)</label>
                <input
                  type="text"
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleNumberChange}
                  className="w-full px-2 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right font-bold text-emerald-700 dark:text-emerald-300"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">목표</label>
                <input
                  type="text"
                  name="target_quantity"
                  value={formData.target_quantity}
                  onChange={handleNumberChange}
                  className="w-full px-2 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right font-bold text-emerald-700 dark:text-emerald-300"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-card border border-border text-muted-foreground text-sm font-bold rounded-xl hover:bg-muted transition-all"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : (editData ? '수정 완료' : '계획 등록')}
          </button>
        </div>
      </form>

      <SetProductSelectionModal
        isOpen={isSetModalOpen}
        onClose={() => setIsSetSetModalOpen(false)}
        onSelect={handleSetSelect}
      />
    </Modal>
  );
}
