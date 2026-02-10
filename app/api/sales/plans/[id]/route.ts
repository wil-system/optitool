import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // 먼저 sales_plans 업데이트
    const { error: updateError } = await supabase
      .from('sales_plans')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 세트 정보 조회
    const { data: setInfo, error: setError } = await supabase
      .from('set_products')
      .select('id, set_id, set_name')
      .eq('id', data.set_id)
      .single();

    if (setError && setError.code !== 'PGRST116') throw setError;

    // 업데이트된 데이터 조회
    const { data: updatedData, error: selectError } = await supabase
      .from('sales_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (selectError) throw selectError;

    return NextResponse.json({ 
      success: true,
      message: '판매계획이 수정되었습니다.',
      data: {
        ...updatedData,
        set_info: setInfo
      }
    });
  } catch (error) {
    console.error('Error updating sales plan:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '판매계획 수정 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('sales_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: '판매계획이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Error deleting sales plan:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '판매계획 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 