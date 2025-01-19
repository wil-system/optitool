'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface Category {
  id: number;
  category_name: string;
}

export default function CategoryClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '카테고리 조회 실패');
      }

      setCategories(result.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert(error instanceof Error ? error.message : '카테고리 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      alert('카테고리명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          category_name: trimmedName
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '카테고리 등록 실패');
      }

      setCategories([...categories, result.data]);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error adding category:', error);
      alert(error instanceof Error ? error.message : '카테고리 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '카테고리 삭제 실패');
      }

      setCategories(categories.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error instanceof Error ? error.message : '카테고리 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">카테고리 관리</h2>
          
          <form onSubmit={handleSubmit} className="mb-6 flex gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="카테고리명 입력"
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              등록
            </button>
          </form>

          <div className="grid grid-cols-[1fr,auto] gap-4 items-center">
            {categories.map(category => (
              <React.Fragment key={category.id}>
                <div className="px-4 py-2 bg-gray-50 rounded">
                  {category.category_name}
                </div>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                  disabled={isLoading}
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