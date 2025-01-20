import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 0;
    const pageSize = 12;
    
    const now = new Date();
    const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today = format(kstNow, 'yyyy-MM-dd');
    const currentTime = format(kstNow, 'HH:mm:ss');

    // 실적이 등록된 sales_plan_id 목록 조회
    const { data: performanceData } = await supabase
      .from('sales_performance')
      .select('sales_plan_id')
      .eq('is_active', true);

    const registeredPlanIds = performanceData?.map(item => item.sales_plan_id) || [];

    // 판매계획 조회
    const { data: salesPlans, error: salesError, count } = await supabase
      .from('sales_plans')
      .select(`
        *,
        channel:sales_channels(channel_name)
      `, { count: 'exact' })
      .or(
        `plan_date.lt.${today},` +
        `and(plan_date.eq.${today},plan_time.lt.${currentTime})`
      )
      .eq('is_active', true)
      .not('id', 'in', `(${registeredPlanIds.join(',')})`)
      .order('plan_date', { ascending: false })
      .order('plan_time', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (salesError) throw salesError;

    // 세트 정보 별도 조회
    const setIds = salesPlans?.map(plan => plan.set_id).filter(id => id != null) || [];
    let setProducts: { id: number; set_id: string; set_name: string; }[] = [];
    
    if (setIds.length > 0) {
      const { data: setData } = await supabase
        .from('set_products')
        .select('id, set_id, set_name')
        .in('id', setIds)  // sales_plans의 set_id는 set_products의 id를 참조
        .eq('is_active', true);
      setProducts = setData || [];
    }

    // 데이터 포맷팅
    const formattedData = salesPlans?.map(plan => {
      const setProduct = setProducts.find(set => set.id === plan.set_id);
      return {
        ...plan,
        channel_name: plan.channel?.channel_name || '',
        set_info: setProduct ? {
          id: setProduct.id,
          set_id: setProduct.set_id,
          set_name: setProduct.set_name
        } : null
      };
    }) || [];

    return NextResponse.json({
      data: formattedData,
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
      currentPage: page,
      hasMore: count ? (page + 1) * pageSize < count : false
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
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
 