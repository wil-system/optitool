import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('set_products')
      .select(`
        id,
        set_id,
        set_name,
        individual_product_ids,
        remarks,
        is_active
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Supabase 조회 에러:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // 데이터 변환 로직
    const transformedData = data.map(item => ({
      id: item.id,
      set_name: item.set_name,
      set_id: item.set_id,
      remark: item.remarks,
    }));

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('세트 상품 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세트 상품 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 