import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Zone 정보 조회 프로세스 시작');
    const ECOUNT_API_BASE_URL = process.env.ECOUNT_API_URL;
    const ECOUNT_API_KEY = process.env.ECOUNT_API_KEY;
    const companyNo = process.env.NEXT_PUBLIC_ECOUNT_COMPANY_NO;

    if (!companyNo) {
      throw new Error('회사 정보가 설정되지 않았습니다.');
    }

    const zoneResponse = await fetch(`${ECOUNT_API_BASE_URL}/OAPI/V2/Zone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        COM_CODE: companyNo,
        API_CERT_KEY: ECOUNT_API_KEY
      })
    });

    if (!zoneResponse.ok) {
      throw new Error('Zone 정보 조회에 실패했습니다.');
    }

    const zoneInfo = await zoneResponse.json();
    if (!zoneInfo?.Data?.ZONE) {
      throw new Error('Zone 정보를 가져오는데 실패했습니다.');
    }

    return NextResponse.json({ 
      success: true, 
      data: { zone: zoneInfo.Data.ZONE }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Zone 정보 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 