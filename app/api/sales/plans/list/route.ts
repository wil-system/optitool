import { supabase } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '12');
    const searchTerm = searchParams.get('searchTerm') || '';
    
    const now = new Date();
    const kstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today = format(kstNow, 'yyyy-MM-dd');
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: 'Asia/Seoul' ,
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let query = supabase
      .from('sales_plans')
      .select(`
        *,
        channel:sales_channels(
          id,
          channel_code,
          channel_name,
          channel_details
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .or(`plan_date.gt.${today},and(plan_date.eq.${today},plan_time.gte.${currentTime}),is_undecided.eq.true`);

    const { data: plans, error, count } = await query;

    if (error) throw error;

    const setIds = plans?.map(plan => plan.set_id).filter(id => id != null);
    let setProducts: any[] = [];
    if (setIds.length > 0) {
      const { data: setData } = await supabase
        .from('set_products')
        .select('id, set_id , set_name')
        .in('id', setIds)
        .eq('is_active', true);
      setProducts = setData || [];
    }

    let filteredPlans = plans?.map(plan => {
      const setProduct = setProducts.find(set => set.id === plan.set_id);
      return {
        ...plan,
        set_info: setProduct ? {
          id: setProduct.id,
          set_id: setProduct.set_id,
          set_name: setProduct.set_name
        } : null
      };
    }) || [];

    if (searchTerm) {
      const searchValue = searchTerm.toLowerCase();
      filteredPlans = filteredPlans.filter(plan => {
        return (
          plan.season?.toLowerCase().includes(searchValue) ||
          plan.channel?.channel_name?.toLowerCase().includes(searchValue) ||
          plan.channel_detail?.toLowerCase().includes(searchValue) ||
          plan.product_category?.toLowerCase().includes(searchValue) ||
          plan.product_name?.toLowerCase().includes(searchValue) ||
          plan.set_info?.set_id?.toString().toLowerCase().includes(searchValue)
        );
      });
    }

    return NextResponse.json({
      data: filteredPlans,
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / size) : 0,
      currentPage: page,
      hasMore: count ? page * size < count : false
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const data = await request.json();
    
    const { error } = await supabase
      .from('sales_plans')
      .insert([{ 
        ...data, 
        is_active: true,
        is_undecided: data.is_undecided || false,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: '판매계획이 등록되었습니다.' 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '판매계획 등록 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 