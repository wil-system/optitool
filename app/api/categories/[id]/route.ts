import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json(
      { error: '카테고리 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 