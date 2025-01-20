import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.product_code || !body.product_name) {
      return NextResponse.json(
        { error: '필수 항목을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 기존 상품 확인
    const { data: existingProduct } = await supabase
      .from('products')
      .select()
      .eq('product_code', body.product_code)
      .single();

    let result;
    if (existingProduct) {
      // 상품이 존재하면 업데이트
      result = await supabase
        .from('products')
        .update(body)
        .eq('product_code', body.product_code)
        .select();
    } else {
      // 새로운 상품 등록
      result = await supabase
        .from('products')
        .insert([body])
        .select();
    }

    const { data, error } = result;
    if (error) throw error;

    return NextResponse.json({ 
      message: '상품이 성공적으로 저장되었습니다.',
      data 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '상품 등록 중 오류가 발생했습니다.' },
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
        { error: '삭제할 상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      message: '상품이 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '상품 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 0;
    const size = Number(searchParams.get('size')) || 12;  // 페이지당 12개 항목
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = searchParams.get('searchFields')?.split(',') || [];

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })  // 전체 개수를 가져오기 위해 count 옵션 추가
      .order('updated_at', { ascending: false });

    // 검색 조건 추가
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => {
        return `${field}.ilike.%${searchTerm}%`;
      });
      query = query.or(searchConditions.join(','));
    }

    // 페이지네이션 적용
    const { data, error, count } = await query
      .range(page * size, (page + 1) * size - 1);

    if (error) throw error;

    return NextResponse.json({ 
      data,
      totalCount: count || 0,  // 전체 항목 수
      totalPages: count ? Math.ceil(count / size) : 0,  // 전체 페이지 수
      currentPage: page,
      hasMore: count ? (page + 1) * size < count : false
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '상품 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 