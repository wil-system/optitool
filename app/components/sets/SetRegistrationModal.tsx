'use client';
import React, { useState } from 'react';
import { supabase } from '@/utils/supabase';

interface SetRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const SetRegistrationModal: React.FC<SetRegistrationModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    set_id: '',
    set_name: '',
    remarks: ''
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

  // ... 기타 필요한 함수들 동일하게 구현 ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedProductCodes = productInputs[0].selectedProducts.map(product => product.product_code);
      const requestData = {
        set_id: formData.set_id,
        set_name: formData.set_name,
        individual_product_ids: selectedProductCodes,
        remarks: formData.remarks
      };
      
      console.log('요청 데이터:', requestData);

      const response = await fetch('/api/sets/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      console.log('서버 응답:', responseText);

      const result = responseText ? JSON.parse(responseText) : {};
      
      if (!response.ok) {
        throw new Error(result.error || '세트상품 등록 실패');
      }
      
      alert('세트상품이 성공적으로 등록되었습니다.');
      onClose();
    } catch (error) {
      console.error('세트상품 등록 오류:', error);
      alert(`세트상품 등록 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
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
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">세트상품 등록</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        >
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
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
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
    </div>
  );
};

export default SetRegistrationModal; 