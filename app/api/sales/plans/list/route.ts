import { supabase } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const searchTerm = searchParams.get('searchTerm') || '';
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

    const { data: plans, error } = await supabase
      .from('sales_plans')
      .select(`
        *,
        channel:sales_channels(
          id,
          channel_code,
          channel_name,
          channel_details
        )
      `)
      .eq('is_active', true)
      .or(`plan_date.gt.${today},and(plan_date.eq.${today},plan_time.gte.${currentTime})`);

    if (error) throw error;

    const setIds = plans?.map(plan => plan.set_id).filter(id => id != null);
    let setProducts: any[] = [];
    if (setIds.length > 0) {
      const { data: setData } = await supabase
        .from('set_products')
        .select('id, set_id')
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

    const limit = 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlans = filteredPlans.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedPlans,
      totalPages: Math.ceil(filteredPlans.length / limit),
      currentPage: page
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