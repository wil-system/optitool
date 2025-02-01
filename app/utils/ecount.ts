import { IEcountZone, IEcountLogin, IEcountLoginResponse, IEcountInventoryResponse } from '@/app/types/ecount';

const ECOUNT_API_URL = process.env.NEXT_PUBLIC_ECOUNT_API_URL;
const ECOUNT_API_KEY = process.env.ECOUNT_API_KEY;

// Zone 정보 조회
export async function fetchEcountZone(companyNo: string): Promise<IEcountZone> {
  try {
    const response = await fetch('/api/ecount/zone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        COM_CODE: companyNo
      })
    });

    if (!response.ok) {
      throw new Error('Zone 정보 조회 실패');
    }

    const data = await response.json();
    return data.Data;
  } catch (error) {
    console.error('Zone API 에러:', error);
    throw error;
  }
}

// 로그인 처리
export async function ecountLogin(credentials: IEcountLogin): Promise<IEcountLoginResponse> {
  try {
    const response = await fetch('/api/ecount/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error('로그인 실패');
    }

    const data = await response.json();
    
    // 세션 ID와 액세스 토큰 저장
    if (data.Status === '200') {
      localStorage.setItem('ecountSessionId', data.Data.Datas.SESSION_ID);
      localStorage.setItem('ecountAccessToken', data.Data.Datas.SET_COOKIE);
    }

    return data;
  } catch (error) {
    console.error('로그인 API 에러:', error);
    throw error;
  }
}

// 기존 fetchEcountInventory 함수 수정
export async function fetchEcountInventory(params?: {
  BASE_DATE?: string;
  WH_CD?: "106,3333,12345";
  PROD_CD?: string;
  BAL_FLAG?: 'Y' | 'N';
  DEL_GUBUN?: 'Y' | 'N';
  DEL_LOCATION_YN?: 'Y' | 'N';
}): Promise<IEcountInventoryResponse> {
  try {
    const sessionId = localStorage.getItem('ecountSessionId');
    const zone = localStorage.getItem('ecountZone');

    if (!sessionId || !zone) {
      throw new Error('로그인이 필요합니다.');
    }

    // 오늘 날짜를 YYYYMMDD 형식으로 변환
    const today = new Date();
    const baseDate = params?.BASE_DATE || today.toISOString().slice(0, 10).replace(/-/g, '');

    const response = await fetch(`/api/ecount/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BASE_DATE: baseDate,
        WH_CD: "106,3333,12345",
        PROD_CD: params?.PROD_CD || '',
        BAL_FLAG: params?.BAL_FLAG || 'N',
        DEL_GUBUN: params?.DEL_GUBUN || 'N',
        DEL_LOCATION_YN: params?.DEL_LOCATION_YN || 'N',
        sessionId,
        zone
      })
    });

    if (!response.ok) {
      throw new Error('재고 조회 실패');
    }

    const data = await response.json();
    
    if (data.Status !== '200' || data.Error) {
      throw new Error(data.Error?.Message || '재고 조회 중 오류가 발생했습니다.');
    }

    return data;
  } catch (error) {
    console.error('재고 조회 API 에러:', error);
    throw error;
  }
} 