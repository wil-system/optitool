import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function DELETE(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    const id = pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: '삭제할 카테고리 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: '카테고리가 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '카테고리 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 