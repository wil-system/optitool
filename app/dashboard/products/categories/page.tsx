import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import CategoryClient from './CategoryClient';

export default async function CategoryPage() {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  // 서버 컴포넌트에서 데이터 조회
  const { data: categories } = await fetch(
    `${protocol}://${host}/api/categories`,
    {
      cache: 'no-store',
    }
  ).then(res => res.json());

  return <CategoryClient initialCategories={categories || []} />;
} 