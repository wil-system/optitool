'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { supabase } from '@/utils/supabase';
import type { Product } from '@/types/product';
import * as XLSX from 'xlsx';

interface ExcelRow {
  품목코드: string;
  품목명: string;
  규격명: string;
  입고단가: number;
  출고단가: number;
  바코드: string;
  '바코드 정보': string;
  택가: number;
}

const ProductRegistrationPage = () => {
  const [formData, setFormData] = useState({
    product_code: '',
    item_number: '',
    product_name: '',
    specification: '',
    purchase_price: 0,
    selling_price: 0,
    barcode_info: '',
    barcode: '',
    tag_price: 0,
    remarks: '',
  });

  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([formData])
        .select();

      if (error) throw error;

      alert('상품이 성공적으로 등록되었습니다.');
      // 폼 초기화 또는 리다이렉트 처리
    } catch (error) {
      console.error('Error inserting product:', error);
      alert('상품 등록 중 오류가 발생했습니다.');
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      try {
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 1 }) as ExcelRow[];
        setProgress({ current: 0, total: jsonData.length });

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const productData = {
            product_code: row['품목코드'],
            item_number: String(row['품목명']).match(/[A-Z]+(\d+)(?=[A-Z-])/)?.[1] || '',
            product_name: row['품목명'],
            specification: row['규격명'],
            purchase_price: row['입고단가'] || 0,
            selling_price: row['출고단가'] || 0,
            barcode: row['바코드'],
            barcode_info: row['바코드 정보'],
            tag_price: row['택가'] || 0
          };

          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          });

          if (!response.ok) {
            throw new Error(`Failed to save product: ${productData.product_name}`);
          }

          setProgress(prev => ({ ...prev, current: i + 1 }));
        }
        
        alert('업로드 완료');
      } catch (error) {
        alert('업로드 실패');
      } finally {
        setProgress({ current: 0, total: 0 });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const content = (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">상품 등록</h1>
      
      <div className="mb-6">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleExcelUpload}
          className="hidden"
          id="excel-upload"
        />
        <label
          htmlFor="excel-upload"
          className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
        >
          엑셀 파일 업로드
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">품목 기본정보</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품목코드
                </label>
                <input
                  type="text"
                  name="product_code"
                  value={formData.product_code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품번
                </label>
                <input
                  type="text"
                  name="item_number"
                  value={formData.item_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품목명
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  규격
                </label>
                <input
                  type="text"
                  name="specification"
                  value={formData.specification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입고단가
                </label>
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  출고단가
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  바코드정보
                </label>
                <input
                  type="text"
                  name="barcode_info"
                  value={formData.barcode_info}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  바코드
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  택가
                </label>
                <input
                  type="number"
                  name="tag_price"
                  value={formData.tag_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비고
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            등록
          </button>
        </div>
      </form>

      {progress.total > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-center mt-2">
            {progress.current} / {progress.total} 처리중...
          </p>
        </div>
      )}
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default ProductRegistrationPage; 