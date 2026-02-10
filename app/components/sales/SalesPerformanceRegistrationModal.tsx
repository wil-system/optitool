'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/app/components/common/Modal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ISalesPlanWithPerformance } from '@/app/types/database';
import { supabase } from '@/utils/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planData: ISalesPlanWithPerformance;
}

export default function SalesPerformanceRegistrationModal({ isOpen, onClose, onSuccess, planData }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    sale_price: '',
    commission_rate: '',
    target_quantity: '',
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
    if (isOpen && planData) {
      setFormData({
        sale_price: planData.sale_price?.toString() || '',
        commission_rate: planData.commission_rate?.toString() || '',
        target_quantity: planData.target_quantity?.toString() || '',
        total_order_quantity: planData.total_order_quantity?.toString() || '',
        net_order_quantity: planData.net_order_quantity?.toString() || '',
        total_sales: planData.total_sales?.toString() || '',
        net_sales: planData.net_sales?.toString() || '',
        achievement_rate: planData.achievement_rate?.toString() || '',
        pre_order_rate: planData.pre_order_rate?.toString() || '',
        total_achievement_rate: planData.total_achievement_rate?.toString() || '',
        size_85: planData.size_85?.toString() || '',
        size_90: planData.size_90?.toString() || '',
        size_95: planData.size_95?.toString() || '',
        size_100: planData.size_100?.toString() || '',
        size_105: planData.size_105?.toString() || '',
        size_110: planData.size_110?.toString() || '',
        size_115: planData.size_115?.toString() || '',
        size_120: planData.size_120?.toString() || '',
      });
    }
  }, [isOpen, planData]);

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
      
      // 판매가 가져오기
      const salePrice = Number(newData.sale_price || 0);
      
      // 수량 또는 판매가 변경 시 매출 자동 계산
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
        .eq('id', planData.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving performance:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="실적 등록"
      width="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 기본 정보 요약 (읽기 전용) */}
        <div className="bg-muted p-4 rounded-xl border border-border grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">시즌</p>
            <p className="text-sm font-bold text-foreground">
              {planData.season_year ? `${planData.season_year.slice(-2)}${planData.season || ''}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">일자/시간</p>
            <p className="text-sm font-bold text-foreground">{planData.plan_date} {planData.plan_time?.substring(0, 5)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">채널</p>
            <p className="text-sm font-bold text-foreground">{planData.channel_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">세트품번</p>
            <p className="text-sm font-bold text-foreground">{planData.set_item_code || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">상품명</p>
            <p className="text-sm font-bold text-foreground truncate" title={planData.product_name || ''}>{planData.product_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">추가구성</p>
            <p className="text-sm font-bold text-foreground truncate" title={planData.additional_composition || ''}>{planData.additional_composition || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">추가품번</p>
            <p className="text-sm font-bold text-foreground">{planData.additional_item_code || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 계획 정보 수정 */}
          <div className="space-y-4 border-r border-border pr-6">
            <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              계획 정보 수정
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">판매가</label>
                <input
                  type="text"
                  name="sale_price"
                  value={formatNumberWithCommas(formData.sale_price)}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-right font-bold text-blue-700 dark:text-blue-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">수수료(%)</label>
                <input
                  type="text"
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-right font-bold text-blue-700 dark:text-blue-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">목표수량</label>
                <input
                  type="text"
                  name="target_quantity"
                  value={formData.target_quantity}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-right font-bold text-blue-700 dark:text-blue-300"
                />
              </div>
            </div>
          </div>

          {/* 실적 정보 */}
          <div className="space-y-4 border-r border-border pr-6">
            <h4 className="text-sm font-bold text-orange-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-600 rounded-full"></span>
              실적 데이터 입력
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-[10px]">총주문수량</label>
                <input
                  type="text"
                  name="total_order_quantity"
                  value={formData.total_order_quantity}
                  onChange={handleNumberChange}
                  className="w-full px-2 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all text-right font-bold text-orange-700 dark:text-orange-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-[10px]">순주문수량</label>
                <input
                  type="text"
                  name="net_order_quantity"
                  value={formData.net_order_quantity}
                  onChange={handleNumberChange}
                  className="w-full px-2 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all text-right font-bold text-orange-700 dark:text-orange-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-[10px]">총매출</label>
                <input
                  type="text"
                  name="total_sales"
                  value={formatNumberWithCommas(formData.total_sales)}
                  onChange={handleNumberChange}
                  className="w-full px-2 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all text-right font-bold text-orange-700 dark:text-orange-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-[10px]">순매출</label>
                <input
                  type="text"
                  name="net_sales"
                  value={formatNumberWithCommas(formData.net_sales)}
                  onChange={handleNumberChange}
                  className="w-full px-2 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all text-right font-bold text-orange-700 dark:text-orange-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-[10px]">달성율(%)</label>
                <input
                  type="text"
                  name="achievement_rate"
                  value={formData.achievement_rate}
                  onChange={handleNumberChange}
                  className="w-full px-1 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all text-right font-bold text-purple-600 dark:text-purple-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-[10px]">미리주문(%)</label>
                <input
                  type="text"
                  name="pre_order_rate"
                  value={formData.pre_order_rate}
                  onChange={handleNumberChange}
                  className="w-full px-1 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all text-right font-bold text-purple-600 dark:text-purple-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground text-[10px]">종합달성(%)</label>
                <input
                  type="text"
                  name="total_achievement_rate"
                  value={formData.total_achievement_rate}
                  onChange={handleNumberChange}
                  className="w-full px-1 py-2 bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all text-right font-bold text-purple-600 dark:text-purple-400"
                />
              </div>
            </div>
          </div>

          {/* 사이즈별 수량 */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-600 rounded-full"></span>
              사이즈별 수량
            </h4>
            
            <div className="grid grid-cols-4 gap-x-2 gap-y-4 bg-emerald-50/10 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-50 dark:border-emerald-900">
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
                    className="w-full px-1 py-2 bg-card border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right font-semibold text-emerald-700 dark:text-emerald-300"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg border border-dashed border-border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">사이즈 합계</span>
                <span className="text-emerald-600 font-bold">
                  {([85, 90, 95, 100, 105, 110, 115, 120].reduce((acc, size) => acc + Number((formData as any)[`size_${size}`] || 0), 0)).toLocaleString()} 개
                </span>
              </div>
            </div>
          </div>
        </div>

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
            className="px-8 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : '실적 저장 완료'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
