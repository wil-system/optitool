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
  editData: ISalesPlanWithPerformance;
  channels: { id: number; channel_name: string }[];
}

export default function SalesCombinedEditModal({ isOpen, onClose, onSuccess, editData, channels }: Props) {
  const [activeTab, setActiveTab] = useState<'plan' | 'performance'>('plan');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSetModalOpen, setIsSetSetModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    // 계획 정보
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
    
    // 실적 정보
    total_order_quantity: '',
    net_order_quantity: '',
    total_sales: '',
    net_sales: '',
    achievement_rate: '',
    pre_order_rate: '',
    total_achievement_rate: '',
    size_85: '',
    size_90: '',
    size_95: '',
    size_100: '',
    size_105: '',
    size_110: '',
    size_115: '',
    size_120: '',
  });

  useEffect(() => {
    if (isOpen && editData) {
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
        total_order_quantity: editData.total_order_quantity?.toString() || '',
        net_order_quantity: editData.net_order_quantity?.toString() || '',
        total_sales: editData.total_sales?.toString() || '',
        net_sales: editData.net_sales?.toString() || '',
        achievement_rate: editData.achievement_rate?.toString() || '',
        pre_order_rate: editData.pre_order_rate?.toString() || '',
        total_achievement_rate: editData.total_achievement_rate?.toString() || '',
        size_85: editData.size_85?.toString() || '',
        size_90: editData.size_90?.toString() || '',
        size_95: editData.size_95?.toString() || '',
        size_100: editData.size_100?.toString() || '',
        size_105: editData.size_105?.toString() || '',
        size_110: editData.size_110?.toString() || '',
        size_115: editData.size_115?.toString() || '',
        size_120: editData.size_120?.toString() || '',
      });
      setSelectedDate(editData.plan_date ? new Date(editData.plan_date) : null);
      setSelectedTime(editData.plan_time?.substring(0, 5) || '');
    }
  }, [isOpen, editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatNumberWithCommas = (value: string) => {
    const num = value.replace(/[^0-9.]/g, '');
    if (!num) return '';
    const parts = num.split('.');
    parts[0] = Number(parts[0]).toLocaleString();
    return parts.join('.');
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value.replace(/[^0-9.]/g, '');
    
    setFormData(prev => {
      const newData = { ...prev, [name]: numValue };
      
      // 실적 탭에서 금액 자동 계산 로직 (판매가 기준)
      const salePrice = Number(newData.sale_price || 0);
      if (salePrice > 0) {
        if (name === 'total_order_quantity' || name === 'sale_price') {
          newData.total_sales = Math.round(Number(newData.total_order_quantity || 0) * salePrice).toString();
        }
        if (name === 'net_order_quantity' || name === 'sale_price') {
          newData.net_sales = Math.round(Number(newData.net_order_quantity || 0) * salePrice).toString();
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        season_year: formData.season_year,
        season: formData.season,
        channel_name: formData.channel_name,
        set_item_code: formData.set_item_code,
        product_name: formData.product_name,
        additional_composition: formData.additional_composition,
        additional_item_code: formData.additional_item_code,
        plan_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
        plan_time: selectedTime ? `${selectedTime}:00` : null,
        sale_price: Number(formData.sale_price || 0),
        commission_rate: Number(formData.commission_rate || 0),
        target_quantity: Number(formData.target_quantity || 0),
        total_order_quantity: Number(formData.total_order_quantity || 0),
        net_order_quantity: Number(formData.net_order_quantity || 0),
        total_sales: Number(formData.total_sales || 0),
        net_sales: Number(formData.net_sales || 0),
        achievement_rate: Number(formData.achievement_rate || 0),
        pre_order_rate: Number(formData.pre_order_rate || 0),
        total_achievement_rate: Number(formData.total_achievement_rate || 0),
        size_85: Number(formData.size_85 || 0),
        size_90: Number(formData.size_90 || 0),
        size_95: Number(formData.size_95 || 0),
        size_100: Number(formData.size_100 || 0),
        size_105: Number(formData.size_105 || 0),
        size_110: Number(formData.size_110 || 0),
        size_115: Number(formData.size_115 || 0),
        size_120: Number(formData.size_120 || 0),
      };

      const { error } = await supabase
        .from('sales_plans_with_performance')
        .update(submitData)
        .eq('id', editData.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
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
      title="데이터 수정"
      width="max-w-5xl"
    >
      <div className="flex p-2 gap-2 bg-muted/50 border-b border-border">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'plan' 
              ? 'bg-card text-blue-600 shadow-sm ring-1 ring-border' 
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <svg className={`w-4 h-4 ${activeTab === 'plan' ? 'text-blue-500' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          계획 정보 수정
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'performance' 
              ? 'bg-card text-orange-600 shadow-sm ring-1 ring-border' 
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <svg className={`w-4 h-4 ${activeTab === 'performance' ? 'text-orange-500' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          실적 정보 수정
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {activeTab === 'plan' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 기본 정보 */}
            <div className="space-y-4 border-r border-border pr-8">
              <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                기본 정보
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">시즌년도</label>
                  <input
                    type="text"
                    name="season_year"
                    value={formData.season_year}
                    onChange={handleNumberChange}
                    maxLength={4}
                    className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">시즌</label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300 [&>option]:bg-card [&>option]:text-foreground"
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
                    className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">시작시간</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300 [color-scheme:light]"
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
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300 [&>option]:bg-card [&>option]:text-foreground"
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
                      className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-300 cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">추가품번</label>
                  <input
                    type="text"
                    name="additional_item_code"
                    value={formData.additional_item_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-300"
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
                  className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-300"
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
                  className="w-full px-3 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">판매가</label>
                  <input
                    type="text"
                    name="sale_price"
                    value={formatNumberWithCommas(formData.sale_price)}
                    onChange={handleNumberChange}
                    className="w-full px-2 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 text-right"
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
                    className="w-full px-2 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 text-right"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">목표수량</label>
                  <input
                    type="text"
                    name="target_quantity"
                    value={formData.target_quantity}
                    onChange={handleNumberChange}
                    className="w-full px-2 py-2 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 text-right"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 실적 데이터 */}
            <div className="space-y-6 border-r border-border pr-8">
              <h4 className="text-sm font-bold text-orange-600 flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-600 rounded-full"></span>
                실적 데이터 수정
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">총주문수량</label>
                  <input
                    type="text"
                    name="total_order_quantity"
                    value={formData.total_order_quantity}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-sm font-bold text-orange-700 dark:text-orange-300 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">순주문수량</label>
                  <input
                    type="text"
                    name="net_order_quantity"
                    value={formData.net_order_quantity}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-sm font-bold text-orange-700 dark:text-orange-300 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">총매출</label>
                  <input
                    type="text"
                    name="total_sales"
                    value={formatNumberWithCommas(formData.total_sales)}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-sm font-bold text-orange-700 dark:text-orange-300 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">순매출</label>
                  <input
                    type="text"
                    name="net_sales"
                    value={formatNumberWithCommas(formData.net_sales)}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-sm font-bold text-orange-700 dark:text-orange-300 text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">달성율(%)</label>
                  <input
                    type="text"
                    name="achievement_rate"
                    value={formData.achievement_rate}
                    onChange={handleNumberChange}
                    className="w-full px-2 py-2 bg-purple-50/30 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">미리주문(%)</label>
                  <input
                    type="text"
                    name="pre_order_rate"
                    value={formData.pre_order_rate}
                    onChange={handleNumberChange}
                    className="w-full px-2 py-2 bg-purple-50/30 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">종합달성(%)</label>
                  <input
                    type="text"
                    name="total_achievement_rate"
                    value={formData.total_achievement_rate}
                    onChange={handleNumberChange}
                    className="w-full px-2 py-2 bg-purple-50/30 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 text-right"
                  />
                </div>
              </div>
            </div>

            {/* 사이즈별 수량 */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-600 rounded-full"></span>
                사이즈별 수량 수정
              </h4>
              <div className="grid grid-cols-4 gap-3 bg-emerald-50/10 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-50 dark:border-emerald-900">
                {[
                  { size: 85, label: '85(XS)' },
                  { size: 90, label: '90(S)' },
                  { size: 95, label: '95(M)' },
                  { size: 100, label: '100(L)' },
                  { size: 105, label: '105(XL)' },
                  { size: 110, label: '110(XXL)' },
                  { size: 115, label: '115(3XL)' },
                  { size: 120, label: '120(4XL)' }
                ].map((item) => (
                  <div key={item.size} className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-500 text-center block">{item.label}</label>
                    <input
                      type="text"
                      name={`size_${item.size}`}
                      value={(formData as any)[`size_${item.size}`]}
                      onChange={handleNumberChange}
                      className="w-full px-1 py-2 bg-card border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-right"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-border">
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
            className={`px-8 py-2.5 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 ${
              activeTab === 'plan' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isLoading ? '저장 중...' : '모든 변경사항 저장'}
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
