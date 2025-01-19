import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    const { data, error } = await supabase
      .from('products')
      .update({
        product_code: body.product_code,
        item_number: body.item_number,
        product_name: body.product_name,
        specification: body.specification,
        purchase_price: body.purchase_price,
        selling_price: body.selling_price,
        barcode_info: body.barcode_info,
        barcode: body.barcode,
        tag_price: body.tag_price,
        remarks: body.remarks
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '상품 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 