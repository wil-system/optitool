import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 0;
    const size = Number(searchParams.get('size')) || 12;
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = searchParams.get('searchFields')?.split(',') || [];

    let query = supabase
      .from('set_products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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

    // is_active가 없는 경우 기본값 true로 설정
    const dataWithActive = data?.map(item => ({
      ...item,
      is_active: item.is_active ?? true
    }));

    return NextResponse.json({ 
      data: dataWithActive,
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / size) : 0,
      currentPage: page,
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
        { error: '비활성화할 세트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // set_products 테이블의 is_active를 false로 업데이트
    const { error: setError } = await supabase
      .from('set_products')
      .update({ is_active: false })
      .eq('id', id);

    if (setError) {
      console.error('Set update error:', setError);
      throw setError;
    }

    return NextResponse.json({ 
      message: '세트가 성공적으로 비활성화되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '세트 비활성화 중 오류가 발생했습니다.' },
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
      .eq('id', set.id);

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