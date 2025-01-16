import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { IChannelDetailStatistics } from '@/app/types/statistics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  try {
    const { data, error } = await supabase
      .from('sales_performance')
      .select(`
        *,
        sales_plans!inner (
          plan_date,
          plan_time,
          channel_id,
          channel_code,
          channel_detail,
          product_category,
          product_name,
          sale_price,
          target_quantity,
          set_id,
          set_products!inner (
            set_id,
            set_name
          )
        )
      `)
      .eq('is_active', true)
      .eq('sales_plans.is_active', true)
      .eq('sales_plans.channel_id', channelId)

    if (error) {
      console.error('쿼리 오류:', error);
      return NextResponse.json(
        { error: '채널 상세 정보 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '해당 채널의 데이터가 없습니다.' },
        { status: 404 }
      );
    }

    const channelDetails: IChannelDetailStatistics[] = data.map((item) => ({
      date: item.sales_plans.plan_date,
      time: item.sales_plans.plan_time.slice(0, 5),
      channel_detail: item.sales_plans.channel_detail,
      category: item.sales_plans.product_category,
      product_name: item.sales_plans.product_name,
      set_id: item.sales_plans.set_id,
      set_product_code: item.sales_plans.set_products.set_id,
      target: item.sales_plans.target_quantity,
      performance: item.performance,
      sales_amount: item.sales_plans.sale_price,
      achievement_rate: Number(((item.performance / (item.sales_plans.target_quantity || 1)) * 100).toFixed(1))
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