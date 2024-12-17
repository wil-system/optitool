import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  const requestTime = new Date().toISOString();
  console.log(`[${requestTime}] 판매실적 목록 API 요청 시작`);

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '10');
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = (searchParams.get('searchFields') || '').split(',');

    let query = supabase
      .from('sales_performance')
      .select(`
        *,
        sales_plans!sales_performance_sales_plan_id_fkey (
          *,
          sales_channels!inner (
            channel_code,
            channel_name
          )
        )
      `)
      .not('sales_plan_id', 'is', null)
      .order('created_at', { ascending: false });

    // 검색 조건이 있는 경우
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => {
        return `${field}.ilike.%${searchTerm}%`;
      });
      query = query.or(searchConditions.join(','));
    }

    // 페이지네이션 적용
    const from = page * size;
    const to = from + size - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching data:', error);
      throw error;
    }

    const formattedData = data?.map(item => ({
      id: item.id,
      sales_plan_id: item.sales_plan_id,
      performance: Number(item.performance) || 0,
      achievement_rate: Number(item.achievement_rate) || 0,
      temperature: Number(item.temperature) || 0,
      xs85: Number(item.xs_size) || 0,
      s90: Number(item.s_size) || 0,
      m95: Number(item.m_size) || 0,
      l100: Number(item.l_size) || 0,
      xl105: Number(item.xl_size) || 0,
      xxl110: Number(item.xxl_size) || 0,
      xxxl120: Number(item.fourxl_size) || 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
      season: item.sales_plans?.season || '',
      plan_date: item.sales_plans?.plan_date || '',
      plan_time: item.sales_plans?.plan_time || '',
      channel_code: item.sales_plans?.channel_code || '',
      channel_name: item.sales_plans?.sales_channels?.channel_name || '',
      channel_detail: item.sales_plans?.channel_detail || '',
      product_category: item.sales_plans?.product_category || '',
      product_name: item.sales_plans?.product_name || '',
      set_id: item.sales_plans?.set_id || '',
      target_quantity: Number(item.sales_plans?.target_quantity) || 0
    })) || [];

    console.log('Formatted Data:', formattedData); // 데이터 확인용 로그

    return NextResponse.json({
      data: formattedData,
      count: count || 0
    });

  } catch (error) {
    console.error('❌ 판매실적 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '판매실적 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
} 