import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import SalesPlanListClient from './SalesPlanListClient';

export default async function SalesPlanListPage() {
  const supabase = createServerComponentClient({ cookies });

  // 활성화된 채널 데이터 조회
  const { data: channels } = await supabase
    .from('sales_channels')
    .select('*')
    .eq('is_active', true)
    .order('channel_name');

  // 카테고리 데이터 조회
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .order('category_name');

  // 세트품번 데이터 조회 수정
  const { data: setIds } = await supabase
    .from('set_products')
    .select('*')
    .eq('is_active', true)
    .order('set_id');

  console.log('세트품번 데이터:', setIds); // 데이터 확인용

  return <SalesPlanListClient 
    initialData={[]} 
    channels={channels || []}
    categories={categories || []}
    setIds={setIds || []}
  />;
}