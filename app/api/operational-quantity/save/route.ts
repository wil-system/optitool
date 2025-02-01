import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      setId,
      setName,
      assortments,
      calculatedQuantities,
      totalQuantity
    } = body;

    const { data, error } = await supabase
      .from('operational_quantities')
      .insert({
        set_id: setId,
        set_name: setName,
        // 사이즈별 운영 가능 재고
        xs_size: calculatedQuantities.xs_size || 0,
        s_size: calculatedQuantities.s_size || 0,
        m_size: calculatedQuantities.m_size || 0,
        l_size: calculatedQuantities.l_size || 0,
        xl_size: calculatedQuantities.xl_size || 0,
        xxl_size: calculatedQuantities.xxl_size || 0,
        fourxl_size: calculatedQuantities.fourxl_size || 0,
        // 사이즈별 아소트 퍼센트
        xs_size_percent: assortments.xs_size || 0,
        s_size_percent: assortments.s_size || 0,
        m_size_percent: assortments.m_size || 0,
        l_size_percent: assortments.l_size || 0,
        xl_size_percent: assortments.xl_size || 0,
        xxl_size_percent: assortments.xxl_size || 0,
        fourxl_size_percent: assortments.fourxl_size || 0,
        // 총 수량
        total_quantity: totalQuantity
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('운영가능 수량 저장 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '운영가능 수량 저장 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 