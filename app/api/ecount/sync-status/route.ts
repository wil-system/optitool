import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// sync_settings 테이블이 없다고 가정하고, 
// public.sync_settings 테이블을 사용하여 마지막 동기화 시간을 관리합니다.
// 만약 테이블이 없다면, 에러가 발생할 것이므로 
// 우선은 inventory_history 테이블의 가장 최근 updated_at을 기준으로 할 수도 있지만,
// "전체 사용자"에게 공유되어야 하므로 별도의 상태 저장소가 필요합니다.
// 여기서는 'sync_settings' 테이블을 사용한다고 가정하고 구현합니다.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'ecount_product_sync';

    const { data, error } = await supabase
      .from('sync_settings')
      .select('last_sync_at')
      .eq('key', type)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 결과 없음
      throw error;
    }

    return NextResponse.json({
      success: true,
      last_sync_at: data?.last_sync_at || null
    });
  } catch (error) {
    console.error('동기화 상태 조회 에러:', error);
    return NextResponse.json({ success: false, error: '상태 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const type = searchParams.get('type') || 'ecount_product_sync';

    if (action === 'update') {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('sync_settings')
        .upsert({ 
          key: type, 
          last_sync_at: now,
          updated_at: now
        }, { onConflict: 'key' });

      if (error) throw error;
      return NextResponse.json({ success: true, last_sync_at: now });
    }

    return NextResponse.json({ success: false, error: '잘못된 요청' }, { status: 400 });
  } catch (error) {
    console.error('동기화 상태 업데이트 에러:', error);
    return NextResponse.json({ success: false, error: '상태 업데이트 실패' }, { status: 500 });
  }
}
