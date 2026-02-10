import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: '연도와 월을 지정해주세요.' },
        { status: 400 }
      );
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('sales_plans_with_performance')
      .select('*')
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)
      .order('plan_date', { ascending: true })
      .order('plan_time', { ascending: true });

    if (error) {
      throw error;
    }

    const formattedData = (data || []).map((plan: any) => ({
      id: plan.id,
      plan_date: plan.plan_date,
      plan_time: plan.plan_time,
      channel_name: plan.channel_name || '',
      product_name: plan.product_name || '',
      additional_composition: plan.additional_composition || '',
      set_item_code: plan.set_item_code || '',
      target_quantity: plan.target_quantity || 0,
      sale_price: plan.sale_price || 0,
      commission_rate: plan.commission_rate || 0,
      season_year: plan.season_year || '',
      season: plan.season || '',
      total_order_quantity: plan.total_order_quantity || 0,
      net_order_quantity: plan.net_order_quantity || 0,
      total_sales: plan.total_sales || 0,
      net_sales: plan.net_sales || 0,
      achievement_rate: plan.achievement_rate || 0,
    }));

    return NextResponse.json({
      data: formattedData,
      metadata: {
        year,
        month,
        total: formattedData.length
      }
    });

  } catch (error) {
    console.error('판매계획 달력 데이터 조회 중 오류:', error);
    return NextResponse.json(
      { error: '판매계획 달력 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
