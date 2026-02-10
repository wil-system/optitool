import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('size');
    const page = pageParam ? Number(pageParam) || 0 : 0;
    const size = sizeParam ? Number(sizeParam) || 12 : null;
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = searchParams.get('searchFields')?.split(',') || [];

    let query = supabase
      .from('set_products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 검색 조건 추가
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => {
        return `${field}.ilike.%${searchTerm}%`;
      });
      query = query.or(searchConditions.join(','));
    }

    const { data, error, count } = size 
      ? await query.range(page * size, (page + 1) * size - 1)
      : await query;

    if (error) throw error;

    // 개별 상품 정보 조회를 위한 item_number 수집
    const allItemNumbers = new Set<string>();
    data?.forEach(set => {
      set.individual_product_ids?.forEach((idStr: string) => {
        const [itemNumber] = idStr.split('#');
        allItemNumbers.add(itemNumber);
      });
    });

    // inventory_history에서 상품명 조회
    const { data: productsData } = await supabase
      .from('inventory_history')
      .select('item_number, product_name')
      .in('item_number', Array.from(allItemNumbers));

    const productMap = new Map(productsData?.map(p => [p.item_number, p.product_name]));

    const dataWithNames = data?.map(item => ({
      ...item,
      individual_products_with_names: item.individual_product_ids?.map((idStr: string) => {
        const [itemNumber, customName] = idStr.split('#');
        return {
          item_number: itemNumber,
          product_name: customName || productMap.get(itemNumber) || '정보 없음'
        };
      })
    }));

    if (size) {
      return NextResponse.json({ 
        data: dataWithNames,
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / size) : 0,
        currentPage: page,
        hasMore: count ? (page + 1) * size < count : false
      });
    } else {
      return NextResponse.json({ 
        data: dataWithNames
      });
    }
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

    // set_products 테이블에서 데이터 실제 삭제
    const { error: setError } = await supabase
      .from('set_products')
      .delete()
      .eq('id', id);

    if (setError) {
      console.error('Set delete error:', setError);
      throw setError;
    }

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