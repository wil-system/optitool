import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const searchTerm = searchParams.get('searchTerm') || '';
    const channelId = searchParams.get('channelId') || null;
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;

    // 서울 시간대 기준 현재 날짜와 시간
    const seoulDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
    const now = new Date(seoulDate);

    console.log('서울 현재 시간:', seoulDate);
    console.log('현재 날짜:', now.toISOString().split('T')[0]);
    console.log('현재 시간:', now.toTimeString().slice(0, 5));

    let query = supabase
      .from('sales_plans')
      .select(`
        *,
        channel:sales_channels (
          channel_name
        )
      `, { count: 'exact' })
      .or(
        `plan_date.gt.${now.toISOString().split('T')[0]},and(plan_date.eq.${now.toISOString().split('T')[0]},plan_time.gte.${now.toTimeString().slice(0, 5)})`
      )
      .order('plan_date', { ascending: true })
      .order('plan_time', { ascending: true });

    // 검색어 필터링
    if (searchTerm) {
      query = query.ilike('set_name', `%${searchTerm}%`);
    }

    // 채널 필터링
    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    // 날짜 범위 필터링
    if (startDate) {
      query = query.gte('plan_date', startDate);
    }
    if (endDate) {
      query = query.lte('plan_date', endDate);
    }

    // 페이지네이션 적용
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    console.log('조회된 데이터:', data);
    console.log('에러:', error);
    console.log('총 개수:', count);

    if (error) {
      throw error;
    }

    // 채널 목록 조회
    const { data: channels } = await supabase
      .from('sales_channels')
      .select('*')
      .order('channel_name');

    return NextResponse.json({
      data: data || [],
      channels: channels || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / pageSize)
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 