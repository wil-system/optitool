import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'monthly';

    let query = supabase
      .from('sales_performance')
      .select(`
        sales_channels (
          id,
          channel_name
        ),
        quantity,
        amount,
        sale_date
      `)
      .eq('is_active', true);

    if (startDate) {
      query = query.gte('sale_date', startDate);
    }
    if (endDate) {
      query = query.lte('sale_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 채널별로 데이터 집계
    const statistics = data.reduce((acc: any, curr: any) => {
      const channelId = curr.sales_channels.id;
      if (!acc[channelId]) {
        acc[channelId] = {
          id: channelId,
          channel_name: curr.sales_channels.channel_name,
          quantity: 0,
          amount: 0
        };
      }
      acc[channelId].quantity += curr.quantity;
      acc[channelId].amount += curr.amount;
      return acc;
    }, {});

    // 전체 판매액 계산
    const totalAmount = Object.values(statistics).reduce((sum: number, stat: any) => sum + stat.amount, 0);

    // 점유율 계산
    const result = Object.values(statistics).map((stat: any) => ({
      ...stat,
      share: (stat.amount / totalAmount) * 100
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 