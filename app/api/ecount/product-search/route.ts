import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const sessionId = searchParams.get('sessionId');
    const prodCd = searchParams.get('prodCd') || '';

    if (!zone || !sessionId) {
      throw new Error('인증 정보가 없습니다.');
    }

    const apiUrl = `https://oapi${zone}.ecount.com/OAPI/V2/InventoryBasic/GetBasicProductsList?SESSION_ID=${sessionId}`;

    const productResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        PROD_TYPE: "3" 
      }),
    });

    if (!productResponse.ok) {
      throw new Error('ECOUNT API 호출 실패');
    }

    const response = await productResponse.json();
    
    if (response.Status !== '200') {
      throw new Error(response.Error?.Message || '데이터 조회 실패');
    }

    let resultData = response.Data.Result;
    if (typeof resultData === 'string') {
      resultData = JSON.parse(resultData);
    }

    // ECOUNT API 조회 결과 로그 출력
    console.log('ECOUNT API 조회 결과:', JSON.stringify(resultData, null, 2));

    // inventory_history 테이블에 업설트할 데이터 매핑
    const upsertData = resultData.map((item: any) => ({
      product_code: item.PROD_CD,
      product_name: item.PROD_DES,
      specification: item.SIZE_DES,
      sell_product_name: item.CONT3,        // 판매상품명
      muin_sell_product_name: item.CONT5,   // 무인-판매상품명
      item_number: item.CONT1,              // 품번
      barcode: item.BAR_CODE,               // 바코드
      distribution_code: item.CONT6,        // 유통코드
      tag_price: parseFloat(item.OUT_PRICE1) || 0, // 택가
      out_price: parseFloat(item.OUT_PRICE) || 0,  // 출고단가
      muin_price: parseFloat(item.OUT_PRICE3) || 0, // 무인매장가격
      is_set: item.SET_FLAG === '1',        // 세트여부 (1이면 true, 0이면 false)
      updated_at: new Date().toISOString()
    }));

    // Supabase 업설트 실행
    const { error: upsertError } = await supabase
      .from('inventory_history')
      .upsert(upsertData, {
        onConflict: 'product_code',
        ignoreDuplicates: false
      });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ 
      success: true, 
      data: resultData,
      message: `${upsertData.length}건의 데이터가 inventory_history에 업데이트되었습니다.`
    });

  } catch (error) {
    console.error('품목조회 및 업설트 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}