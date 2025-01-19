'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import * as XLSX from 'xlsx';
import type { Product } from '@/types/product';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Product | null;
  mode?: 'create' | 'edit';
}

interface IProductForm {
  product_code: string;
  item_number: string;
  product_name: string;
  specification: string;
  purchase_price: number;
  selling_price: number;
  barcode_info: string;
  barcode: string;
  tag_price: number;
  remarks: string;
}

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

export default function ProductRegistrationModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialData = null,
  mode = 'create'
}: IProps) {
  console.log('Modal Props:', { isOpen, mode, initialData });  // 모달 props 로그

  const [formData, setFormData] = useState<IProductForm>(() => {
    console.log('Initial Form Data Setup:', { mode, initialData });  // 초기 데이터 설정 로그
    if (mode === 'edit' && initialData) {
      return {
        product_code: initialData.product_code || '',
        item_number: initialData.item_number || '',
        product_name: initialData.product_name || '',
        specification: initialData.specification || '',
        purchase_price: initialData.purchase_price || 0,
        selling_price: initialData.selling_price || 0,
        barcode_info: initialData.barcode_info || '',
        barcode: initialData.barcode || '',
        tag_price: initialData.tag_price || 0,
        remarks: initialData.remarks || ''
      };
    }
    return {
      product_code: '',
      item_number: '',
      product_name: '',
      specification: '',
      purchase_price: 0,
      selling_price: 0,
      barcode_info: '',
      barcode: '',
      tag_price: 0,
      remarks: ''
    };
  });

  useEffect(() => {
    console.log('useEffect Triggered:', { mode, initialData });  // useEffect 트리거 로그
    if (mode === 'edit' && initialData) {
      const updatedFormData = {
        product_code: initialData.product_code || '',
        item_number: initialData.item_number || '',
        product_name: initialData.product_name || '',
        specification: initialData.specification || '',
        purchase_price: initialData.purchase_price || 0,
        selling_price: initialData.selling_price || 0,
        barcode_info: initialData.barcode_info || '',
        barcode: initialData.barcode || '',
        tag_price: initialData.tag_price || 0,
        remarks: initialData.remarks || ''
      };
      console.log('Updated Form Data:', updatedFormData);  // 업데이트된 데이터 로그
      setFormData(updatedFormData);
    }
  }, [initialData, mode]);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [uploadCanceled, setUploadCanceled] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [shouldCancelUpload, setShouldCancelUpload] = useState(false);
  const [displayFormat, setDisplayFormat] = useState({
    purchase_price: false,
    selling_price: false,
    tag_price: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('price')) {
      // 숫자만 추출하여 저장
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: Number(numericValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBlur = (name: string) => {
    setDisplayFormat(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleFocus = (name: string) => {
    setDisplayFormat(prev => ({
      ...prev,
      [name]: false
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = mode === 'edit' && initialData 
        ? `/api/products/${initialData.id}`
        : '/api/products';

      const requestData = mode === 'edit' 
        ? { ...initialData, ...formData }  // initialData의 id 등 필드 유지하면서 formData로 업데이트
        : formData;

      const response = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(mode === 'edit' ? '상품 수정 실패' : '상품 등록 실패');
      }

      alert(mode === 'edit' ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert(mode === 'edit' ? '상품 수정 중 오류가 발생했습니다.' : '상품 등록 중 오류가 발생했습니다.');
    }
  };

  const cleanup = (reader: FileReader, fileInput: HTMLInputElement) => {
    setIsUploading(false);
    setProgress({ current: 0, total: 0 });
    setShouldCancelUpload(false);
    setAbortController(null);
    reader.abort();
    fileInput.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    const fileInput = e.target as HTMLInputElement;
    const file = (fileInput.files as FileList)[0];
    const reader = new FileReader();
    const controller = new AbortController();
    setAbortController(controller);
    setIsUploading(true);
    setShouldCancelUpload(false);

    reader.onload = async (e) => {
      try {
        if (shouldCancelUpload) {
          cleanup(reader, fileInput);
          return;
        }
        const data = e.target?.result;
        const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 1 }) as ExcelRow[];
        const validData = jsonData.filter(row => row['품목코드'] && row['품목코드'].trim() !== '');
        setProgress({ current: 0, total: validData.length });

        for (let i = 0; i < validData.length; i++) {
          if (shouldCancelUpload) {
            console.log('업로드가 취소되었습니다.');
            return;
          }

          const row = validData[i];
          const productData = {
            product_code: row['품목코드'],
            item_number: String(row['품목명']).match(/[A-Z]+(\d+)(?=[A-Z-])/)?.[1] || '',
            product_name: row['품목명'],
            specification: row['규격명'],
            purchase_price: row['입고단가'] || 0,
            selling_price: row['출고단가'] || 0,
            barcode: row['바코드'],
            barcode_info: row['바코드 정보'],
            tag_price: row['택가'] || 0,
            remarks: ''
          };

          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
            signal: controller.signal
          });

          if (!response.ok) {
            throw new Error(`Failed to save product: ${productData.product_name}`);
          }

          setProgress(prev => ({ ...prev, current: i + 1 }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!shouldCancelUpload) {
          alert('업로드가 완료되었습니다.');
          onSuccess?.();
          onClose();
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('업로드가 취소되었습니다.');
          return;
        }
        console.error('업로드 중 오류 발생:', error);
        alert('업로드 중 오류가 발생했습니다.');
      } finally {
        cleanup(reader, fileInput);
      }
    };

    reader.onerror = () => {
      console.error('파일 읽기 오류');
      cleanup(new FileReader(), fileInput);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleCancelUpload = async () => {
    if (confirm('파일 업로드를 취소하시겠습니까?')) {
      setShouldCancelUpload(true);
      abortController?.abort();
      cleanup(new FileReader(), document.getElementById('excelFileUpload') as HTMLInputElement);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR');
  };

  const inputClassName = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500";

  const handleModalClose = () => {
    setFormData({
      product_code: '',
      item_number: '',
      product_name: '',
      specification: '',
      purchase_price: 0,
      selling_price: 0,
      barcode_info: '',
      barcode: '',
      tag_price: 0,
      remarks: ''
    });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'edit' ? "상품 수정" : "상품 등록"}
      preventClose={true}
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                품목코드 *
              </label>
              <input
                type="text"
                name="product_code"
                value={formData.product_code}
                onChange={handleChange}
                maxLength={10}
                required
                className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                maxLength={5}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                maxLength={5}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                품목명 *
              </label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                입고단가
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="purchase_price"
                  value={displayFormat.purchase_price 
                    ? `${formatPrice(formData.purchase_price)}원` 
                    : formData.purchase_price}
                  onChange={handleChange}
                  onFocus={() => handleFocus('purchase_price')}
                  onBlur={() => handleBlur('purchase_price')}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                출고단가
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="selling_price"
                  value={displayFormat.selling_price 
                    ? `${formatPrice(formData.selling_price)}원` 
                    : formData.selling_price}
                  onChange={handleChange}
                  onFocus={() => handleFocus('selling_price')}
                  onBlur={() => handleBlur('selling_price')}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                택가
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="tag_price"
                  value={displayFormat.tag_price 
                    ? `${formatPrice(formData.tag_price)}원` 
                    : formData.tag_price}
                  onChange={handleChange}
                  onFocus={() => handleFocus('tag_price')}
                  onBlur={() => handleBlur('tag_price')}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                바코드 정보
              </label>
              <input
                type="text"
                name="barcode_info"
                value={formData.barcode_info}
                onChange={handleChange}
                maxLength={15}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                maxLength={15}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비고
              </label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {mode === 'create' && (
                <>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excelFileUpload"
                  />
                  <label
                    htmlFor="excelFileUpload"
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-md cursor-pointer hover:bg-green-700 font-semibold text-sm"
                  >
                    엑셀 파일 업로드
                  </label>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {mode === 'edit' ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 업로드 진행 상태 모달 */}
      {isUploading && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">파일 업로드 중...</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {progress.current} / {progress.total} 처리중...
                <br />
                <span className="text-xs text-gray-500">
                  {Math.round((progress.current / progress.total) * 100)}% 완료
                </span>
              </p>
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
} 