'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { supabase } from '@/utils/supabase';

interface Product {
  id: number;
  product_code: string;
  item_number: string;
  product_name: string;
  specification: string;
}

interface ProductIdInput {
  id: string;
  value: string;
  selectedProducts: Product[];
}

const SetRegistrationPage = () => {
  const [formData, setFormData] = useState({
    set_id: '',
    set_name: '',
    remarks: ''
  });

  const [productInputs, setProductInputs] = useState<ProductIdInput[]>([
    { id: '1', value: '', selectedProducts: [] }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInputId, setCurrentInputId] = useState<string>('');
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [productCode, setProductCode] = useState('');

  // 상품 검색 함수
  const searchProducts = async (itemNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('item_number', itemNumber);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('상품 검색 중 오류:', error);
      return [];
    }
  };

  // 품목코드로 상품 검색
  const searchByProductCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_code', code)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      //console.error('상품 검색 중 오류:', error);
      return null;
    }
  };

  // 품목코드로 상품 추가
  const handleAddByProductCode = async () => {
    if (!productCode.trim()) {
      alert('품목코드를 입력해주세요.');
      return;
    }

    const product = await searchByProductCode(productCode);
    
    if (!product) {
      alert('일치하는 상품이 없습니다.');
      return;
    }

    // 첫 번째 입력 필드에 상품 추가
    setProductInputs(prev =>
      prev.map((input, index) =>
        index === 0
          ? {
              ...input,
              selectedProducts: [
                ...input.selectedProducts,
                ...(!input.selectedProducts.some(p => p.id === product.id) ? [product] : [])
              ]
            }
          : input
      )
    );

    setProductCode(''); // 입력 필드 초기화
  };

  // 개별품번 입력 처리
  const handleProductIdChange = (id: string, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setProductInputs(prev =>
      prev.map(input =>
        input.id === id ? { ...input, value: numericValue.slice(0, 4) } : input
      )
    );
  };

  // 확인 버튼 클릭 처리
  const handleConfirmClick = async (inputId: string) => {
    const input = productInputs.find(p => p.id === inputId);
    if (!input || !input.value) return;

    const products = await searchProducts(input.value);
    if (products.length > 0) {
      setMatchingProducts(products);
      setCurrentInputId(inputId);
      setIsModalOpen(true);
    } else {
      alert('일치하는 상품이 없습니다.');
    }
  };

  // 상품 선택 처리
  const handleProductSelect = (productId: number) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // 선택 완료 처리
  const handleSelectionConfirm = () => {
    const newSelectedProducts = matchingProducts.filter(p => selectedProductIds.has(p.id));
    
    setProductInputs(prev =>
      prev.map(input =>
        input.id === currentInputId
          ? {
              ...input,
              selectedProducts: [
                ...input.selectedProducts,
                ...newSelectedProducts.filter(newProduct => 
                  !input.selectedProducts.some(existingProduct => 
                    existingProduct.id === newProduct.id
                  )
                )
              ]
            }
          : input
      )
    );
    
    setIsModalOpen(false);
    setSelectedProductIds(new Set());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProductInput = () => {
    setProductInputs(prev => [
      ...prev,
      { id: String(Date.now()), value: '', selectedProducts: [] }
    ]);
  };

  const handleRemoveProductInput = (id: string) => {
    setProductInputs(prev => prev.filter(input => input.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 선택된 상품들의 품목코드 추출
      const selectedProductCodes = productInputs[0].selectedProducts.map(product => product.product_code);

      // API 호출
      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          set_id: formData.set_id,
          set_name: formData.set_name,
          product_codes: selectedProductCodes,
          remarks: formData.remarks
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      alert('세트상품이 성공적으로 등록되었습니다.');
      // 폼 초기화
      setFormData({
        set_id: '',
        set_name: '',
        remarks: ''
      });
      setProductInputs([{ id: '1', value: '', selectedProducts: [] }]);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : '세트상품 등록 중 오류가 발생했습니다.');
    }
  };

  // 전체 선택/해제 처리
  const handleSelectAll = () => {
    if (selectedProductIds.size === matchingProducts.length) {
      // 모두 선택된 상태면 전체 해제
      setSelectedProductIds(new Set());
    } else {
      // 일부만 선택되었거나 아무것도 선택되지 않은 상태면 전체 선택
      setSelectedProductIds(new Set(matchingProducts.map(p => p.id)));
    }
  };

  // 선택된 상품 삭제 처리
  const handleRemoveSelectedProduct = (inputId: string, productId: number) => {
    setProductInputs(prev =>
      prev.map(input =>
        input.id === inputId
          ? {
              ...input,
              selectedProducts: input.selectedProducts.filter(p => p.id !== productId)
            }
          : input
      )
    );
  };

  const content = (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">세트상품 등록</h1>
      
      <form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
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
                  개별품번 / 품목코드
                </label>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={productInputs[0].value}
                      onChange={(e) => handleProductIdChange(productInputs[0].id, e.target.value)}
                      maxLength={4}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="품번입력"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmClick(productInputs[0].id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      확인
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="품목코드입력"
                    />
                    <button
                      type="button"
                      onClick={handleAddByProductCode}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      추가
                    </button>
                  </div>
                </div>
                {productInputs[0].selectedProducts.length > 0 && (
                  <div className="ml-4 mt-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">선택된 상품:</h4>
                    <ul className="space-y-1">
                      {productInputs[0].selectedProducts.map(product => (
                        <li key={product.id} className="flex items-center justify-between text-sm text-gray-600 pr-2">
                          <span>{product.product_code} , {product.product_name} , {product.specification}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedProduct(productInputs[0].id, product.id)}
                            className="ml-2 text-red-600 hover:text-red-700"
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

      {/* 상품 선택 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">상품 선택</h3>
            <div className="space-y-2">
              {matchingProducts.map(product => (
                <label key={product.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(product.id)}
                    onChange={() => handleProductSelect(product.id)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="text-sm">
                    {product.product_name} ({product.specification})
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-between items-center">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {selectedProductIds.size === matchingProducts.length ? '전체 해제' : '전체 선택'}
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSelectionConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  선택
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default SetRegistrationPage;