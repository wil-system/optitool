import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { IInventoryData } from '@/app/types/inventory';
import { IEcountInventoryItem, IEcountInventoryResponse } from '@/app/types/ecount';

export async function GET(request: Request) {
  try {
    console.log('재고 데이터 조회 프로세스 시작');

    const ECOUNT_API_BASE_URL = process.env.ECOUNT_API_URL;
    const ECOUNT_API_KEY = process.env.ECOUNT_API_KEY;
    const companyNo = process.env.NEXT_PUBLIC_ECOUNT_COMPANY_NO;

    if (!companyNo) {
      throw new Error('회사 정보가 설정되지 않았습니다.');
    }

    // Zone과 Session ID는 클라이언트에서 관리하도록 수정
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const sessionId = searchParams.get('sessionId');

    if (!zone || !sessionId) {
      throw new Error('인증 정보가 없습니다.');
    }

    // 재고 데이터 조회
    console.log('재고 데이터 조회 시작');
    const warehouseCodes = ["106", "3333", "12345"].join('∬');
    
    const apiUrl = `https://oapi${zone}.ecount.com/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatusByLocation`;

    const inventoryResponse = await fetch(`${apiUrl}?SESSION_ID=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        BASE_DATE: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        WH_CD: warehouseCodes,
        PROD_CD: "",
        BAL_FLAG: "N",
        DEL_GUBUN:"N",
        DEL_LOCATION_YN: "N"
      }),
    });

    if (!inventoryResponse.ok) {
      throw new Error('재고 데이터 조회에 실패했습니다.');
    }

    const response = await inventoryResponse.json() as IEcountInventoryResponse;
    
    // 품목코드별로 데이터 그룹화
    const groupedData = response.Data.Result.reduce((acc: { [key: string]: IInventoryData }, item: IEcountInventoryItem) => {
      const sizeMatch = item.PROD_SIZE_DES.match(/\[([^\]]+)\]$/);
      const specification = sizeMatch ? sizeMatch[1] : '';
      
      if (!acc[item.PROD_CD]) {
        acc[item.PROD_CD] = {
          product_code: item.PROD_CD,
          item_number: null,
          product_name: item.PROD_DES,
          specification: specification,
          total: 0,
          warehouse_106: 0,
          warehouse_3333: 0,
          warehouse_12345: 0
        };
      }
      
      const quantity = parseInt(item.BAL_QTY) || 0;
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
      }
      
      return acc;
    }, {});

    const transformedData: IInventoryData[] = Object.values(groupedData);

    // 4. Supabase에 데이터 저장 (supabase import 사용)
    console.log('Supabase 데이터 저장 시작');
    const { data, error } = await supabase
      .from('inventory_history')
      .upsert(
        transformedData.map(item => ({
          product_code: item.product_code,
          item_number: item.item_number,
          product_name: item.product_name,
          specification: item.specification,
          total: item.total,
          warehouse_106: item.warehouse_106,
          warehouse_3333: item.warehouse_3333,
          warehouse_12345: item.warehouse_12345,
          updated_at: new Date().toISOString()
        })),
        {
          onConflict: 'product_code',
          ignoreDuplicates: false
        }
      );

    if (error) {
      throw error;
    }

    console.log('전체 프로세스 완료');
    return NextResponse.json({ 
      success: true, 
      data: transformedData,
      message: `${transformedData.length}건의 데이터가 처리되었습니다.`
    });

  } catch (error) {
    console.error('처리 중 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '데이터 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 