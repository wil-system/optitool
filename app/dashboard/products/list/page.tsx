'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { supabase } from '@/utils/supabase';
import type { Product } from '@/types/product';
import ProductRegistrationModal from '@/app/components/products/ProductRegistrationModal';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState({
    product_code: true,
    item_number: true,
    product_name: true
  });
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const activeFields = Object.entries(searchFields)
        .filter(([_, checked]) => checked)
        .map(([field]) => field);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: PAGE_SIZE.toString(),
        searchTerm,
        searchFields: activeFields.join(',')
      });

      const response = await fetch(`/api/products?${params}`);
      
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }

      const { data, totalPages: pages, hasMore } = await response.json();
      
      setProducts(data || []);
      setTotalPages(pages);
      setHasMore(hasMore);
    } catch (error) {
      console.error('상품 목록 조회 중 오류:', error);
      alert('상품 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsRegistrationModalOpen(true);
  };

  const handleUpdate = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          product_code: product.product_code,
          item_number: product.item_number,
          product_name: product.product_name,
          specification: product.specification,
          barcode: product.barcode,
          barcode_info: product.barcode_info,
          purchase_price: product.purchase_price,
          selling_price: product.selling_price,
          tag_price: product.tag_price
        })
        .eq('id', product.id);

      if (error) throw error;

      setEditingId(null);
      fetchProducts();
      alert('수정이 완료되었습니다.');
    } catch (error) {
      console.error('상품 수정 중 오류:', error);
      alert('상품 수정에 실패했습니다.');
    }
  };

  const handleDelete = (productId: number) => {
    setDeleteTargetId(productId);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    setDeleteTargetId(null);

    try {
      const response = await fetch(`/api/products?id=${deleteTargetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      await fetchProducts();
      alert('삭제가 완료되었습니다.');
    } catch (error) {
      console.error('상품 삭제 중 오류:', error);
      alert('상품 삭제에 실패했습니다.');
    }
  };

  type SearchField = 'product_code' | 'item_number' | 'product_name';

  const handleSearchFieldChange = (field: SearchField) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchProducts();
  };

  const EditableRow = ({ product }: { product: Product }) => {
    const [editedProduct, setEditedProduct] = useState({
      ...product,
      barcode_value: product.barcode
    });

    const inputClassName = "w-full border rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setEditedProduct(prev => ({
        ...prev,
        [name]: name.includes('price') ? Number(value) : value
      }));
    };

    return (
      <tr key={product.id}>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="product_code"
            value={editedProduct.product_code}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="item_number"
            value={editedProduct.item_number}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="product_name"
            value={editedProduct.product_name}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="specification"
            value={editedProduct.specification}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="barcode_value"
            value={editedProduct.barcode_value}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="barcode_info"
            value={editedProduct.barcode_info}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="purchase_price"
            type="number"
            value={editedProduct.purchase_price}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="selling_price"
            type="number"
            value={editedProduct.selling_price}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap">
          <input
            name="tag_price"
            type="number"
            value={editedProduct.tag_price}
            onChange={handleChange}
            className={inputClassName}
          />
        </td>
        <td className="px-6 py-2 whitespace-nowrap text-center">
          <button
            onClick={() => handleUpdate(editedProduct)}
            className="text-green-600 hover:text-green-900 mr-2 text-sm"
          >
            완료
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            취소
          </button>
        </td>
      </tr>
    );
  };

  const DeleteConfirmPopup = () => {
    if (!deleteTargetId) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h3 className="text-lg font-semibold mb-4">삭제 확인</h3>
          <p className="mb-6">데이터를 삭제하시겠습니까?</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              확인
            </button>
            <button
              onClick={() => setDeleteTargetId(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleCloseModal = () => {
    setIsRegistrationModalOpen(false);
    setSelectedProduct(null);
  };

  const handleRegistrationSuccess = () => {
    fetchProducts();
    handleCloseModal();
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              상품목록
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.product_code}
                    onChange={() => handleSearchFieldChange('product_code')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">품목코드</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.item_number}
                    onChange={() => handleSearchFieldChange('item_number')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">품번</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.product_name}
                    onChange={() => handleSearchFieldChange('product_name')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">품목명</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="pl-10 pr-4 py-2 border rounded-lg w-80"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                검색
              </button>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsRegistrationModalOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                상품등록
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      품목코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      품번
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      품목명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      규격
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                      바코드 값
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                      바코드 정보
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                      입고단가
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      출고단가
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      택가
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    editingId === product.id ? (
                      <EditableRow key={product.id} product={product} />
                    ) : (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32">
                          {product.product_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32">
                          {product.item_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-40">
                          {product.specification}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-44">
                          {product.barcode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-44">
                          {product.barcode_info}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right w-40">
                          {product.purchase_price?.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right w-40">
                          {product.selling_price?.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right w-40">
                          {product.tag_price?.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-center items-center">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="relative inline-flex items-center px-4 py-2 border rounded-lg mr-2 disabled:opacity-50"
            >
              이전
            </button>
            
            <span className="mx-4 text-sm text-gray-700">
              {currentPage + 1} / {totalPages}
            </span>

            <button 
              onClick={handleNextPage}
              disabled={!hasMore || products.length === 0}
              className="relative inline-flex items-center px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </div>
      
      <DeleteConfirmPopup />

      <ProductRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleRegistrationSuccess}
        initialData={selectedProduct}
        mode={selectedProduct ? 'edit' : 'create'}
      />
    </DashboardLayout>
  );
} 