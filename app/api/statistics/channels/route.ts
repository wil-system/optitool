import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { IProductStatistics } from '@/app/types/statistics';

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

    // 그룹별 channel_name + product_name 기준 통계 계산
    const result = Object.entries(groupedStats).reduce((acc, [date, items]: [string, any[]]) => {
      const channelStats = items.reduce((chanAcc: Record<string, IProductStatistics>, curr: any) => {
        const channelName = curr.channel_name || 'unknown';
        const productName = curr.product_name || '-';
        const setProductCode = curr.set_item_code || '-';
        // 채널별로 묶되, 내부에서 상품별로 구분하기 위해 key에 상품 정보 포함
        const key = `${channelName}_${setProductCode}`;
        
        if (!chanAcc[key]) {
          chanAcc[key] = {
            product_name: productName,
            set_product_code: setProductCode,
            channel: channelName,
            channel_detail: curr.channel_detail || '-',
            category: curr.product_category || '-',
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
          chanAcc[key].sales_amount += Number(curr.net_sales || 0);
          chanAcc[key].total_sales += Number(curr.total_sales || 0);
          chanAcc[key].performance += Number(curr.net_order_quantity || 0);
          chanAcc[key].total_order += Number(curr.total_order_quantity || 0);
          chanAcc[key].target += Number(curr.target_quantity || 0);
          chanAcc[key].operation_count += 1;
          
          // 평균값 계산
          chanAcc[key].achievement_rate = (chanAcc[key].achievement_rate * (chanAcc[key].operation_count - 1) + Number(curr.achievement_rate || 0)) / chanAcc[key].operation_count;
          chanAcc[key].total_achievement_rate = (chanAcc[key].total_achievement_rate * (chanAcc[key].operation_count - 1) + Number(curr.total_achievement_rate || 0)) / chanAcc[key].operation_count;
          chanAcc[key].temperature = (chanAcc[key].temperature * (chanAcc[key].operation_count - 1) + Number(curr.pre_order_rate || 0)) / chanAcc[key].operation_count;
        }
        return chanAcc;
      }, {});

      // 점유율 계산 (해당 기간 내 채널 간 비중)
      const channels = Object.values(channelStats);
      const totalPerformance = channels.reduce((sum, p) => sum + p.performance, 0);
      channels.forEach(p => {
        p.share = totalPerformance > 0 ? (p.performance / totalPerformance) * 100 : 0;
      });

      acc[date] = channels;
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
