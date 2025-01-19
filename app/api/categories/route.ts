import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json(
      { error: '카테고리 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category_name } = body;

    if (!category_name || typeof category_name !== 'string' || category_name.trim() === '') {
      return NextResponse.json(
        { error: '카테고리명은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('product_categories')
      .insert([{ 
        category_name: category_name.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '카테고리 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 