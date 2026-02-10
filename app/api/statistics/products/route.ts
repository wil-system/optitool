import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { ICombinedSalesData , IProductStatistics } from '@/app/types/statistics';

interface IProductStatsMap {
  [key: string]: ICombinedSalesData;
}

// 데이터베이스 쿼리 결과 타입 정의
interface SalesPlan {
  id: number;
  season: string;
  plan_date: string;
  channel_code: string;
  channel_detail: string;
  product_category: string;
  product_name: string;
  product_summary: string;
  quantity_composition: string;
  set_id: number;
  product_code: string;
  sale_price: number;
  commission_rate: number;
  target_quantity: number;
  channel_id: number;
  set_products: {
    id: number;
    set_id: number;
    set_name: string;
    individual_product_ids: string;
  }[];
}

interface QueryResult {
  id: number;
  performance: number;
  achievement_rate: number;
  temperature: number;
  xs_size: number;
  s_size: number;
  m_size: number;
  l_size: number;
  xl_size: number;
  xxl_size: number;
  fourxl_size: number;
  sales_plans: {
    id: number;
    season: string;
    plan_date: string;
    channel_code: string;
    channel_detail: string;
    product_category: string;
    product_name: string;
    product_summary: string;
    quantity_composition: string;
    set_id: number;
    product_code: string;
    sale_price: number;
    commission_rate: number;
    target_quantity: number;
    channel_id: number;
    set_products: {
      individual_product_ids: string;
    };
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'monthly';

    let query = supabase
      .from('sales_plans_with_performance')
      .select('*')
      .or('net_order_quantity.gt.0,total_order_quantity.gt.0');

    if (startDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startDateTime.getHours() + 9);
      query = query.gte('plan_date', startDateTime.toISOString());
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(endDateTime.getHours() + 9);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('plan_date', endDateTime.toISOString());
    }

    const { data, error } = await query;
    
    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({});

    // 기간별 그룹화
    const groupedStats = data.reduce((acc: Record<string, any[]>, curr: any) => {
      const planDate = curr.plan_date;
      if (!planDate) return acc;

      const date = new Date(planDate);
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      const originalDate = kstDate.toISOString().split('T')[0];

      let groupKey;
      switch (period) {
        case 'yearly':
          groupKey = `${kstDate.getFullYear()}`;
          break;
        case 'monthly':
          groupKey = `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'daily':
          groupKey = originalDate;
          break;
        case 'custom':
          groupKey = 'custom';
          break;
        default:
          groupKey = originalDate;
      }

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(curr);
      return acc;
    }, {});

    // 그룹별 set_item_code + channel_name 기준 통계 계산
    const result = Object.entries(groupedStats).reduce((acc, [date, items]: [string, any[]]) => {
      const setStats = items.reduce((setAcc: Record<string, IProductStatistics>, curr: any) => {
        const itemCode = curr.set_item_code || 'unknown';
        const channelName = curr.channel_name || 'unknown';
        const key = `${itemCode}_${channelName}`;
        
        if (!setAcc[key]) {
          setAcc[key] = {
            product_name: curr.product_name || '-',
            set_product_code: itemCode,
            channel: channelName,
            channel_detail: '-',
            category: '-',
            sales_amount: Number(curr.net_sales || 0),
            total_sales: Number(curr.total_sales || 0),
            performance: Number(curr.net_order_quantity || 0),
            total_order: Number(curr.total_order_quantity || 0),
            target: Number(curr.target_quantity || 0),
            achievement_rate: Number(curr.achievement_rate || 0),
            total_achievement_rate: Number(curr.total_achievement_rate || 0),
            share: 0,
            temperature: Number(curr.pre_order_rate || 0),
            operation_count: 1
          };
        } else {
          setAcc[key].sales_amount += Number(curr.net_sales || 0);
          setAcc[key].total_sales += Number(curr.total_sales || 0);
          setAcc[key].performance += Number(curr.net_order_quantity || 0);
          setAcc[key].total_order += Number(curr.total_order_quantity || 0);
          setAcc[key].target += Number(curr.target_quantity || 0);
          setAcc[key].operation_count += 1;
          
          // DB 데이터를 그대로 사용하되, 여러 건일 경우 평균값으로 유지
          setAcc[key].achievement_rate = (setAcc[key].achievement_rate * (setAcc[key].operation_count - 1) + Number(curr.achievement_rate || 0)) / setAcc[key].operation_count;
          setAcc[key].total_achievement_rate = (setAcc[key].total_achievement_rate * (setAcc[key].operation_count - 1) + Number(curr.total_achievement_rate || 0)) / setAcc[key].operation_count;
          setAcc[key].temperature = (setAcc[key].temperature * (setAcc[key].operation_count - 1) + Number(curr.pre_order_rate || 0)) / setAcc[key].operation_count;
        }
        return setAcc;
      }, {});

      // 점유율 계산
      const products = Object.values(setStats);
      const totalPerformance = products.reduce((sum, p) => sum + p.performance, 0);
      products.forEach(p => {
        p.share = totalPerformance > 0 ? (p.performance / totalPerformance) * 100 : 0;
      });

      acc[date] = products;
      return acc;
    }, {} as Record<string, IProductStatistics[]>);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 