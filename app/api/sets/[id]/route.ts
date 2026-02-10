import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// 세트 삭제 (실제 삭제)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json(
        { error: '세트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('set_products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: '성공적으로 삭제되었습니다.' 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '세트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 세트 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  try {
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