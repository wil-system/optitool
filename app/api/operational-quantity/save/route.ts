import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      setId,
      setName,
      size_1,
      size_2,
      size_3,
      size_4,
      size_5,
      size_6,
      size_7,
      size_8,
      size_9,
      size_percent_1,
      size_percent_2,
      size_percent_3,
      size_percent_4,
      size_percent_5,
      size_percent_6,
      size_percent_7,
      size_percent_8,
      size_percent_9,
      totalQuantity
    } = body;

    const { data, error } = await supabase
      .from('operational_quantities')
      .insert({
        set_id: setId,
        set_name: setName,
        size_1: size_1 || null,
        size_2: size_2 || null,
        size_3: size_3 || null,
        size_4: size_4 || null,
        size_5: size_5 || null,
        size_6: size_6 || null,
        size_7: size_7 || null,
        size_8: size_8 || null,
        size_9: size_9 || null,
        size_percent_1: size_percent_1 || null,
        size_percent_2: size_percent_2 || null,
        size_percent_3: size_percent_3 || null,
        size_percent_4: size_percent_4 || null,
        size_percent_5: size_percent_5 || null,
        size_percent_6: size_percent_6 || null,
        size_percent_7: size_percent_7 || null,
        size_percent_8: size_percent_8 || null,
        size_percent_9: size_percent_9 || null,
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