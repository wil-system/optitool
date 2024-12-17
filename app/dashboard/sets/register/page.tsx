'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { supabase } from '@/utils/supabase';

interface ProductIdInput {
  id: string;
  value: string;
}

const SetRegistrationPage = () => {
  const [formData, setFormData] = useState({
    set_id: '',
    set_name: '',
    remarks: ''
  });

  const [productInputs, setProductInputs] = useState<ProductIdInput[]>([
    { id: '1', value: '' }
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductIdChange = (id: string, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setProductInputs(prev =>
      prev.map(input =>
        input.id === id ? { ...input, value: numericValue.slice(0, 4) } : input
      )
    );
  };

  const handleAddProductInput = () => {
    setProductInputs(prev => [
      ...prev,
      { id: String(Date.now()), value: '' }
    ]);
  };

  const handleRemoveProductInput = (id: string) => {
    setProductInputs(prev => prev.filter(input => input.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: existingSet } = await supabase
        .from('set_products')
        .select('set_id')
        .eq('set_id', formData.set_id)
        .single();

      if (existingSet) {
        alert('이미 존재하는 세트번호입니다.');
        return;
      }

      const individual_product_ids = productInputs
        .map(input => input.value)
        .filter(value => value.length > 0);

      const { error } = await supabase
        .from('set_products')
        .insert([{
          set_id: formData.set_id,
          set_name: formData.set_name,
          individual_product_ids,
          remarks: formData.remarks
        }]);

      if (error) throw error;

      alert('세트상품이 성공적으로 등록되었습니다.');
      setFormData({
        set_id: '',
        set_name: '',
        remarks: ''
      });
      setProductInputs([{ id: '1', value: '' }]);
    } catch (error) {
      console.error('Error inserting set product:', error);
      alert('세트상품 등록 중 오류가 발생했습니다.');
    }
  };

  const content = (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">세트상품 등록</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">세트상품 정보</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세트번호
                </label>
                <input
                  type="text"
                  name="set_id"
                  value={formData.set_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세트상품명
                </label>
                <input
                  type="text"
                  name="set_name"
                  value={formData.set_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  개별품번 (최대 4자리 숫자)
                </label>
                <div className="space-y-2">
                  {productInputs.map((input) => (
                    <div key={input.id} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={input.value}
                        onChange={(e) => handleProductIdChange(input.id, e.target.value)}
                        maxLength={4}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="숫자입력"
                      />
                      {input.value.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAddProductInput()}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            추가
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProductInput(input.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
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
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default SetRegistrationPage;