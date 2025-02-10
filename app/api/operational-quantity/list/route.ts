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
    const { data, error } = await supabase
      .from('operational_quantities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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
        // 숫자 사이즈 처리
        const numA = parseInt(a.size);
        const numB = parseInt(b.size);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        // FREE 사이즈 처리
        if (a.size.toUpperCase().includes('FREE')) return 1;
        if (b.size.toUpperCase().includes('FREE')) return -1;
        // 일반 문자열 사이즈 처리
        return a.size.localeCompare(b.size);
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
      data: transformedData
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