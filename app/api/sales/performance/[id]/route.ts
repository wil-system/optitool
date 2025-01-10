import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('sales_plans')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: '판매실적이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Error deleting sales performance:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '판매실적 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 