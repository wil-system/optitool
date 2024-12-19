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
  const [isLoading, setIsLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!response.ok) throw new Error('카테고리 등록 실패');

      const { data } = await response.json();
      setCategories([...categories, data]);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('카테고리 등록 중 오류가 발생했습니다.');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">카테고리 관리</h2>
          
          {/* 등록 폼 */}
          <form onSubmit={handleSubmit} className="mb-6 flex gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="카테고리명 입력"
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              등록
            </button>
          </form>

          {/* 카테고리 목록 */}
          <div className="grid grid-cols-[1fr,auto] gap-4 items-center">
            {categories.map(category => (
              <React.Fragment key={category.id}>
                <div className="px-4 py-2 bg-gray-50 rounded">
                  {category.category_name}
                </div>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-4 py-2 text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 