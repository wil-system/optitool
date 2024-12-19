'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';

interface Category {
  id: number;
  category_name: string;
}

interface CategoryClientProps {
  initialCategories: Category[];
}

export default function CategoryClient({ initialCategories }: CategoryClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('카테고리 조회 실패');
      
      const result = await response.json();
      console.log('API 응답:', result); // 디버깅용 로그
      setCategories(result.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('카테고리 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log('현재 categories 상태:', categories);
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: newCategory,
          description: ''
        }),
      });

      if (!response.ok) throw new Error('카테고리 등록 실패');
      
      const { data } = await response.json();
      setCategories([...categories, data]);
      setNewCategory('');
      setError('');
    } catch (error) {
      console.error('Error adding category:', error);
      setError('카테고리 등록에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('카테고리 삭제 실패');

      setCategories(categories.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('카테고리 삭제 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) return <div>로딩중...</div>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">카테고리 관리</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">카테고리 목록</h2>
          
          <div className="mb-6">
            <div className="grid grid-cols-[1fr,auto] gap-4 items-center">
              {categories.map(category => (
                <React.Fragment key={category.id}>
                  <div className="px-4 py-2 bg-gray-50 rounded">
                    {category.category_name}
                  </div>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 카테고리
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="카테고리명 입력"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 