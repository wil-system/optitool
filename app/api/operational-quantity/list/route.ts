import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('operational_quantities')
      .select(`
        id,
        set_id,
        set_name,
        xs_size,
        s_size,
        m_size,
        l_size,
        xl_size,
        xxl_size,
        fourxl_size,
        xs_size_percent,
        s_size_percent,
        m_size_percent,
        l_size_percent,
        xl_size_percent,
        xxl_size_percent,
        fourxl_size_percent,
        total_quantity,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('운영수량 목록 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '운영수량 목록 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 