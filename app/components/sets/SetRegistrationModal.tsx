'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import type { ISetProduct, ISetForm } from '@/app/types/database';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: ISetProduct | null;
  mode?: 'create' | 'edit' | 'view';
}

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

export default function SetRegistrationModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialData = null,
  mode = 'create' 
}: IProps) {
  const [formData, setFormData] = useState<ISetForm>(() => {
    if (mode === 'edit' || mode === 'view') {
      return {
        set_id: initialData?.set_id || '',
        set_name: initialData?.set_name || '',
        individual_product_ids: Array.isArray(initialData?.individual_product_ids) 
          ? initialData?.individual_product_ids 
          : [],
        remarks: initialData?.remarks || ''
      };
    }
    return {
      set_id: '',
      set_name: '',
      individual_product_ids: [],
      remarks: ''
    };
  });

  const [productInputs, setProductInputs] = useState<ProductIdInput[]>([
    { id: '1', value: '', selectedProducts: [] }
  ]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentInputId, setCurrentInputId] = useState<string>('');
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [productCode, setProductCode] = useState('');

  
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
      return null;
    }
  };

  // initialData가 변경될 때마다 상품 정보 로드
  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && initialData?.individual_product_ids) {
      loadInitialProducts(initialData.individual_product_ids);
    }
  }, [initialData, mode]);

  useEffect(() => {
    if (mode === 'view' && initialData) {
      setFormData({
        set_id: initialData.set_id || '',
        set_name: initialData.set_name || '',
        individual_product_ids: Array.isArray(initialData.individual_product_ids) 
          ? initialData.individual_product_ids 
          : [],
        remarks: initialData.remarks || ''
      });
    }
  }, [initialData, mode]);

  const loadInitialProducts = async (productCodes: string[]) => {
    try {
      if (productCodes.length === 0) return;

      const response = await fetch(`/api/sets/products?codes=${productCodes.join(',')}`);
      
      if (!response.ok) {
        throw new Error('상품 정보 조회 실패');
      }

      const { data } = await response.json();

      if (data) {
        setProductInputs(prev => prev.map(input => 
          input.id === '1' 
            ? { ...input, selectedProducts: data }
            : input
        ));
      }
    } catch (error) {
      console.error('상품 데이터 로드 중 오류:', error);
    }
  };

  // productInputs가 변경될 때마다 formData의 individual_product_ids 업데이트
  useEffect(() => {
    const allSelectedProducts = productInputs.reduce((acc, input) => {
      const productCodes = input.selectedProducts.map(product => product.product_code);
      return [...acc, ...productCodes];
    }, [] as string[]);

    setFormData(prev => ({
      ...prev,
      individual_product_ids: allSelectedProducts
    }));
  }, [productInputs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = mode === 'edit' && initialData 
        ? `/api/sets/${initialData.id}`
        : '/api/sets/register';

      // 현재 상태의 formData 사용
      const requestData = mode === 'edit'
        ? { ...initialData, ...formData }
        : formData;

      console.log('Submitting data:', requestData); // 디버깅용 로그

      const response = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(mode === 'edit' ? '세트상품 수정 실패' : '세트상품 등록 실패');
      }

      alert(mode === 'edit' ? '세트상품이 수정되었습니다.' : '세트상품이 등록되었습니다.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert(mode === 'edit' ? '세트상품 수정 중 오류가 발생했습니다.' : '세트상품 등록 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirmClick = async (inputId: string) => {
    const input = productInputs.find(p => p.id === inputId);
    if (!input || !input.value) return;

    const products = await searchProducts(input.value);
    if (products.length > 0) {
      setMatchingProducts(products);
      setCurrentInputId(inputId);
      setIsProductModalOpen(true);
    } else {
      alert('일치하는 상품이 없습니다.');
    }
  };

  const handleProductIdChange = (inputId: string, value: string) => {
    setProductInputs(prev => prev.map(input => 
      input.id === inputId 
        ? { ...input, value: value.toUpperCase() }
        : input
    ));
  };

  const handleAddByProductCode = async () => {
    if (!productCode) return;
    
    const product = await searchByProductCode(productCode);
    if (product) {
      const existingProductCodes = new Set(
        productInputs[0].selectedProducts.map(p => p.product_code)
      );

      if (existingProductCodes.has(product.product_code)) {
        alert('이미 선택된 상품입니다.');
        setProductCode('');
        return;
      }

      setProductInputs(prev => prev.map(input => ({
        ...input,
        selectedProducts: [...input.selectedProducts, product]
      })));
      setProductCode('');
    } else {
      alert('일치하는 상품이 없습니다.');
    }
  };

  const handleRemoveSelectedProduct = (inputId: string, productId: number) => {
    setProductInputs(prev => prev.map(input => 
      input.id === inputId 
        ? {
            ...input,
            selectedProducts: input.selectedProducts.filter(p => p.id !== productId)
          }
        : input
    ));
  };

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

  const handleSelectAll = () => {
    if (selectedProductIds.size === matchingProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(matchingProducts.map(p => p.id)));
    }
  };

  const handleSelectionConfirm = () => {
    const selectedProducts = matchingProducts.filter(p => selectedProductIds.has(p.id));
    
    setProductInputs(prev => prev.map(input => {
      if (input.id === currentInputId) {
        const existingProductIds = new Set(input.selectedProducts.map(p => p.id));
        
        const newProducts = selectedProducts.filter(p => !existingProductIds.has(p.id));
        
        return {
          ...input,
          selectedProducts: [...input.selectedProducts, ...newProducts]
        };
      }
      return input;
    }));

    setIsProductModalOpen(false);
    setSelectedProductIds(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[1000px] max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-3 border-b-2 border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'edit' 
              ? "세트상품 수정" 
              : mode === 'view' 
                ? "세트상품 상세" 
                : "세트상품 등록"
            }
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border-2 border-gray-200 rounded-lg bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-1">세트번호</label>
              <input
                type="text"
                value={formData.set_id}
                onChange={(e) => setFormData({ ...formData, set_id: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={mode === 'view'}
              />
            </div>
            <div className="p-3 border-2 border-gray-200 rounded-lg bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-1">세트명</label>
              <input
                type="text"
                value={formData.set_name}
                onChange={(e) => setFormData({ ...formData, set_name: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={mode === 'view'}
              />
            </div>
          </div>
            
          <div className="p-3 border-2 border-gray-200 rounded-lg bg-white">
            <label className="block text-sm font-medium text-gray-700 mb-1">개별품번 / 품목코드</label>
            {mode === 'view' ? (
              <div>
                {productInputs[0].selectedProducts.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">선택된 상품:</h4>
                    <div className="max-h-[250px] overflow-y-auto mt-1">
                      <ul className="divide-y divide-gray-200">
                        {productInputs[0].selectedProducts.map(product => (
                          <li key={product.id} className="py-1.5 px-3 bg-gray-50 rounded-md">
                            <span className="text-sm text-gray-600">
                              {product.product_code} , {product.product_name} , {product.specification}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    {formData.individual_product_ids.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={productInputs[0].value}
                      onChange={(e) => handleProductIdChange(productInputs[0].id, e.target.value)}
                      maxLength={4}
                      className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="품번입력"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmClick(productInputs[0].id)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      확인
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                      className="w-32 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="품목코드입력"
                    />
                    <button
                      type="button"
                      onClick={handleAddByProductCode}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      추가
                    </button>
                  </div>
                </div>
                {productInputs[0].selectedProducts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">선택된 상품:</h4>
                    <div className="max-h-[250px] overflow-y-auto">
                      <ul className="divide-y divide-gray-200">
                        {productInputs[0].selectedProducts.map(product => (
                          <li key={product.id} className="py-1.5 px-3 bg-gray-50 rounded-md flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {product.product_code} , {product.product_name} , {product.specification}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedProduct(productInputs[0].id, product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              삭제
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-2 border-gray-200 rounded-lg bg-white">
            <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={mode === 'view'}
            />
          </div>
        </div>

        <div className="px-6 py-3 border-t-2 border-gray-200 bg-gray-50 flex justify-end space-x-3">
          {mode === 'view' ? (
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50"
            >
              닫기
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {mode === 'edit' ? '수정' : '등록'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 상품 선택 모달 */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-4">상품 선택</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
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
                  onClick={() => setIsProductModalOpen(false)}
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
} 