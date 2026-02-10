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

interface IndividualProduct {
  itemNumber: string;
  customName: string;
  originalName: string;
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

  const [individualProducts, setIndividualProducts] = useState<IndividualProduct[]>([]);
  const [itemNumberInput, setItemNumberInput] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  
  // 초기 데이터 파싱 (item_number#custom_name 형식)
  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && initialData?.individual_product_ids) {
      const parseInitialData = async () => {
        const productIds = initialData.individual_product_ids || [];
        const parsed = await Promise.all(productIds.map(async str => {
          const hashIndex = str.indexOf('#');
          const itemNumber = hashIndex !== -1 ? str.substring(0, hashIndex) : str;
          const customName = hashIndex !== -1 ? str.substring(hashIndex + 1) : '';

          // inventory_history에서 product_name을 가져옴 (placeholder용)
          let originalName = '';
          try {
            const { data, error } = await supabase
              .from('inventory_history')
              .select('product_name')
              .eq('item_number', itemNumber)
              .maybeSingle();
            
            if (!error && data) {
              originalName = data.product_name;
            }
          } catch (err) {
            console.error('기존 상품명 조회 실패:', err);
          }

          return {
            itemNumber,
            customName: customName, // 저장된 값이 있으면 그대로, 없으면 빈 값
            originalName: originalName || itemNumber // placeholder로 사용할 원래 상품명
          };
        }));
        setIndividualProducts(parsed);
      };

      parseInitialData();
    }
  }, [initialData, mode]);

  
  const searchProductsByItemNumber = async (itemNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_history')
        .select('*')
        .ilike('item_number', `%${itemNumber}%`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('상품 검색 중 오류:', error);
      return [];
    }
  };

  // individualProducts가 변경될 때마다 formData 업데이트
  useEffect(() => {
    const formattedIds = individualProducts.map(product => 
      `${product.itemNumber}#${(product.customName && product.customName.trim()) || product.originalName}`
    );
    
    setFormData(prev => ({
      ...prev,
      individual_product_ids: formattedIds
    }));
  }, [individualProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 값 체크
    if (!formData.set_id.trim()) {
      alert('세트번호를 입력해주세요.');
      return;
    }
    if (!formData.set_name.trim()) {
      alert('세트 상품명을 입력해주세요.');
      return;
    }
    if (individualProducts.length === 0) {
      alert('최소 하나 이상의 개별 상품을 등록해야 합니다.');
      return;
    }

    try {
      // 세트번호 중복 체크 (등록 모드일 때만)
      if (mode === 'create') {
        const { data: existingSet, error: checkError } = await supabase
          .from('set_products')
          .select('set_id')
          .eq('set_id', formData.set_id.trim())
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingSet) {
          alert('이미 존재하는 세트번호입니다. 다른 번호를 입력해주세요.');
          return;
        }
      }

      // 저장 직전에 데이터 최종 가공 (공백이면 # 없이 품번만, 값이 있으면 품번#상품명)
      const finalIndividualProductIds = individualProducts.map(product => {
        const trimmedName = product.customName ? product.customName.trim() : '';
        // 사용자가 입력한 이름이 있으면 품번#이름, 없으면 품번만 저장
        return trimmedName ? `${product.itemNumber}#${trimmedName}` : product.itemNumber;
      });

      const url = mode === 'edit' && initialData 
        ? `/api/sets/${initialData.id}`
        : '/api/sets/register';

      // 현재 상태의 formData 사용하되 가공된 individual_product_ids 적용
      const requestData = mode === 'edit'
        ? { ...initialData, ...formData, individual_product_ids: finalIndividualProductIds }
        : { ...formData, individual_product_ids: finalIndividualProductIds };

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

  const handleSearchItemNumber = async () => {
    const trimmedInput = itemNumberInput.trim();
    if (!trimmedInput) {
      alert('검색어를 입력해주세요.');
      return;
    }

    const products = await searchProductsByItemNumber(trimmedInput);
    
    // 기존에 등록된 itemNumber 목록 생성
    const existingItemNumbers = new Set(individualProducts.map(p => p.itemNumber));
    
    // 기존에 등록된 상품은 검색 결과에서 제외
    const filteredProducts = products.filter(p => !existingItemNumbers.has(p.item_number));

    if (filteredProducts.length > 0) {
      setMatchingProducts(filteredProducts);
      setIsProductModalOpen(true);
    } else if (products.length > 0) {
      alert('검색된 상품이 이미 구성 상품에 모두 등록되어 있습니다.');
    } else {
      alert('일치하는 상품이 없습니다.');
    }
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
    
    // 기존에 등록된 itemNumber 목록 생성
    const existingItemNumbers = new Set(individualProducts.map(p => p.itemNumber));

    const newProducts: IndividualProduct[] = selectedProducts
      .filter(product => !existingItemNumbers.has(product.item_number)) // 중복 제거
      .map(product => ({
        itemNumber: product.item_number,
        customName: '', // 검색으로 가져온 상품은 처음엔 customName을 비워둠
        originalName: product.product_name // placeholder에 표시될 원래 상품명
      }));

    if (newProducts.length < selectedProducts.length) {
      const duplicateCount = selectedProducts.length - newProducts.length;
      alert(`${duplicateCount}개의 상품이 이미 구성 상품에 존재하여 제외되었습니다.`);
    }

    setIndividualProducts(prev => {
      const updatedList = [...prev, ...newProducts];
      // itemNumber 기준으로 오름차순 정렬
      return updatedList.sort((a, b) => a.itemNumber.localeCompare(b.itemNumber));
    });
    setIsProductModalOpen(false);
    setSelectedProductIds(new Set());
    setItemNumberInput('');
  };

  const handleRemoveProduct = (index: number) => {
    setIndividualProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomNameChange = (index: number, newName: string) => {
    setIndividualProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, customName: newName } : product
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[1000px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === 'edit' 
                ? "세트상품 수정" 
                : mode === 'view' 
                  ? "세트상품 상세" 
                  : "세트상품 등록"
              }
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {mode === 'view' ? '세트 상품 정보를 확인합니다' : '세트 상품 정보를 입력해주세요'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 hover:bg-white/50 rounded-lg"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                세트번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.set_id}
                onChange={(e) => setFormData({ ...formData, set_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                placeholder="세트번호를 입력하세요"
                disabled={mode === 'view'}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                세트 상품명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.set_name}
                onChange={(e) => setFormData({ ...formData, set_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                placeholder="상품명을 입력하세요"
                disabled={mode === 'view'}
              />
            </div>
          </div>
            
          {/* 개별품번 섹션 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              개별품번 등록 <span className="text-red-500">*</span>
            </label>
            
            {mode !== 'view' && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <input
                  type="text"
                  value={itemNumberInput}
                  onChange={(e) => setItemNumberInput(e.target.value.toUpperCase())}
                  maxLength={30}
                  className="flex-1 px-4 py-2.5 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-mono"
                  placeholder="품번 입력"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchItemNumber();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearchItemNumber}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm whitespace-nowrap"
                >
                  상품 검색
                </button>
                 
              </div>
            )}

            {/* 선택된 상품 목록 */}
            {individualProducts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    구성 상품 ({individualProducts.length}개)
                  </h4>
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  {Object.entries(
                    individualProducts.reduce((acc, product, index) => {
                      const groupKey = product.itemNumber.split('-')[0] || '기타';
                      if (!acc[groupKey]) acc[groupKey] = [];
                      acc[groupKey].push({ ...product, originalIndex: index });
                      return acc;
                    }, {} as Record<string, (IndividualProduct & { originalIndex: number })[]>)
                  ).map(([groupKey, products]) => (
                    <div key={groupKey} className="space-y-2">
                      <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 px-1 flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                        {groupKey}
                      </h5>
                      <div className="space-y-2">
                        {products.map((product) => (
                          <div key={product.originalIndex} className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-50 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300">
                                  {product.originalIndex + 1}
                                </span>
                              </div>
                              <div className="flex-1 flex items-center gap-4">
                                <div className="flex items-center gap-2 min-w-[140px]">
                                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">품번</span>
                                  <span className="text-sm   font-bold text-gray-600 dark:text-white">
                                    {product.itemNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 min-w-[80px]">
                                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">사이즈</span>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {product.itemNumber.split('-').pop()}
                                  </span>
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap">상품명</span>
                                  <input
                                    type="text"
                                    value={product.customName}
                                    onChange={(e) => handleCustomNameChange(product.originalIndex, e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder={product.originalName || "세트 내 상품명"}
                                    disabled={mode === 'view'}
                                  />
                                </div>
                              </div>
                              {mode !== 'view' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(product.originalIndex)}
                                  className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 비고 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">비고</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none transition-all"
              rows={1}
              placeholder="추가 메모사항을 입력하세요"
              disabled={mode === 'view'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          {mode === 'view' ? (
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                {mode === 'edit' ? '수정 완료' : '등록하기'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 상품 선택 모달 */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">상품 선택</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                검색된 상품 중 세트에 포함할 상품을 선택하세요
              </p>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {Object.entries(
                matchingProducts.reduce((acc, product) => {
                  const groupKey = product.item_number.split('-')[0] || '기타';
                  if (!acc[groupKey]) acc[groupKey] = [];
                  acc[groupKey].push(product);
                  return acc;
                }, {} as Record<string, Product[]>)
              ).map(([groupKey, products]) => (
                <div key={groupKey} className="space-y-2">
                  <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 px-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    {groupKey}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {products.map(product => (
                      <label 
                        key={product.id} 
                        className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={() => handleProductSelect(product.id)}
                          className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1 flex items-center gap-6">
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">품번</span>
                            <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                              {product.item_number}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">사이즈</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {product.item_number.split('-').pop()}
                            </span>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">상품명</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.product_name}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                {selectedProductIds.size === matchingProducts.length ? '전체 해제' : '전체 선택'}
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setSelectedProductIds(new Set());
                  }}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSelectionConfirm}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md"
                >
                  선택 완료 ({selectedProductIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 