import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '삭제할 판매실적 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('sales_performance')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: '판매실적이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '판매실적 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 