'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { supabase } from '@/utils/supabase';

interface ChannelDetailInput {
  id: string;
  value: string;
}

const ChannelRegistrationPage = () => {
  const [formData, setFormData] = useState({
    channel_code: '',
    channel_name: '',
    remarks: ''
  });

  const [channelDetails, setChannelDetails] = useState<ChannelDetailInput[]>([
    { id: '1', value: '' }
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
      setFormData({
        channel_code: '',
        channel_name: '',
        remarks: ''
      });
      setChannelDetails([{ id: '1', value: '' }]);
    } catch (error) {
      console.error('Error inserting sales channel:', error);
      alert('판매채널 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">판매채널 등록</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">판매채널 정보</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    채널코드
                  </label>
                  <input
                    type="text"
                    name="channel_code"
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
                    placeholder=""
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center"
                  />
                </div>
                
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    채널명
                  </label>
                  <input
                    type="text"
                    name="channel_name"
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

                <div className="col-span-2">
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

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비고
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
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
      </div>
    </DashboardLayout>
  );
};

export default ChannelRegistrationPage; 