import { NextResponse } from 'next/server';

interface IEcountLoginRequestBody {
  zone?: string;
  Zone?: string;
  CompanyNo?: string;
  UserNo?: string;
}

export async function POST(request: Request) {
  const requestId = `ECOUNT_LOGIN_${Date.now()}`;

  try {
    console.log(`[${requestId}] 로그인 프로세스 시작`);

    const rawBody = (await request.json()) as IEcountLoginRequestBody;
    const zone = rawBody.zone ?? rawBody.Zone;

    const ECOUNT_API_KEY = process.env.ECOUNT_API_KEY;
    const companyNo = process.env.NEXT_PUBLIC_ECOUNT_COMPANY_NO;

    console.log(`[${requestId}] 요청 바디`, rawBody);
    console.log(`[${requestId}] 환경 변수 체크`, {
      hasApiKey: !!ECOUNT_API_KEY,
      companyNoExists: !!companyNo,
      zone,
    });

    if (!companyNo) {
      throw new Error('회사 정보가 설정되지 않았습니다. (NEXT_PUBLIC_ECOUNT_COMPANY_NO 미설정)');
    }

    if (!ECOUNT_API_KEY) {
      throw new Error('ECOUNT API 키가 설정되지 않았습니다. (ECOUNT_API_KEY 미설정)');
    }

    if (!zone) {
      throw new Error('존(Zone) 정보가 요청 바디에 없습니다. (zone 또는 Zone 필드 필요)');
    }

    const loginUrl = `https://oapi${zone}.ecount.com/OAPI/V2/OAPILogin`;
    const loginPayload = {
      COM_CODE: companyNo,
      USER_ID: 'lallafm',
      API_CERT_KEY: ECOUNT_API_KEY,
      LAN_TYPE: 'ko-KR',
      ZONE: zone,
    };

    console.log(`[${requestId}] 로그인 요청 URL`, loginUrl);
    console.log(`[${requestId}] 로그인 요청 페이로드`, {
      ...loginPayload,
      API_CERT_KEY: '***masked***',
    });

    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(loginPayload),
    });

    console.log(`[${requestId}] 로그인 응답 상태`, {
      ok: loginResponse.ok,
      status: loginResponse.status,
      statusText: loginResponse.statusText,
    });

    const responseText = await loginResponse.text();
    console.log(`[${requestId}] 로그인 응답 원문`, responseText);

    if (!loginResponse.ok) {
      throw new Error(`로그인 요청에 실패했습니다. status=${loginResponse.status}, statusText=${loginResponse.statusText}`);
    }

    let loginResult: any;
    try {
      loginResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[${requestId}] 로그인 응답 JSON 파싱 실패`, parseError);
      throw new Error('로그인 응답을 JSON으로 파싱하지 못했습니다.');
    }

    console.log(`[${requestId}] 로그인 응답 JSON`, loginResult);

    // Status, Code 타입이 숫자/문자열 혼합으로 올 수 있어 문자열로 통일
    const status = loginResult?.Status;
    const code = loginResult?.Data?.Code;
    const statusStr = status != null ? String(status) : '';
    const codeStr = code != null ? String(code) : '';
    const message = loginResult?.Data?.Message ?? loginResult?.Message ?? '메시지 없음';

    if (statusStr !== '200' || codeStr !== '00') {
      throw new Error(`로그인에 실패했습니다. status=${statusStr}, code=${codeStr}, message=${message}`);
    }

    const sessionId = loginResult?.Data?.Datas?.SESSION_ID;

    if (!sessionId) {
      throw new Error('로그인 응답에 SESSION_ID가 없습니다.');
    }

    console.log(`[${requestId}] 로그인 성공, SESSION_ID 획득`);

    return NextResponse.json({
      success: true,
      data: { sessionId },
      debug: process.env.NODE_ENV === 'development'
        ? {
            requestId,
            requestBody: rawBody,
            ecountStatus: statusStr,
            ecountCode: codeStr,
            ecountMessage: message,
          }
        : undefined,
    });
  } catch (error) {
    console.error(`[${requestId}] 로그인 처리 중 에러`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '로그인 중 알 수 없는 오류가 발생했습니다.',
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