import { createClient } from '@supabase/supabase-js';
import SalesPlanClient from './SalesPlanClient';

async function getInitialData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [channelResponse, setResponse, categoryResponse] = await Promise.all([
    supabase.from('sales_channels').select('*'),
    supabase.from('set_products').select('set_id, set_name'),
    supabase.from('product_categories').select('*')
  ]);

  return {
    channels: channelResponse.data || [],
    sets: setResponse.data || [],
    categories: categoryResponse.data || []
  };
}

export default async function SalesPlanPage() {
  const initialData = await getInitialData();
  return <SalesPlanClient initialData={initialData} />;
} 