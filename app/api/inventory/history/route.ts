import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '12');
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = searchParams.get('searchFields')?.split(',') || [];

    let query = supabase
      .from('inventory_history')
      .select('*', { count: 'exact' });

    // 검색어가 있는 경우 (콤마로 구분된 다중 검색어 처리)
    if (searchTerm && searchFields.length > 0) {
      const searchTerms = searchTerm.split(',').map(term => term.trim());
      const conditions = searchTerms.flatMap(term => 
        searchFields.map(field => `${field}.ilike.%${term}%`)
      );
      query = query.or(conditions.join(','));
    }

    // 페이지네이션 적용
    const { data, error, count } = await query
      .order('id', { ascending: true })
      .range(page * size, (page + 1) * size - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data?.map(item => ({
        product_code: item.product_code,
        item_number: item.item_number,
        product_name: item.product_name,
        specification: item.specification,
        total: item.total,
        warehouse_3333: item.warehouse_3333,
        warehouse_106: item.warehouse_106,
        warehouse_12345: item.warehouse_12345,
        updated_at: item.updated_at
      })) || [],
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / size) : 0,
      currentPage: page,
      hasMore: count ? (page + 1) * size < count : false
    });

  } catch (error) {
    console.error('재고 이력 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '재고 이력 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 