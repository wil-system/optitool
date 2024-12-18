import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { format } from 'date-fns';

export async function GET() {
  try {
    const now = new Date();
    const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today = format(kstNow, 'yyyy-MM-dd');
    const currentTime = format(kstNow, 'HH:mm:ss');

    // 판매계획 조회
    const { data, error } = await supabase
      .from('sales_plans')
      .select(`
        *,
        channel:sales_channels (
          channel_name
        )
      `)
      .or(
        `plan_date.gt.${today},` +
        `and(plan_date.eq.${today},plan_time.gt.${currentTime})`
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Query Error:', error);
      throw error;
    }

    console.log('Raw Data:', data?.[0]); // 원본 데이터 로깅

    const formattedData = data?.map(plan => ({
      ...plan,
      channel_name: plan.channel?.channel_name || ''
    })) || [];

    console.log('Formatted Data:', formattedData[0]); // 가공된 데이터 로깅

    return NextResponse.json({
      data: formattedData
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
  }
} 