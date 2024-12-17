import { createClient } from '@supabase/supabase-js';
import CategoryClient from './CategoryClient';

async function getCategories() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .order('category_name');

  return categories || [];
}

export default async function CategoryPage() {
  const categories = await getCategories();
  return <CategoryClient initialCategories={categories} />;
} 