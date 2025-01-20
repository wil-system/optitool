import { supabase } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '12');  // 페이지 사이즈 12로 통일
    const searchTerm = searchParams.get('searchTerm') || '';
    
    const now = new Date();
    const kstOffset = 9 * 60; // 한국 시간 오프셋 (9시간)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // UTC 시간
    const kstTime = new Date(utc + (kstOffset * 60 * 1000)); // 한국 시간으로 변환

    const today = kstTime.toISOString().split('T')[0];
    const currentTime = kstTime.toTimeString().split(' ')[0].slice(0, 5);

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
      `, { count: 'exact' })  // 전체 개수를 가져오기 위해 count 옵션 추가
      .eq('is_active', true)
      .or(`plan_date.gt.${today},and(plan_date.eq.${today},plan_time.gte.${currentTime})`);

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