import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const { zone, sessionId } = await request.json();

    if (!zone || !sessionId) {
      throw new Error('인증 정보가 없습니다.');
    }

    // 1. 시간 제한 체크 (10분)
    const { data: syncData } = await supabase
      .from('sync_settings')
      .select('last_sync_at')
      .eq('key', 'ecount_product_sync')
      .single();

    if (syncData?.last_sync_at) {
      const lastSync = new Date(syncData.last_sync_at).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastSync) / (1000 * 60);

      if (diffMinutes < 10) {
        const nextAvailable = new Date(lastSync + 10 * 60 * 1000);
        const hours = nextAvailable.getHours().toString().padStart(2, '0');
        const minutes = nextAvailable.getMinutes().toString().padStart(2, '0');
        return NextResponse.json({
          success: false,
          error: `10분에 1회만 가능합니다. ${hours}시 ${minutes}분에 사용 가능합니다.`,
          nextAvailable: nextAvailable.toISOString()
        }, { status: 429 });
      }
    }

    // 2. ECOUNT API 호출
    console.log('[ECOUNT 동기화] API 호출 시작');
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
      console.error('[ECOUNT 동기화] API 응답 오류:', productResponse.status);
      throw new Error('ECOUNT API 호출 실패');
    }

    const response = await productResponse.json();
    if (response.Status !== '200') {
      console.error('[ECOUNT 동기화] API 비정상 응답:', response.Status, response.Error?.Message);
      throw new Error(response.Error?.Message || '데이터 조회 실패');
    }

    let resultData = response.Data.Result;
    if (typeof resultData === 'string') {
      resultData = JSON.parse(resultData);
    }

    console.log(`[ECOUNT 동기화] 데이터 수신 완료: ${resultData.length}건`);

    // 3. 데이터 매핑 (inventory_history 테이블 기준)
    console.log('[ECOUNT 동기화] 데이터 매핑 시작');
    const upsertData = resultData.map((item: any) => ({
      product_code: item.PROD_CD,
      product_name: item.PROD_DES,
      specification: item.SIZE_DES,
      item_number: item.CONT1,              // 품번
      barcode: item.BAR_CODE,               // 바코드
      tag_price: parseFloat(item.OUT_PRICE1) || 0, // 택가
      out_price: parseFloat(item.OUT_PRICE) || 0,  // 출고단가
      updated_at: new Date().toISOString()
    }));

    // 4. Supabase 업설트
    console.log(`[ECOUNT 동기화] DB 업설트 시작: ${upsertData.length}건`);
    const { error: upsertError } = await supabase
      .from('inventory_history')
      .upsert(upsertData, {
        onConflict: 'product_code',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('[ECOUNT 동기화] DB 업설트 오류:', upsertError);
      throw upsertError;
    }
    console.log('[ECOUNT 동기화] DB 업설트 완료');

    // 5. 동기화 시간 업데이트
    console.log('[ECOUNT 동기화] 동기화 시간 기록 시작');
    const nowIso = new Date().toISOString();
    await supabase
      .from('sync_settings')
      .upsert({ 
        key: 'ecount_product_sync', 
        last_sync_at: nowIso,
        updated_at: nowIso
      }, { onConflict: 'key' });
    console.log('[ECOUNT 동기화] 모든 프로세스 완료');

    return NextResponse.json({ 
      success: true, 
      message: `ECOUNT 상품 데이터가 동기화되었습니다.`,
      last_sync_at: nowIso
    });

  } catch (error) {
    console.error('ECOUNT 동기화 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '동기화 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
