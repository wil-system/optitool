import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'monthly';

    let query = supabase
      .from('sales_performance')
      .select(`
        xs_size,
        s_size,
        m_size,
        l_size,
        xl_size,
        xxl_size,
        fourxl_size,
        sale_date
      `)
      .eq('is_active', true);

    if (startDate) {
      query = query.gte('sale_date', startDate);
    }
    if (endDate) {
      query = query.lte('sale_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 전체 판매량 계산
    const totalQuantity = data.reduce((sum, item) => {
      return sum + 
        (Number(item.xs_size) || 0) +
        (Number(item.s_size) || 0) +
        (Number(item.m_size) || 0) +
        (Number(item.l_size) || 0) +
        (Number(item.xl_size) || 0) +
        (Number(item.xxl_size) || 0) +
        (Number(item.fourxl_size) || 0);
    }, 0);

    // 사이즈별 통계 계산
    const sizeStats = [
      { size: 'XS(85)', quantity: data.reduce((sum, item) => sum + (Number(item.xs_size) || 0), 0) },
      { size: 'S(90)', quantity: data.reduce((sum, item) => sum + (Number(item.s_size) || 0), 0) },
      { size: 'M(95)', quantity: data.reduce((sum, item) => sum + (Number(item.m_size) || 0), 0) },
      { size: 'L(100)', quantity: data.reduce((sum, item) => sum + (Number(item.l_size) || 0), 0) },
      { size: 'XL(105)', quantity: data.reduce((sum, item) => sum + (Number(item.xl_size) || 0), 0) },
      { size: 'XXL(110)', quantity: data.reduce((sum, item) => sum + (Number(item.xxl_size) || 0), 0) },
      { size: 'XXXL(120)', quantity: data.reduce((sum, item) => sum + (Number(item.fourxl_size) || 0), 0) }
    ].map(stat => ({
      ...stat,
      percentage: (stat.quantity / totalQuantity) * 100
    }));

    return NextResponse.json(sizeStats);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 