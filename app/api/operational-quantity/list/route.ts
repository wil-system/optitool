import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

interface ISizeData {
  size: string;
  quantity: number;
  percent: number;
}

interface IOperationalQuantityDB {
  id: string;
  set_id: string;
  set_name: string;
  size_1: string | null;
  size_2: string | null;
  size_3: string | null;
  size_4: string | null;
  size_5: string | null;
  size_6: string | null;
  size_7: string | null;
  size_8: string | null;
  size_9: string | null;
  size_percent_1: number | null;
  size_percent_2: number | null;
  size_percent_3: number | null;
  size_percent_4: number | null;
  size_percent_5: number | null;
  size_percent_6: number | null;
  size_percent_7: number | null;
  size_percent_8: number | null;
  size_percent_9: number | null;
  total_quantity: number;
  created_at: string;
}

interface IOperationalQuantityResponse {
  id: string;
  set_id: string;
  set_name: string;
  sizes: ISizeData[];
  total_quantity: number;
  created_at: string;
}

const parseSizeData = (sizeString: string | null): { size: string; quantity: number } | null => {
  if (!sizeString) return null;
  const [size, quantityStr] = sizeString.split(':');
  return {
    size,
    quantity: parseInt(quantityStr, 10)
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '12', 10);
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchFields = searchParams.get('searchFields')?.split(',').filter(Boolean) || [];

    let query = supabase
      .from('operational_quantities')
      .select('*', { count: 'exact' })
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

    if (error) throw error;

    // 데이터 변환
    const transformedData: IOperationalQuantityResponse[] = (data as IOperationalQuantityDB[]).map(item => {
      const sizes: ISizeData[] = [];
      
      // size_1부터 size_9까지 순회하며 데이터 파싱
      for (let i = 1; i <= 9; i++) {
        const sizeKey = `size_${i}` as keyof IOperationalQuantityDB;
        const percentKey = `size_percent_${i}` as keyof IOperationalQuantityDB;
        
        const sizeData = parseSizeData(item[sizeKey] as string | null);
        if (sizeData) {
          sizes.push({
            size: sizeData.size,
            quantity: sizeData.quantity,
            percent: item[percentKey] as number || 0
          });
        }
      }

      // 사이즈 정렬
      sizes.sort((a, b) => {
        const cleanA = (a.size || '').toUpperCase().trim();
        const cleanB = (b.size || '').toUpperCase().trim();

        // 숫자 사이즈 처리 (예: 85, 90...) - "2XL" 같은 값은 숫자로 취급하면 안 됨
        const isNumA = /^\d+$/.test(cleanA);
        const isNumB = /^\d+$/.test(cleanB);
        const numA = isNumA ? parseInt(cleanA, 10) : NaN;
        const numB = isNumB ? parseInt(cleanB, 10) : NaN;
        if (isNumA && isNumB) return numA - numB;
        if (isNumA) return -1;
        if (isNumB) return 1;

        // FREE 사이즈 처리
        if (cleanA.includes('FREE')) return 1;
        if (cleanB.includes('FREE')) return -1;

        // 문자열 사이즈 처리 (XS~4XL)
        const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
        const getIndex = (s: string) => {
          if (s === '2XL') return order.indexOf('XXL'); // 2XL과 XXL을 동일하게 취급
          return order.indexOf(s);
        };
        const idxA = getIndex(cleanA);
        const idxB = getIndex(cleanB);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;

        return cleanA.localeCompare(cleanB);
      });

      return {
        id: item.id,
        set_id: item.set_id,
        set_name: item.set_name,
        sizes,
        total_quantity: item.total_quantity,
        created_at: item.created_at
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / size) : 0,
      currentPage: page,
      hasMore: count ? (page + 1) * size < count : false
    });
  } catch (error) {
    console.error('운영수량 목록 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '운영수량 목록 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 