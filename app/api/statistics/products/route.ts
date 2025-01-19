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
  is_active: boolean;
  set_products: {
    id: number;
    set_id: number;
    set_name: string;
    individual_product_ids: string;
    is_active: boolean;
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
  is_active: boolean;
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
    is_active: boolean;
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
    .from('sales_performance')
    .select(`
      id,
      performance,
      achievement_rate,
      temperature,
      xs_size,
      s_size,
      m_size,
      l_size,
      xl_size,
      xxl_size,
      fourxl_size,
      is_active,
      sales_plans!inner(
        id,
        season,
        plan_date,
        channel_code,
        channel_detail,
        product_category,
        product_name,
        product_summary,
        quantity_composition,
        set_id,
        product_code,
        sale_price,
        commission_rate,
        target_quantity,
        channel_id,
        is_active,
        set_products(
          id,
          set_id,
          set_name,
          individual_product_ids,
          is_active
        ),
        sales_channels(
          id,
          channel_code,
          channel_name,
          channel_details,
          is_active
        )
      )
    `)
    .eq('is_active', true)
    .eq('sales_plans.is_active', true)
    .eq('sales_plans.set_products.is_active', true)
    .eq('sales_plans.sales_channels.is_active', true);

    if (startDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startDateTime.getHours() + 9);
      query = query.gte('sales_plans.plan_date', startDateTime.toISOString());
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(endDateTime.getHours() + 9);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('sales_plans.plan_date', endDateTime.toISOString());
    }

    const { data, error } = await query;
    
    console.log('DB 조회 결과:', data);
    console.log('DB 조회 에러:', error);

    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json([]);


    // reduce 함수에서 Map을 사용
    const groupedStats = data.reduce((acc: Record<string, Record<number, ICombinedSalesData>>, curr: any) => {
      const planDate = curr.sales_plans?.plan_date;
      
      if (!planDate) return acc;

      // KST로 변환
      const date = new Date(planDate);
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      const originalDate = kstDate.toISOString().split('T')[0];

      // 기간별 그룹화 키 생성
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

      console.log('데이터 그룹화:', {
        원본날짜: planDate,
        KST변환날짜: kstDate.toISOString(),
        그룹키: groupKey,
        표시날짜: originalDate,
      });

      if (!acc[groupKey]) {
        acc[groupKey] = {}
      }
      
      const planId = curr.sales_plans?.id;
      if (!acc[groupKey][planId]) {
        // 개별 상품 ID들을 배열로 변환
        acc[groupKey][planId] = {
          id: curr.id,
          sales_plan_id: curr.sales_plan_id,
          performance: curr.performance,
          achievement_rate: curr.achievement_rate,
          temperature: curr.temperature,
          xs_size: curr.xs_size,
          s_size: curr.s_size,
          m_size: curr.m_size,
          l_size: curr.l_size,
          xl_size: curr.xl_size,
          xxl_size: curr.xxl_size,
          fourxl_size: curr.fourxl_size,
          sales_plan: {
            id: curr.sales_plans.id,
            season: curr.sales_plans.season,
            plan_date: curr.sales_plans.plan_date,
            plan_time: curr.sales_plans.plan_time,
            channel_code: curr.sales_plans.channel_code,
            channel_detail: curr.sales_plans.channel_detail,
            product_category: curr.sales_plans.product_category,
            product_name: curr.sales_plans.product_name,
            product_summary: curr.sales_plans.product_summary,
            quantity_composition: curr.sales_plans.quantity_composition,
            set_id: curr.sales_plans.set_id,
            product_code: curr.sales_plans.product_code,
            sale_price: curr.sales_plans.sale_price,
            commission_rate: curr.sales_plans.commission_rate,
            target_quantity: curr.sales_plans.target_quantity,
            channel_id: curr.sales_plans.channel_id,
            set_product: {
              set_id: curr.sales_plans.set_products.set_id,
              set_name: curr.sales_plans.set_products.set_name,
              individual_product_ids: curr.sales_plans.set_products.individual_product_ids,
              remarks: curr.sales_plans.set_products.remarks,
              created_at: curr.sales_plans.set_products.created_at,
              updated_at: curr.sales_plans.set_products.updated_at,
              is_active: curr.sales_plans.set_products.is_active
            },
            sales_channels: {
              id: curr.sales_plans.sales_channels.id,
              channel_code: curr.sales_plans.sales_channels.channel_code,
              channel_detail: curr.sales_plans.sales_channels.channel_detail,
              channel_name: curr.sales_plans.sales_channels.channel_name,
              is_active: curr.sales_plans.sales_channels.is_active
            }
          }
        };
      }
      return acc;
    }, {});
    

// 각 그룹의 점유율 계산

const result = Object.entries(groupedStats).map(([date, planData]) => {
  const groupedProducts = Object.values(planData).map(plan => {
    // 사이즈별 수량 합계 계산
    const totalQuantity = (
      (plan.xs_size || 0) +
      (plan.s_size || 0) +
      (plan.m_size || 0) +
      (plan.l_size || 0) +
      (plan.xl_size || 0) +
      (plan.xxl_size || 0) +
      (plan.fourxl_size || 0)
    );

    return {
      product_name: plan.sales_plan.set_product.set_name,
      set_product_code: plan.sales_plan.set_product.set_id.toString(),
      channel: plan.sales_plan.sales_channels.channel_name,
      channel_detail: plan.sales_plan.channel_detail,
      category: plan.sales_plan.product_category,
      sales_amount: (plan.sales_plan.sale_price || 0) * totalQuantity,
      performance: totalQuantity,
      target: plan.sales_plan.target_quantity,
      achievement_rate: plan.achievement_rate,
      share: 0,
      temperature: plan.temperature || 0
    } as IProductStatistics;
  }).reduce((acc, curr) => {
    const key = `${curr.set_product_code}`;
    if (!acc[key]) {
      acc[key] = curr;
    } else {
      // 중복된 상품의 경우 수량과 금액을 합산
      acc[key].sales_amount += curr.sales_amount;
      acc[key].performance += curr.performance;
      acc[key].target += curr.target;
      // 달성률 재계산
      acc[key].achievement_rate = (acc[key].performance / acc[key].target) * 100;
      // 온도 평균 계산 (단순 평균)
      acc[key].temperature = (acc[key].temperature + curr.temperature) / 2;
    }
    return acc;
  }, {} as Record<string, IProductStatistics>);

  // 점유율 계산
  const products = Object.values(groupedProducts);
  const totalPerformance = products.reduce((sum, p) => sum + p.performance, 0);
  products.forEach(p => {
    p.share = totalPerformance > 0 ? (p.performance / totalPerformance) * 100 : 0;
  });

  return {
    [date]: products
  };
}).reduce((acc, curr) => ({ ...acc, ...curr }), {});
   // 날짜 기준 내림차순 정렬
  // result.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json(result);
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 