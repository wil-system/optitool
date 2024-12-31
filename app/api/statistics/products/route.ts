import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('검색 조건:', { startDate, endDate });

    let query = supabase
      .from('sales_performance')
      .select(`
        sales_plan_id,
        sales_plans!inner(
          set_id,
          product_name,
          product_code
        ),
        xs_size,
        s_size,
        m_size,
        l_size,
        xl_size,
        xxl_size,
        fourxl_size,
        amount,
        created_at
      `)
      .eq('is_active', true);

    if (startDate) {
      query = query.gte('created_at', startDate.split('T')[0]);
    }
    if (endDate) {
      query = query.lte('created_at', endDate.split('T')[0]);
    }

    const { data, error } = await query;

    console.log('DB 조회 결과:', data);
    console.log('DB 조회 에러:', error);

    if (error) throw error;

    // 상품별로 데이터 집계
    const statistics = Object.values(data.reduce((acc: any, curr: any) => {
      const productCode = curr.sales_plans.product_code;
      if (!productCode) return acc;

      const totalQuantity = (curr.xs_size || 0) + 
                          (curr.s_size || 0) + 
                          (curr.m_size || 0) + 
                          (curr.l_size || 0) + 
                          (curr.xl_size || 0) + 
                          (curr.xxl_size || 0) + 
                          (curr.fourxl_size || 0);

      if (!acc[productCode]) {
        acc[productCode] = {
          id: productCode,
          product_name: curr.sales_plans.product_name,
          quantity: 0,
          amount: 0
        };
      }
      acc[productCode].quantity += totalQuantity;
      acc[productCode].amount += curr.amount || 0;
      return acc;
    }, {}));

    console.log('집계 결과:', statistics);

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 