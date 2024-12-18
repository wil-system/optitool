import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { set_id, set_name, individual_product_ids, remarks } = body;

 
    // DB에 저장
    const { data, error } = await supabase
      .from('set_products')
      .insert([{
        set_id,
        set_name,
        individual_product_ids,
        remarks,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in set products API:', error);
    return NextResponse.json(
      { error: '세트상품 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 