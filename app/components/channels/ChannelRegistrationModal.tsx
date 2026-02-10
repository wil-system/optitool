'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/app/components/common/Modal';
import type { ISalesChannels } from '@/app/types/database';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ISalesChannels | null;
  mode: 'create' | 'edit';
}

export default function ChannelRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  mode = 'create'
}: IProps) {
  const [formData, setFormData] = useState<Partial<ISalesChannels>>({
    channel_code: '',
    channel_name: '',
    remarks: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        channel_code: initialData.channel_code || '',
        channel_name: initialData.channel_name || '',
        remarks: initialData.remarks || '',
      });
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(
        mode === 'create' 
          ? '/api/channels' 
          : `/api/channels/${formData.channel_code}`,
        {
          method: mode === 'create' ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            channel_details: [] // 채널 상세는 이제 사용하지 않으므로 빈 배열
          }),
        }
      );

      if (!response.ok) {
        throw new Error('채널 등록/수정 실패');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      channel_code: '',
      channel_name: '',
      remarks: '',
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'create' ? '판매채널 등록' : '판매채널 수정'}
      width="w-[500px]"
    >
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  채널코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.channel_code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 6) {
                      setFormData(prev => ({ ...prev, channel_code: value }));
                    }
                  }}
                  disabled={mode === 'edit'}
                  maxLength={6}
                  required
                  placeholder="최대 숫자 6자리"
                  className={`w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-card text-foreground ${mode === 'edit' ? 'bg-muted cursor-not-allowed' : ''}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  채널명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.channel_name}
                  onChange={(e) => {
                    if (e.target.value.length <= 20) {
                      setFormData(prev => ({ ...prev, channel_name: e.target.value }));
                    }
                  }}
                  maxLength={20}
                  required
                  placeholder="채널명을 입력하세요 (최대 20자)"
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-card text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  비고
                </label>
                <textarea
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="참고 사항을 입력하세요"
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[80px] resize-none bg-card text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 shadow-sm transition-colors"
            >
              {mode === 'create' ? '등록' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 