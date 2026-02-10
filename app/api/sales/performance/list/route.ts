import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { SearchFilterKey } from '@/types/sales';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const size = parseInt(searchParams.get('size') || '12');
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchField = searchParams.get('searchFields') as SearchFilterKey;

    let query = supabase
      .from('sales_performance')
      .select(`
        *,
        sales_plans!inner (
          *,
          sales_channels!inner (
            channel_code,
            channel_name
          )
        )
      `, { count: 'exact' })
      .not('sales_plan_id', 'is', null);

    // 검색 조건 적용
    if (searchTerm && searchField) {
      const searchValue = `%${searchTerm}%`;
      
      switch(searchField) {
        case 'season':
          query = query.filter('sales_plans.season', 'ilike', searchValue);
          break;
        case 'channel':
          query = query.filter('sales_plans.sales_channels.channel_name', 'ilike', searchValue);
          break;
        case 'channelDetail':
          query = query.filter('sales_plans.channel_detail', 'ilike', searchValue);
          break;
        case 'category':
          query = query.filter('sales_plans.product_category', 'ilike', searchValue);
          break;
        case 'productName':
          // 세트 상품명으로 먼저 검색
          const { data: setProductsByName } = await supabase
            .from('set_products')
            .select('id')
            .ilike('set_name', searchValue);
          
          if (setProductsByName && setProductsByName.length > 0) {
            const setIds = setProductsByName.map(sp => sp.id);
            query = query.in('sales_plans.set_id', setIds);
          } else {
            query = query.eq('sales_plans.set_id', -1);
          }
          break;
        case 'setId':
          // 세트품번으로 검색
          const { data: setProductsById } = await supabase
            .from('set_products')
            .select('id')
            .ilike('set_id', searchValue);
          
          if (setProductsById && setProductsById.length > 0) {
            const setIds = setProductsById.map(sp => sp.id);
            query = query.in('sales_plans.set_id', setIds);
          } else {
            query = query.eq('sales_plans.set_id', -1);
          }
          break;
      }
    }

    // 정렬 적용
    query = query.order('created_at', { ascending: false });

    // 페이지네이션 적용
    const from = page * size;
    const to = from + size - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Query Error:', error);
      throw error;
    }

    // 세트 ID 목록 추출
    const setIds = data
      ?.map(item => item.sales_plans?.set_id)
      .filter(id => id != null) || [];

    // 세트 상품 정보 조회
    let setProducts: { id: number; set_id: string; set_name: string; }[] = [];
    if (setIds.length > 0) {
      const { data: setData } = await supabase
        .from('set_products')
        .select('id, set_id, set_name')
        .in('id', setIds);
      setProducts = setData || [];
    }

    const formattedData = data?.map(item => {
      const setProduct = setProducts.find(sp => sp.id === item.sales_plans?.set_id);
      return {
        id: item.id,
        sales_plan_id: item.sales_plan_id,
        performance: Number(item.performance) || 0,
        achievement_rate: Number(item.achievement_rate) || 0,
        temperature: Number(item.temperature) || 0,
        xs85: Number(item.xs_size) || 0,
        s90: Number(item.s_size) || 0,
        m95: Number(item.m_size) || 0,
        l100: Number(item.l_size) || 0,
        xl105: Number(item.xl_size) || 0,
        xxl110: Number(item.xxl_size) || 0,
        xxxl120: Number(item.fourxl_size) || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        season: item.sales_plans?.season || '',
        plan_date: item.sales_plans?.plan_date || '',
        plan_time: item.sales_plans?.plan_time || '',
        channel_code: item.sales_plans?.channel_code || '',
        channel_name: item.sales_plans?.sales_channels?.channel_name || '',
        channel_detail: item.sales_plans?.channel_detail || '',
        product_category: item.sales_plans?.product_category || '',
        product_name: item.sales_plans?.product_name || '',
        product_code: item.sales_plans?.product_code || '',
        set_id: setProduct?.set_id || '',
        set_name: setProduct?.set_name || '',
        target_quantity: Number(item.sales_plans?.target_quantity) || 0,
        sale_price: Number(item.sales_plans?.sale_price) || 0,
        quantity_composition: item.sales_plans?.quantity_composition || '',
        us_order: Number(item.us_order) || 0
      };
    }) || [];

    return NextResponse.json({
      data: formattedData,
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / size) : 0,
      currentPage: page,
      hasMore: count ? (page + 1) * size < count : false
    });

  } catch (error) {
    console.error('❌ 판매실적 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '판매실적 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
} 