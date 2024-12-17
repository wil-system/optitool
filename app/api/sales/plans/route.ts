import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { format } from 'date-fns';

export async function GET() {
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

    const { data, error } = await supabase
      .from('sales_plans')
      .select('*')
      .or(`plan_date.gt.${today},and(plan_date.eq.${today},plan_time.gte.${currentTime})`)
      .order('plan_date', { ascending: true })
      .order('plan_time', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    console.log('Received date:', body.plan_date); // 디버그용

    const { data, error } = await supabase
      .from('sales_plans')
      .insert({
        ...body,
        created_at: currentDate,
        updated_at: currentDate
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '데이터 저장 실패' }, { status: 500 });
  }
} 