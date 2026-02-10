'use client';
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import ChannelRegistrationModal from '@/app/components/channels/ChannelRegistrationModal';
import type { ISalesChannels } from '@/app/types/database';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const PAGE_SIZE = 12;
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ISalesChannels | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [totalPages, setTotalPages] = useState(1);

  const fetchChannels = useCallback(async (backgroundLoad = false) => {
    try {
      if (!backgroundLoad) {
        setIsLoading(true);
      }
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
    fetchChannels(true);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(0);
    if (currentPage === 0) {
      fetchChannels(false);
    }
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
      setDeleteTargetId(null);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('채널 삭제 중 오류:', error);
      alert('채널 삭제에 실패했습니다.');
      setDeleteTargetId(null);
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
    setSelectedChannel(channel);
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-in fade-in duration-200">
        <div className="bg-card rounded-xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">채널 삭제</h3>
            <p className="text-sm text-muted-foreground">
              정말로 이 판매채널을 삭제하시겠습니까?<br/>
              삭제된 데이터는 복구할 수 없습니다.
            </p>
          </div>
          <div className="bg-muted px-4 py-3 flex flex-row-reverse gap-2">
            <button
              onClick={confirmDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              삭제하기
            </button>
            <button
              onClick={() => setDeleteTargetId(null)}
              className="flex-1 px-4 py-2 bg-card text-foreground text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SuccessPopup = () => {
    if (!showSuccessPopup) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-in fade-in duration-200">
        <div className="bg-card rounded-xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-50 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">삭제 완료</h3>
            <p className="text-sm text-muted-foreground">
              판매채널이 성공적으로 삭제되었습니다.
            </p>
          </div>
          <div className="bg-muted px-4 py-3">
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
            <h3 className="text-lg font-semibold text-foreground">
              판매채널 목록
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.channel_code}
                    onChange={() => handleSearchFieldChange('channel_code')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">채널코드</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.channel_name}
                    onChange={() => handleSearchFieldChange('channel_name')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">채널명</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="pl-10 pr-4 py-2 border rounded-lg w-48 md:w-64 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                검색
              </button>
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                채널 추가
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[20%]">
                      채널코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[25%]">
                      채널명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[40%]">
                      비고
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {channels.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                        조회된 판매채널이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    channels.map((channel) => (
                      <tr key={channel.channel_code} className="transition-colors duration-150 hover:bg-accent">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                          {channel.channel_code}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-foreground break-words">
                          {channel.channel_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground whitespace-normal break-words">
                          {channel.remarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={() => handleEdit(channel)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all"
                              title="수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(channel.channel_code)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-all"
                              title="삭제"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-4 py-4 flex justify-center items-center border-t border-border">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 border rounded-md mr-2 disabled:opacity-50 text-sm hover:bg-muted"
            >
              이전
            </button>
            
            <span className="mx-4 text-sm text-foreground font-medium">
              {currentPage + 1} / {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!hasMore || channels.length === 0}
              className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm hover:bg-muted"
            >
              다음
            </button>
          </div>
        </div>
      </div>
      
      <DeleteConfirmPopup />
      <SuccessPopup />

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