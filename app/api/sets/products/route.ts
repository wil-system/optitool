import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productCodes = searchParams.get('codes')?.split(',') || [];

    if (productCodes.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('product_code', productCodes);

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '세트 상품 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 