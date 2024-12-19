import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import CategoryClient from './CategoryClient';

async function getCategories() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase
    .from('product_categories')
    .select('*')
    .order('id', { ascending: true });
  
  return data || [];
}

export default async function CategoryPage() {
  const categories = await getCategories();
  return <CategoryClient initialCategories={categories} />;
} 