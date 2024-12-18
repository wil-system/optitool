'use client';
import React, { useState } from 'react';
import Modal from '@/app/components/common/Modal';
import { supabase } from '@/utils/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ChannelDetailInput {
  id: string;
  value: string;
}

export default function ChannelRegistrationModal({ isOpen, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    channel_code: '',
    channel_name: '',
    remarks: ''
  });

  const [channelDetails, setChannelDetails] = useState<ChannelDetailInput[]>([
    { id: '1', value: '' }
  ]);

  const handleDetailChange = (id: string, value: string) => {
    setChannelDetails(prev =>
      prev.map(detail =>
        detail.id === id ? { ...detail, value } : detail
      )
    );
  };

  const handleAddDetail = () => {
    setChannelDetails(prev => [
      ...prev,
      { id: String(Date.now()), value: '' }
    ]);
  };

  const handleRemoveDetail = (id: string) => {
    setChannelDetails(prev => prev.filter(detail => detail.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: existingChannel } = await supabase
        .from('sales_channels')
        .select('channel_code')
        .eq('channel_code', formData.channel_code)
        .single();

      if (existingChannel) {
        alert('이미 존재하는 채널코드입니다.');
        return;
      }

      const channel_details = channelDetails
        .map(detail => detail.value)
        .filter(value => value.length > 0);

      if (channel_details.length === 0) {
        alert('채널상세를 최소 1개 이상 입력해주세요.');
        return;
      }

      const { error } = await supabase
        .from('sales_channels')
        .insert([{
          channel_code: formData.channel_code,
          channel_name: formData.channel_name,
          channel_details,
          remarks: formData.remarks
        }]);

      if (error) throw error;

      alert('판매채널이 성공적으로 등록되었습니다.');
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error inserting sales channel:', error);
      alert('판매채널 등록 중 오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      channel_code: '',
      channel_name: '',
      remarks: ''
    });
    setChannelDetails([{ id: '1', value: '' }]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="판매채널 등록">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                채널코드
              </label>
              <input
                type="text"
                value={formData.channel_code}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) {
                    setFormData(prev => ({
                      ...prev,
                      channel_code: value
                    }));
                  }
                }}
                maxLength={6}
                required
                placeholder="숫자 6자리"
                className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                채널명
              </label>
              <input
                type="text"
                value={formData.channel_name}
                onChange={(e) => {
                  if (e.target.value.length <= 20) {
                    setFormData(prev => ({
                      ...prev,
                      channel_name: e.target.value
                    }));
                  }
                }}
                maxLength={20}
                required
                placeholder="최대 20자"
                className="w-40 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              채널상세
            </label>
            <div className="space-y-2">
              {channelDetails.map((detail) => (
                <div key={detail.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={detail.value}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 20);
                      handleDetailChange(detail.id, value);
                    }}
                    maxLength={20}
                    placeholder="최대 20자"
                    className="w-64 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {detail.value.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleAddDetail}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        추가
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDetail(detail.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비고
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
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
    </Modal>
  );
} 