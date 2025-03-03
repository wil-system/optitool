'use client';
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import useSWR from 'swr';
import ChannelRegistrationModal from '@/app/components/channels/ChannelRegistrationModal';
import type { ISalesChannels } from '@/app/types/database';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface EditableRowProps {
  channel: ISalesChannels;
  onCancel: () => void;
  onSave: (updatedChannel: ISalesChannels) => Promise<void>;
}

const EditableRow = ({ channel, onCancel, onSave }: EditableRowProps) => {
  const [editedChannel, setEditedChannel] = useState<ISalesChannels>({ ...channel });
  const [details, setDetails] = useState(channel.channel_details);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmedDetails = details.split(',').map(detail => detail.trim()).filter(detail => detail);
    
    if (trimmedDetails.length === 0) {
      setError('채널상세는 최소 1개 이상 입력해야 합니다.');
      return;
    }

    setError('');
    const updatedData = {
      ...editedChannel,
      channel_details: trimmedDetails.join(',')
    };
    await onSave(updatedData);
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedChannel.channel_code}
          onChange={(e) => setEditedChannel({ ...editedChannel, channel_code: e.target.value })}
          className="w-full px-2 py-1 border rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedChannel.channel_name}
          onChange={(e) => setEditedChannel({ ...editedChannel, channel_name: e.target.value })}
          className="w-full px-2 py-1 border rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <input
            type="text"
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              setError('');
            }}
            className={`w-full px-2 py-1 border rounded ${error ? 'border-red-500' : ''}`}
            placeholder="쉼표로 구분"
          />
          {error && (
            <div className="text-red-500 text-xs mt-1">{error}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedChannel.remarks || ''}
          onChange={(e) => setEditedChannel({ ...editedChannel, remarks: e.target.value })}
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

export default function ChannelListPage() {
  const [channels, setChannels] = useState<ISalesChannels[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState({
    channel_code: true,
    channel_name: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const PAGE_SIZE = 12;
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ISalesChannels | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [error, setError] = useState<string>('');
  const [totalPages, setTotalPages] = useState(1);

  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, isLoading: _ } = useSWR('/api/channels', fetcher);

  const fetchChannels = useCallback(async () => {
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

      const response = await fetch(`/api/channels?${params}`);
      
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }

      const { data, totalPages: pages, hasMore } = await response.json();
      setChannels(data || []);
      setTotalPages(pages);
      setHasMore(hasMore);
    } catch (error) {
      console.error('채널 목록 조회 중 오류:', error);
      alert('채널 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, searchFields]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchChannels();
  };

  const handleDelete = (channelCode: string) => {
    setDeleteTargetId(channelCode);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    try {
      const response = await fetch(`/api/channels?code=${deleteTargetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      await fetchChannels();
      alert('삭제가 완료되었습니다.');
    } catch (error) {
      console.error('채널 삭제 중 오류:', error);
      alert('채널 삭제에 실패했습니다.');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const onSave = async (updatedChannel: ISalesChannels) => {
    try {
      const response = await fetch(`/api/channels/${updatedChannel.channel_code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedChannel),
      });

      if (!response.ok) throw new Error('수정 실패');
      
      await fetchChannels();
      setEditingId(null);
    } catch (error) {
      console.error('채널 수정 중 오류:', error);
      alert('채널 수정에 실패했습니다.');
    }
  };

  type SearchField = 'channel_code' | 'channel_name';
  const handleSearchFieldChange = (field: SearchField) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleEdit = (channel: ISalesChannels) => {
    console.log('Editing channel:', channel);  // 디버깅 로그 추가
    setSelectedChannel({
      ...channel,
      channel_details: typeof channel.channel_details === 'string' 
        ? channel.channel_details 
        : (channel.channel_details as string[]).join(',')
    });
    setEditMode('edit');
    setIsRegistrationModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRegistrationModalOpen(false);
    setSelectedChannel(null);
    setEditMode('create');
  };

  const DeleteConfirmPopup = () => {
    if (!deleteTargetId) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h3 className="text-lg font-semibold mb-4">삭제 확인</h3>
          <p className="mb-6">채널을 삭제하시겠습니까?</p>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              판매채널 목록
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.channel_code}
                    onChange={() => handleSearchFieldChange('channel_code')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">채널코드</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.channel_name}
                    onChange={() => handleSearchFieldChange('channel_name')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">채널명</span>
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
                onClick={() => setIsRegistrationModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                채널 추가
              </button>
            </div>
          </div>

          {/* 테이블 */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  채널코드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                  채널명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-96">
                  채널상세
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[420px]">
                  비고
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {channels.map((channel) => (
                editingId === channel.channel_code ? (
                  <EditableRow
                    key={channel.channel_code}
                    channel={channel}
                    onCancel={() => setEditingId(null)}
                    onSave={onSave}
                  />
                ) : (
                  <tr key={channel.channel_code}>
                    <td className="px-6 py-4 text-sm text-gray-500 w-36 break-all">
                      {channel.channel_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 w-56 break-all">
                      {channel.channel_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 w-96 break-all">
                      {typeof channel.channel_details === 'string' 
                        ? channel.channel_details.split(',').filter(Boolean).join(', ')
                        : (channel.channel_details as string[]).join(', ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 w-[420px] break-all">
                      {channel.remarks}
                    </td>
                    <td className="px-6 py-4 text-sm text-center w-24">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(channel)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(channel.channel_code)}
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

          {/* 페이지네이션 */}
          <div className="mt-4 flex justify-center items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 border rounded-lg mr-2 disabled:opacity-50"
            >
              이전
            </button>
            
            <span className="mx-4 text-sm text-gray-700">
              {currentPage + 1} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!hasMore || channels.length === 0}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </div>
      
      {/* 삭제 확인 팝업 */}
      <DeleteConfirmPopup />

      {/* 등록/수정 모달 */}
      <ChannelRegistrationModal 
        isOpen={isRegistrationModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          handleCloseModal();
          fetchChannels();
        }}
        initialData={selectedChannel}
        mode={editMode}
      />
    </DashboardLayout>
  );
} 