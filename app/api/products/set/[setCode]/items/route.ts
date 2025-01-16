import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setCode: string }> }
) {
  try {
    const { setCode } = await params;
    
    // 1. 먼저 set_products에서 individual_product_ids 가져오기
    const { data: setData, error: setError } = await supabase
      .from('set_products')
      .select('individual_product_ids')
      .eq('id', setCode)
      .single();

    if (setError) throw setError;
    if (!setData?.individual_product_ids) return NextResponse.json([]);

    // 2. individual_product_ids를 배열로 변환
    const productCodes = setData.individual_product_ids
      .toString()
      .split(',')
      .map((code: string) => code.trim())
      .filter((code: string) => code.length > 0);

    // 3. products 테이블에서 해당 product_code에 매칭되는 상품 정보 조회
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        product_code,
        product_name
      `)
      .in('product_code', productCodes);

    if (productsError) throw productsError;

    return NextResponse.json(productsData || []);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '개별품목코드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 