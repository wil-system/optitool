import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data: plans, error, count } = await supabase
      .from('sales_plans')
      .select(`
        *,
        set_info:set_products(id, set_id, set_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: plans,
      metadata: {
        total: count || 0,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching sales plans:', error);
    return NextResponse.json(
      { error: '판매계획 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const { error } = await supabase
      .from('sales_plans')
      .insert([{ ...data,
         is_undecided: data.is_undecided || false
         }]);

    if (error) throw error;

    return NextResponse.json({ message: '판매계획이 등록되었습니다.' });
  } catch (error) {
    console.error('Error creating sales plan:', error);
    return NextResponse.json(
      { error: '판매계획 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 