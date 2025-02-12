import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const sessionId = searchParams.get('sessionId');

    if (!zone || !sessionId) {
      throw new Error('인증 정보가 없습니다.');
    }

     const apiUrl = `https://oapi${zone}.ecount.com/OAPI/V2/InventoryBasic/GetBasicProductsList`;
    // const apiUrl = `https://sboapi${zone}.ecount.com/OAPI/V2/InventoryBasic/GetBasicProductsList`;

	  const productResponse = await fetch(`${apiUrl}?SESSION_ID=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        PROD_TYPE: "3",
      }),
      
    });

    if (!productResponse.ok) {
      throw new Error('품목 데이터 조회에 실패했습니다.');
    }

    const response = await productResponse.json();
    
    if (response.Status !== '200') {
      throw new Error(response.Error?.Message || '품목 데이터 조회에 실패했습니다.');
    }

    // 데이터 변환 및 저장
    const products = response.Data.Result.map((item: any) => ({
      product_code: item.PROD_CD,
      product_name: item.PROD_DES,
      specification: item.SIZE_DES,
      barcode: item.BAR_CODE,
      purchase_price: parseFloat(item.PURCHASE_PRICE) || 0,
      selling_price: parseFloat(item.OUT_PRICE) || 0,
      updated_at: new Date().toISOString()
    }));

    // Supabase에 데이터 저장
    const { error } = await supabase
      .from('products')
      .upsert(products, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: `${products.length}건의 데이터가 처리되었습니다.`
    });

  } catch (error) {
    console.error('품목 데이터 처리 중 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '데이터 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 