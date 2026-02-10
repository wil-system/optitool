'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/app/components/common/Modal';
import { supabase } from '@/utils/supabase';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

interface SetProduct {
  id: number;
  set_id: string;
  set_name: string;
  remarks: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (set: SetProduct) => void;
}

export default function SetProductSelectionModal({ isOpen, onClose, onSelect }: Props) {
  const [sets, setSets] = useState<SetProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('set_products')
        .select('id, set_id, set_name, remarks')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSets(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching sets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSets();
    }
  }, [isOpen]);

  const filteredSets = sets.filter(set => 
    set.set_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.set_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="세트 상품 선택" width="w-[600px]">
      <div className="p-4 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="세트품번 또는 상품명으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="max-h-[400px] overflow-y-auto border border-border rounded-lg">
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground uppercase">세트품번</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground uppercase">상품명</th>
                  <th className="px-4 py-2 text-center text-xs font-bold text-muted-foreground uppercase">선택</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredSets.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      조회된 세트 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredSets.map((set) => (
                    <tr key={set.id} className="hover:bg-accent transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{set.set_id}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{set.set_name}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onSelect(set)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors"
                        >
                          선택
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
