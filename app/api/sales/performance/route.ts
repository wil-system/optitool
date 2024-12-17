import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { format, addHours } from 'date-fns';

export async function GET(request: Request) {
  const requestTime = new Date().toISOString();
  console.log(`[${requestTime}] API 요청 시작`);

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '100');
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = (searchParams.get('searchFields') || '').split(',');
    const dataType = searchParams.get('dataType') || 'sales';

    if (dataType === 'channels') {
      const { data: channelsData, error: channelsError } = await supabase
        .from('sales_channels')
        .select('*');

      if (channelsError) throw channelsError;
      return NextResponse.json(channelsData);
    }

    // sales_plans 데이터 요청 처리
    const now = new Date();
    const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today = format(kstNow, 'yyyy-MM-dd');
    const currentTime = format(kstNow, 'HH:mm:ss');

    let query = supabase
      .from('sales_plans')
      .select(`
        *,
        sales_performance!sales_performance_sales_plan_id_fkey (
          id
        )
      `, { count: 'exact' })
      .or(`plan_date.lt.${today},and(plan_date.eq.${today},plan_time.lt.${currentTime})`)
      .is('sales_performance!sales_performance_sales_plan_id_fkey.id', null);

    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => {
        return `${field}.ilike.%${searchTerm}%`;
      });
      query = query.or(searchConditions.join(','));
    }

    const from = page * size;
    const to = from + size - 1;
    
    query = query
      .order('plan_date', { ascending: false })
      .order('plan_time', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const formattedData = data?.map(item => ({
      ...item,
      plan_date: format(addHours(new Date(item.plan_date), 9), 'yyyy-MM-dd'),
      created_at: item.created_at ? format(addHours(new Date(item.created_at), 9), 'yyyy-MM-dd HH:mm:ss') : null,
      updated_at: item.updated_at ? format(addHours(new Date(item.updated_at), 9), 'yyyy-MM-dd HH:mm:ss') : null
    }));

    return NextResponse.json({
      data: formattedData,
      hasMore: count ? from + size < count : false,
      total: count
    });

  } catch (error) {
    console.error('❌ 데이터 조회 중 오류:', error);
    return NextResponse.json(
      { error: '데이터 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      salesPlanId,
      performance,
      achievementRate,
      temperature,
      xs85,
      s90,
      m95,
      l100,
      xl105,
      xxl110,
      xxxl120
    } = body;

    const { data, error } = await supabase
      .from('sales_performance')
      .insert({
        sales_plan_id: salesPlanId,
        performance,
        achievement_rate: achievementRate,
        temperature,
        xs_size: xs85,
        s_size: s90,
        m_size: m95,
        l_size: l100,
        xl_size: xl105,
        xxl_size: xxl110,
        fourxl_size: xxxl120,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: '실적이 성공적으로 등록되었습니다.',
      data 
    });

  } catch (error) {
    console.error('실적 등록 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, message: '실적 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 필요한 경우 PUT, DELETE 등의 ���서드도 추가할 수 있습니다. 