import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// 세트 삭제 (비활성화)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: '세트 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    // set_products 테이블의 is_active를 false로 업데이트
    const { error } = await supabase
      .from('set_products')
      .update({ is_active: false })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      message: '성공적으로 비활성화되었습니다.' 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '세트 비활성화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 세트 수정
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const data = await request.json();

    const { error } = await supabase
      .from('set_products')
      .update({
        set_id: data.set_id,
        set_name: data.set_name,
        individual_product_ids: data.individual_product_ids,
        remarks: data.remarks
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: '성공적으로 수정되었습니다.' 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '세트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 