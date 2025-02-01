import { useState } from 'react';
import { ecountLogin, fetchEcountZone } from '@/app/utils/ecount';
import { IEcountLogin, IEcountZone } from '@/app/types/ecount';

export function useEcountAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoneInfo, setZoneInfo] = useState<IEcountZone | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const initializeZone = async (companyNo: string) => {
    try {
      setLoading(true);

      if (!companyNo) {
        throw new Error('회사번호가 필요합니다.');
      }

      const response = await fetch('/api/ecount/zone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyNo })
      });

      const data = await response.json();
      console.log('Zone API 응답:', data);

      if (!response.ok || !data.ZONE) {
        throw new Error(data.error || 'Zone 정보 조회에 실패했습니다.');
      }

      setZoneInfo(data);
      return data;
    } catch (err) {
      console.error('Zone 조회 에러:', err);
      setError(err instanceof Error ? err.message : 'Zone 정보 조회 실패');
      throw err;
    } finally {
    }
  };

  const login = async (credentials: IEcountLogin) => {
    try {
      setLoading(true);
      setError(null);
      console.log('로그인 시도:', credentials);
      
      const loginResult = await ecountLogin(credentials);
      console.log('로그인 응답:', loginResult);
      
      if (!loginResult?.Data?.Datas.SESSION_ID || !loginResult?.Data?.Datas.SET_COOKIE) {
        throw new Error('유효하지 않은 로그인 응답');
      }
      
      setIsAuthenticated(true);
      return loginResult;
    } catch (err) {
      console.error('로그인 에러:', err);
      setError(err instanceof Error ? err.message : '로그인 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    initializeZone,
    loading,
    error,
    setError,
    zoneInfo,
    isAuthenticated,
    setIsAuthenticated
  };
} 