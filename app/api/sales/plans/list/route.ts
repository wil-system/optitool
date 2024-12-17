import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const now = new Date();
    const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today = format(kstNow, 'yyyy-MM-dd');
    const currentTime = format(kstNow, 'HH:mm:ss');

    console.log('=== 시간 정보 ===');
    console.log(`🕒 KST DateTime: ${format(kstNow, 'yyyy-MM-dd HH:mm:ss')}`);
    console.log(`📅 Today: ${today}`);
    console.log(`⏰ Current Time: ${currentTime}`);
    console.log('================');

    let query = supabase
      .from('sales_plans')
      .select(`
        *,
        sales_channels!inner (
          channel_code,
          channel_name
        )
      `)
      .or(
        `plan_date.gt.${today},` +
        `and(plan_date.eq.${today},plan_time.gt.${currentTime})`
      )
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    const formattedData = data?.map(item => ({
      ...item,
      channel_name: item.sales_channels?.channel_name || ''
    })) || [];

    return NextResponse.json({
      data: formattedData
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
  }
} 