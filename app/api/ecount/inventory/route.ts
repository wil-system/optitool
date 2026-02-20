import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { IInventoryData } from '@/app/types/inventory';
import { IEcountInventoryItem, IEcountInventoryResponse } from '@/app/types/ecount';

export async function GET(request: Request) {
  const requestId = `ECOUNT_INVENTORY_${Date.now()}`;

  try {
    console.log(`[${requestId}] 재고 데이터 조회 프로세스 시작`);

    const ECOUNT_API_BASE_URL = process.env.ECOUNT_API_URL;
    const ECOUNT_API_KEY = process.env.ECOUNT_API_KEY;
    const companyNo = process.env.NEXT_PUBLIC_ECOUNT_COMPANY_NO;

    console.log(`[${requestId}] 환경 변수 체크`, {
      hasBaseUrl: !!ECOUNT_API_BASE_URL,
      hasApiKey: !!ECOUNT_API_KEY,
      companyNoExists: !!companyNo,
    });

    if (!companyNo) {
      throw new Error('회사 정보가 설정되지 않았습니다. (NEXT_PUBLIC_ECOUNT_COMPANY_NO 미설정)');
    }

    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const sessionId = searchParams.get('sessionId');
    const debug = searchParams.get('debug') === 'true';

    console.log(`[${requestId}] 요청 파라미터`, { zone, sessionId, debug });

    if (!zone || !sessionId) {
      throw new Error('인증 정보가 없습니다. (zone 또는 sessionId 누락)');
    }

    console.log(`[${requestId}] 재고 데이터 조회 시작`);
    const warehouseCodes = ['106', '3333', '12345'].join('∬');

    const apiUrl = `https://oapi${zone}.ecount.com/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatusByLocation`;
    const payload = {
      BASE_DATE: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      WH_CD: warehouseCodes,
      PROD_CD: '',
      BAL_FLAG: 'N',
      DEL_GUBUN: 'N',
      DEL_LOCATION_YN: 'N',
    };

    console.log(`[${requestId}] ECOUNT 재고 조회 URL`, apiUrl);
    console.log(`[${requestId}] ECOUNT 재고 조회 페이로드`, payload);

    const inventoryResponse = await fetch(`${apiUrl}?SESSION_ID=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[${requestId}] ECOUNT 재고 응답 상태`, {
      ok: inventoryResponse.ok,
      status: inventoryResponse.status,
      statusText: inventoryResponse.statusText,
    });

    const responseText = await inventoryResponse.text();
    console.log(`[${requestId}] ECOUNT 재고 응답 원문`, responseText);

    if (!inventoryResponse.ok) {
      throw new Error(
        `재고 데이터 조회에 실패했습니다. status=${inventoryResponse.status}, statusText=${inventoryResponse.statusText}`,
      );
    }

    let response: IEcountInventoryResponse;
    try {
      response = JSON.parse(responseText) as IEcountInventoryResponse;
    } catch (parseError) {
      console.error(`[${requestId}] 재고 응답 JSON 파싱 실패`, parseError);
      throw new Error('재고 응답을 JSON으로 파싱하지 못했습니다.');
    }

    console.log(`[${requestId}] 재고 응답 JSON`, {
      Status: response.Status,
      Data: {
        Code: response.Data?.Code,
        Message: response.Data?.Message,
        ResultLength: response.Data?.Result?.length,
      },
    });

    // Status, Code 가 숫자/문자열 혼합으로 올 수 있으므로 문자열로 통일해서 비교
    const invStatus = response.Status;
    const invCode = response.Data?.Code;
    const invStatusStr = invStatus != null ? String(invStatus) : '';
    const invCodeStr = invCode != null ? String(invCode) : '';

    if (invStatusStr !== '200') {
      throw new Error(
        `재고 조회 코드 에러. status=${invStatusStr}, code=${invCodeStr}, message=${response.Data?.Message}`,
      );
    }

    const groupedData = response.Data.Result.reduce(
      (acc: { [key: string]: IInventoryData }, item: IEcountInventoryItem) => {
        const sizeMatch = item.PROD_SIZE_DES.match(/\[([^\]]+)\]$/);
        const specification = sizeMatch ? sizeMatch[1] : '';

        if (!acc[item.PROD_CD]) {
          acc[item.PROD_CD] = {
            product_code: item.PROD_CD,
            item_number: null, // item_number 필드 추가
            product_name: item.PROD_DES,
            specification,
            total: 0,
            warehouse_106: 0,
            warehouse_3333: 0,
            warehouse_12345: 0,
          };
        }

        const quantity = parseInt(item.BAL_QTY, 10) || 0;
        acc[item.PROD_CD].total += quantity;

        switch (item.WH_CD) {
          case '106':
            acc[item.PROD_CD].warehouse_106 = quantity;
            break;
          case '3333':
            acc[item.PROD_CD].warehouse_3333 = quantity;
            break;
          case '12345':
            acc[item.PROD_CD].warehouse_12345 = quantity;
            break;
          default:
            break;
        }

        return acc;
      },
      {},
    );

    const transformedData: IInventoryData[] = Object.values(groupedData);

    console.log(`[${requestId}] Supabase 데이터 저장 시작`, {
      rowCount: transformedData.length,
    });

    // 1. DB에 이미 존재하는 상품 전체 정보 조회 (Not-Null 제약 조건 해결 및 기존 데이터 보존용)
    const { data: existingProducts, error: selectError } = await supabase
      .from('inventory_history')
      .select('*');

    if (selectError) {
      console.error(`[${requestId}] DB 상품 조회 에러`, selectError);
      throw selectError;
    }

    // 빠른 조회를 위해 Map 생성
    const existingMap = new Map(existingProducts?.map((p) => [p.product_code, p]) || []);

    // 2. 존재하는 상품에 대해서만 재고 수량 업데이트 데이터 병합
    const updateData = transformedData
      .filter((item) => existingMap.has(item.product_code))
      .map((item) => {
        const existing = existingMap.get(item.product_code);
        return {
          ...existing, // 기존 모든 컬럼(상품명, 규격, 바코드 등) 유지
          total: item.total,
          warehouse_106: item.warehouse_106,
          warehouse_3333: item.warehouse_3333,
          warehouse_12345: item.warehouse_12345,
          updated_at: new Date().toISOString(),
        };
      });

    console.log(`[${requestId}] 필터링 결과`, {
      originalCount: transformedData.length,
      updateCount: updateData.length,
      ignoredCount: transformedData.length - updateData.length,
    });

    let finalData: any[] | null = null;
    let finalError: any = null;

    // 3. 필터링된 데이터가 있는 경우에만 업데이트 수행
    if (updateData.length > 0) {
      const { data: upsertData, error: upsertError } = await supabase
        .from('inventory_history')
        .upsert(updateData, {
          onConflict: 'product_code',
          ignoreDuplicates: false,
        });

      finalData = upsertData;
      finalError = upsertError;

      if (upsertError) {
        console.error(`[${requestId}] Supabase update 에러`, upsertError);
        throw upsertError;
      }
    }

    if (finalError) {
      console.error(`[${requestId}] Supabase upsert 에러`, finalError);
      throw finalError;
    }

    console.log(`[${requestId}] 전체 프로세스 완료`);
    return NextResponse.json({
      success: true,
      data: transformedData,
      message: `${transformedData.length}건의 데이터가 처리되었습니다.`,
      debug: debug
        ? {
          requestId,
          ecountStatus: invStatusStr,
          ecountCode: invCodeStr,
          ecountMessage: response.Data?.Message,
        }
        : undefined,
    });
  } catch (error) {
    console.error(`[${requestId}] 처리 중 에러`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '데이터 처리 중 오류가 발생했습니다.',
        debug: process.env.NODE_ENV === 'development'
          ? {
            requestId,
          }
          : undefined,
      },
      { status: 500 },
    );
  }
}