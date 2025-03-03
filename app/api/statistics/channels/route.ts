import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { IChannelStatistics } from '@/app/types/statistics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'monthly';

    let query = supabase
      .from('sales_performance')
      .select(`
        id,
        performance,
        xs_size,
        s_size,
        m_size,
        l_size,
        xl_size,
        xxl_size,
        fourxl_size,
        temperature,
        sales_plans!sales_performance_sales_plan_id_fkey (
          id,
          channel_id,
          channel_detail,
          plan_date,
          target_quantity,
          sales_channels!sales_plans_channel_id_fkey (
            id,
            channel_code,
            channel_name,
            channel_details
          )
        )
      `)
      .eq('is_active', true);

    if (startDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startDateTime.getHours() + 9);
      query = query.gte('sales_plans.plan_date', startDateTime.toISOString());
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(endDateTime.getHours() + 9);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('sales_plans.plan_date', endDateTime.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json([]);

    // 날짜별로 데이터 그룹화
    const groupedStats = data.reduce((acc: Record<string, Record<string, IChannelStatistics>>, curr: any) => {
      const planDate = curr.sales_plans?.plan_date;
      const channel = curr.sales_plans?.sales_channels;
      
      if (!planDate || !channel) return acc;

      // KST로 변환
      const date = new Date(planDate);
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      const originalDate = kstDate.toISOString().split('T')[0];

      // 기간별 그룹화 키 생성
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

      console.log('데이터 그룹화:', {
        원본날짜: planDate,
        KST변환날짜: kstDate.toISOString(),
        그룹키: groupKey,
        표시날짜: originalDate,
        채널: channel.channel_name,
        상세채널 : channel.channel_details,
        전환율 : curr.temperature
      });


      if (!acc[groupKey]) {
        acc[groupKey] = {};
      }

      const channelId = `${channel.id}-${curr.sales_plans?.channel_detail}`;
      if (!acc[groupKey][channelId]) {
        acc[groupKey][channelId] = {
          id: channelId.toString(),
          channel_name: channel.channel_name,
          channel_detail: curr.sales_plans?.channel_detail,
          quantity: 0,
          amount: 0,
          target_quantity: 0,
          performance: 0,
          achievement_rate: 0,
          share: 0,
          date: originalDate,
          temperature: 0,
          operation_count: 0
        };
      }



      const quantity = (
        (curr.xs_size || 0) +
        (curr.s_size || 0) +
        (curr.m_size || 0) +
        (curr.l_size || 0) +
        (curr.xl_size || 0) +
        (curr.xxl_size || 0) +
        (curr.fourxl_size || 0)
      );

      acc[groupKey][channelId].quantity += quantity;
      acc[groupKey][channelId].amount += curr.performance || 0;
      acc[groupKey][channelId].target_quantity += curr.sales_plans?.target_quantity || 0;
      acc[groupKey][channelId].performance += curr.performance || 0;
      acc[groupKey][channelId].achievement_rate = (acc[groupKey][channelId].performance / acc[groupKey][channelId].target_quantity) * 100;
      acc[groupKey][channelId].temperature += curr.temperature || 0 ;
      acc[groupKey][channelId].operation_count += 1;
      return acc;



    }, {});

    // 결과 로깅
    console.log('최종 그룹화 결과:', 
      Object.entries(groupedStats).map(([key, value]) => ({
        그룹키: key,
        채널수: Object.keys(value).length,
        날짜들: Object.values(value).map(v => v.date)
      }))
    );

    // 각 그룹의 점유율과 평균 전환율 계산
    const result = Object.entries(groupedStats).map(([date, channels]) => {
      const totalAmount = Object.values(channels).reduce((sum, stat) => sum + stat.amount, 0);
      
      const channelStats = Object.values(channels).map(stat => ({
        ...stat,
        share: totalAmount > 0 ? (stat.amount / totalAmount) * 100 : 0,
        temperature: stat.operation_count > 0 ? (stat.temperature / stat.operation_count) : 0, // 평균 전환율 계산
        date
      }));

      return {
        date,
        channels: channelStats
      };
    });

    // 날짜 기준 내림차순 정렬
    result.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '통계 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 