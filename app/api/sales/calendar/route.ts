import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

interface ISalesCalendarResponse {
  id: string;
  plan_date: string;
  plan_time: string;
  channel_detail: string;
  product_name: string;
  product_category: string;
  target_quantity: number;
  quantity_composition: string;
  sale_price: number;
  commission_rate: number;

  sales_channels?: {
    channel_name: string;
  };
  set_products?: {
    set_name: string;
  };
}

interface IFormattedSalesPlan {
  id: string;
  plan_date: string;
  plan_time: string;
  channel_name: string;
  channel_detail: string;
  product_name: string;
  product_category: string;
  target_quantity: number;
  quantity_composition: string;
  sale_price: number;
  commission_rate: number;
  set_name: string;

}

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
      .from('sales_plans')
      .select(`
        id,
        plan_date,
        plan_time,
        channel_detail,
        product_name,
        product_category,
        target_quantity,
        quantity_composition,
        sale_price,
        commission_rate,
        sales_channels (
          channel_name
        ),

        set_products (
          set_name
        )
      `)
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    const formattedData = (data as unknown as ISalesCalendarResponse[]).map((plan): IFormattedSalesPlan => ({
      id: plan.id,
      plan_date: plan.plan_date,
      plan_time: plan.plan_time,
      channel_name: plan.sales_channels?.channel_name || '',
      channel_detail: plan.channel_detail,
      product_name: plan.product_name,
      product_category: plan.product_category,
      target_quantity: plan.target_quantity,
      quantity_composition: plan.quantity_composition,
      sale_price: plan.sale_price,

      commission_rate: plan.commission_rate,
      set_name: plan.set_products?.set_name || ''
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