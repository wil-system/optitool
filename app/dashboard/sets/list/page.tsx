'use client';
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import useSWR from 'swr';
import SetRegistrationModal from '@/app/components/sets/SetRegistrationModal';

interface SetProduct {
  id: string;
  set_id: string;
  set_name: string;
  individual_product_ids: string[];
  remarks: string;
  created_at: string;
}

interface EditableRowProps {
  set: SetProduct;
  onCancel: () => void;
  onSave: (updatedSet: SetProduct) => Promise<void>;
}

const EditableRow = ({ set, onCancel, onSave }: EditableRowProps) => {
  const [editedSet, setEditedSet] = useState<SetProduct>({ ...set });
  const [productIds, setProductIds] = useState(set.individual_product_ids.join(', '));

  const handleSave = async () => {
    const updatedSet = {
      ...editedSet,
      individual_product_ids: productIds.split(',').map(id => id.trim()).filter(id => id)
    };
    await onSave(updatedSet);
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedSet.set_id}
          onChange={(e) => setEditedSet({ ...editedSet, set_id: e.target.value })}
          className="w-full px-2 py-1 border rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedSet.set_name}
          onChange={(e) => setEditedSet({ ...editedSet, set_name: e.target.value })}
          className="w-full px-2 py-1 border rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={productIds}
          onChange={(e) => setProductIds(e.target.value)}
          className="w-full px-2 py-1 border rounded"
          placeholder="쉼표로 구분"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedSet.remarks || ''}
          onChange={(e) => setEditedSet({ ...editedSet, remarks: e.target.value })}
          className="w-full px-2 py-1 border rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <button
          onClick={handleSave}
          className="text-green-600 hover:text-green-900 mr-2"
        >
          저장
        </button>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-900"
        >
          취소
        </button>
      </td>
    </tr>
  );
};

export default function SetListPage() {
  const [sets, setSets] = useState<SetProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState({
    set_id: true,
    set_name: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const PAGE_SIZE = 100;
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const fetchSets = useCallback(async () => {
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

      const response = await fetch(`/api/sets?${params}`);
      
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }

      const { data, hasMore } = await response.json();
      setSets(data?.filter((set: any) => set.is_active !== false) || []);
      setHasMore(hasMore);
    } catch (error) {
      console.error('세트 목록 조회 중 오류:', error);
      alert('세트 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, searchFields]);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchSets();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/sets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '삭제 실패');
      }

      await fetchSets();
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('Error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    setDeleteTargetId(null);

    try {
      const response = await fetch(`/api/sets?id=${deleteTargetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      await fetchSets();
      alert('삭제가 완료되었습니다.');
    } catch (error) {
      console.error('세트 삭제 중 오류:', error);
      alert('세트 삭제에 실패했습니다.');
    }
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

  type SearchField = 'set_id' | 'set_name';
  const handleSearchFieldChange = (field: SearchField) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleEdit = (set: SetProduct) => {
    setEditingId(set.id);
  };

  const handleSave = async (updatedSet: SetProduct) => {
    try {
      const response = await fetch(`/api/sets/${updatedSet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSet),
      });

      if (!response.ok) {
        throw new Error('수정 실패');
      }

      await fetchSets();
      setEditingId(null);
      alert('수정되었습니다.');
    } catch (error) {
      console.error('Error:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleCloseRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
    fetchSets();
  };

  if (isLoading) return <div>로딩 중...</div>;
  
  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              세트목록
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                세트등록
              </button>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.set_id}
                    onChange={() => handleSearchFieldChange('set_id')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">세트번호</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.set_name}
                    onChange={() => handleSearchFieldChange('set_name')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">세트명</span>
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
            </div>
          </div>

          {/* 테블 */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  세트번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  세트명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  개별품번
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  비고
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sets.map((set) => (
                editingId === set.id ? (
                  <EditableRow
                    key={`edit-${set.id}`}
                    set={set}
                    onCancel={() => setEditingId(null)}
                    onSave={handleSave}
                  />
                ) : (
                  <tr 
                    key={set.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {set.set_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {set.set_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {set.individual_product_ids.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {set.remarks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button 
                        onClick={() => handleEdit(set)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDelete(set.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 border rounded-lg mr-2 disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </div>
      
      {/* 삭제 확인 팝업 */}
      <DeleteConfirmPopup />

      {/* 세트등록 모달 */}
      {isRegistrationModalOpen && (
        <SetRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={handleCloseRegistrationModal}
        />
      )}
    </DashboardLayout>
  );
} 