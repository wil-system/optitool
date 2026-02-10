import { supabase } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '12');
    const searchTerm = searchParams.get('searchTerm') || '';
    const seasonFilter = searchParams.get('season') === 'true';
    const channelFilter = searchParams.get('channel') === 'true';
    const productNameFilter = searchParams.get('productName') === 'true';
    const setIdFilter = searchParams.get('setId') === 'true';
    const onlyWithPerformance = searchParams.get('onlyWithPerformance') === 'true';
    const excludeWithPerformance = searchParams.get('excludeWithPerformance') === 'true';

    let query = supabase
      .from('sales_plans_with_performance')
      .select('*', { count: 'exact' });

    if (onlyWithPerformance) {
      query = query.or('total_order_quantity.neq.0,net_order_quantity.neq.0');
    }

    if (excludeWithPerformance) {
      query = query.eq('total_order_quantity', 0).eq('net_order_quantity', 0);
    }

    query = query
      .order('plan_date', { ascending: false })
      .order('plan_time', { ascending: false });

    if (searchTerm) {
      const orConditions = [];
      if (seasonFilter) orConditions.push(`season.ilike.%${searchTerm}%,season_year.ilike.%${searchTerm}%`);
      if (channelFilter) orConditions.push(`channel_name.ilike.%${searchTerm}%`);
      if (productNameFilter) orConditions.push(`product_name.ilike.%${searchTerm}%`);
      if (setIdFilter) orConditions.push(`set_item_code.ilike.%${searchTerm}%`);
      
      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      }
    }

    const { data, error, count } = await query
      .range(page * size, (page + 1) * size - 1);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / size) : 0,
      currentPage: page + 1,
      hasMore: count ? (page + 1) * size < count : false
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
