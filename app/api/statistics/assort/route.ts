import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

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

    // 1. 기간별 그룹화
    const groupedByPeriod = data.reduce((acc: Record<string, any[]>, curr: any) => {
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
        case 'custom':
          groupKey = originalDate; 
          break;
        default: 
          groupKey = originalDate;
      }

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(curr);
      return acc;
    }, {});

    // 2. 각 기간 내에서 상품(set_item_code)별로 그룹화하여 합산
    const result = Object.entries(groupedByPeriod).reduce((acc, [date, items]: [string, any[]]) => {
      const productStats = items.reduce((prodAcc: Record<string, any>, curr: any) => {
        const itemCode = curr.set_item_code || 'unknown';
        
        if (!prodAcc[itemCode]) {
          prodAcc[itemCode] = {
            product_name: curr.product_name || '-',
            set_product_code: itemCode,
            operation_count: 1,
            size_85: Number(curr.size_85 || 0),
            size_90: Number(curr.size_90 || 0),
            size_95: Number(curr.size_95 || 0),
            size_100: Number(curr.size_100 || 0),
            size_105: Number(curr.size_105 || 0),
            size_110: Number(curr.size_110 || 0),
            size_115: Number(curr.size_115 || 0),
            size_120: Number(curr.size_120 || 0),
          };
        } else {
          prodAcc[itemCode].size_85 += Number(curr.size_85 || 0);
          prodAcc[itemCode].size_90 += Number(curr.size_90 || 0);
          prodAcc[itemCode].size_95 += Number(curr.size_95 || 0);
          prodAcc[itemCode].size_100 += Number(curr.size_100 || 0);
          prodAcc[itemCode].size_105 += Number(curr.size_105 || 0);
          prodAcc[itemCode].size_110 += Number(curr.size_110 || 0);
          prodAcc[itemCode].size_115 += Number(curr.size_115 || 0);
          prodAcc[itemCode].size_120 += Number(curr.size_120 || 0);
          prodAcc[itemCode].operation_count += 1;
        }
        return prodAcc;
      }, {});

      // 3. 합산된 데이터를 바탕으로 최종 아소트 비율 및 총수량 계산
      const products = Object.values(productStats).map((p: any) => {
        const totalQty = p.size_85 + p.size_90 + p.size_95 + p.size_100 + p.size_105 + p.size_110 + p.size_115 + p.size_120;
        
        return {
          product_name: p.product_name,
          set_product_code: p.set_product_code,
          operation_count: p.operation_count,
          total_qty: totalQty,
          size_85: p.size_85,
          size_90: p.size_90,
          size_95: p.size_95,
          size_100: p.size_100,
          size_105: p.size_105,
          size_110: p.size_110,
          size_115: p.size_115,
          size_120: p.size_120,
          assort_85: totalQty > 0 ? Number(((p.size_85 / totalQty) * 100).toFixed(1)) : 0,
          assort_90: totalQty > 0 ? Number(((p.size_90 / totalQty) * 100).toFixed(1)) : 0,
          assort_95: totalQty > 0 ? Number(((p.size_95 / totalQty) * 100).toFixed(1)) : 0,
          assort_100: totalQty > 0 ? Number(((p.size_100 / totalQty) * 100).toFixed(1)) : 0,
          assort_105: totalQty > 0 ? Number(((p.size_105 / totalQty) * 100).toFixed(1)) : 0,
          assort_110: totalQty > 0 ? Number(((p.size_110 / totalQty) * 100).toFixed(1)) : 0,
          assort_115: totalQty > 0 ? Number(((p.size_115 / totalQty) * 100).toFixed(1)) : 0,
          assort_120: totalQty > 0 ? Number(((p.size_120 / totalQty) * 100).toFixed(1)) : 0,
        };
      });

      acc[date] = products;
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json({ error: '통계 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
