import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setCode: string }> }
) {
  try {
    const { setCode } = await params;
    
    const { data, error } = await supabase
      .from('set_products')
      .select('individual_product_ids')
      .eq('set_id', setCode)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json([]);

    const productIds = data.individual_product_ids?.split(',')
      ?.map((id: string) => id.trim()) || [];

    return NextResponse.json(productIds);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '개별품목코드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 