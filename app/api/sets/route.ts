import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 0;
    const size = Number(searchParams.get('size')) || 100;
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = searchParams.get('searchFields')?.split(',') || [];

    let query = supabase
      .from('set_products')
      .select('set_id, set_name, individual_product_ids, remarks, created_at', { count: 'exact' })
      .order('set_id', { ascending: true });

    // 검색 조건 추가
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => {
        return `${field}.ilike.%${searchTerm}%`;
      });
      query = query.or(searchConditions.join(','));
    }

    const { data, error, count } = await query
      .range(page * size, (page + 1) * size - 1);

    if (error) throw error;

    return NextResponse.json({ 
      data,
      count,
      hasMore: count ? (page + 1) * size < count : false
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '세트 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '삭제할 세트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('set_products')
      .delete()
      .eq('set_id', id);

    if (error) throw error;

    return NextResponse.json({ 
      message: '세트가 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '세트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const set = await request.json();

    const { error } = await supabase
      .from('set_products')
      .update({
        set_name: set.set_name,
        individual_product_ids: set.individual_product_ids,
        remarks: set.remarks
      })
      .eq('set_id', set.set_id);

    if (error) throw error;

    return NextResponse.json({ 
      message: '세트가 성공적으로 수정되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '세트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 