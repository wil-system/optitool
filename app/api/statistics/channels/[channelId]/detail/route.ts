import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const period = searchParams.get('period');

  try {
    let query = supabase
      .from('sales_channels')
      .select(`
        channel_details,
        sales_plans!inner (
          id,
          season,
          product_category,
          product_name,
          product_code,
          set_id,
          sale_price,
          commission_rate,
          product_summary,
          plan_date
        )
      `)
      .eq('id', channelId);

    // 기간별 필터링
    if (date && period) {
      const targetDate = new Date(date);
      
      switch (period) {
        case 'daily':
          query = query.eq('sales_plans.plan_date', date);
          break;
        
        case 'monthly': {
          const year = targetDate.getFullYear();
          const month = targetDate.getMonth() + 1;
          
          const nextMonth = new Date(targetDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          
          query = query
            .gte('sales_plans.plan_date', `${year}-${month.toString().padStart(2, '0')}-01`)
            .lt('sales_plans.plan_date', `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}-01`);
          break;
        }
        
        case 'yearly': {
          const year = targetDate.getFullYear();
          query = query
            .gte('sales_plans.plan_date', `${year}-01-01`)
            .lt('sales_plans.plan_date', `${year + 1}-01-01`);
          break;
        }
      }
    }

    const { data, error } = await query.single();

    if (error) throw error;

    const channelDetails = data.sales_plans.map(plan => ({
      id: plan.id,
      channel_name: data.channel_details[0],
      season: plan.season,
      category: plan.product_category,
      product_code: plan.product_code,
      product_name: plan.product_name,
      set_code: plan.set_id,
      price: plan.sale_price,
      commission_rate: plan.commission_rate,
      note: plan.product_summary
    }));

    return NextResponse.json(channelDetails);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '채널 상세 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 