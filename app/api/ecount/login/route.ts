import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('로그인 프로세스 시작');
    const { zone } = await request.json();
    const ECOUNT_API_KEY = process.env.ECOUNT_API_KEY;
    const companyNo = process.env.NEXT_PUBLIC_ECOUNT_COMPANY_NO;

    if (!companyNo) {
      throw new Error('회사 정보가 설정되지 않았습니다.');
    }
	
    // const loginResponse = await fetch(`https://oapi${zone}.ecount.com/OAPI/V2/OAPILogin`, {
    const loginResponse = await fetch(`https://oapi${zone}.ecount.com/OAPI/V2/OAPILogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        COM_CODE: companyNo,
        USER_ID: 'lallafm',
        API_CERT_KEY: ECOUNT_API_KEY,
        LAN_TYPE: "ko-KR",
        ZONE: zone
      })
    });

    if (!loginResponse.ok) {
      throw new Error('로그인 요청에 실패했습니다.');
    }

    const loginResult = await loginResponse.json();
    if (loginResult.Status !== '200' || loginResult.Data.Code !== '00') {
      throw new Error('로그인에 실패했습니다: ' + loginResult.Data.Message);
    }

    return NextResponse.json({ 
      success: true, 
      data: { sessionId: loginResult.Data.Datas.SESSION_ID }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 