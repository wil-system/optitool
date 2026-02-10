import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '12', 10);
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = searchParams.get('searchFields')?.split(',').filter(Boolean) || [];

    let query = supabase
      .from('set_products')
      .select(`
        id,
        set_id,
        set_name,
        individual_product_ids,
        remarks
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // 검색어가 있는 경우 (콤마로 구분된 다중 검색어 처리)
    if (searchTerm && searchFields.length > 0) {
      const searchTerms = searchTerm.split(',').map(term => term.trim()).filter(Boolean);
      const conditions = searchTerms.flatMap(term =>
        searchFields.map(field => `${field}.ilike.%${term}%`)
      );
      query = query.or(conditions.join(','));
    }

    // 페이지네이션 적용
    const { data, error, count } = await query.range(page * size, (page + 1) * size - 1);

    if (error) {
      console.error('Supabase 조회 에러:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / size) : 0,
        currentPage: page,
        hasMore: false
      });
    }

    // 데이터 변환 로직
    const transformedData = data.map(item => ({
      id: item.id,
      set_name: item.set_name,
      set_id: item.set_id,
      remark: item.remarks,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / size) : 0,
      currentPage: page,
      hasMore: count ? (page + 1) * size < count : false
    });

  } catch (error) {
    console.error('세트 상품 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세트 상품 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 