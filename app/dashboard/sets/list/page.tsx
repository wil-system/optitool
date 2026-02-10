'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import SetRegistrationModal from '@/app/components/sets/SetRegistrationModal';
import type { ISetProduct } from '@/app/types/database';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import { supabase } from '@/utils/supabase';

export default function SetListPage() {
  const [sets, setSets] = useState<ISetProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState({
    set_id: true,
    set_name: true
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const PAGE_SIZE = 12;
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<ISetProduct | null>(null);
  const [viewSet, setViewSet] = useState<ISetProduct | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);
  const excelMenuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (excelMenuRef.current && !excelMenuRef.current.contains(event.target as Node)) {
        setIsExcelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleRowExpansion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const fetchSets = useCallback(async (backgroundLoad = false) => {
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

      const response = await fetch(`/api/sets?${params}`);
      
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }

      const { data, totalPages: pages, hasMore } = await response.json();
      setSets(data || []);
      setTotalPages(pages);
      setHasMore(hasMore);
    } catch (error) {
      console.error('세트 목록 조회 중 오류:', error);
      alert('세트 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, searchFields]);

  useEffect(() => {
    fetchSets(true);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(0);
    if (currentPage === 0) {
      fetchSets(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
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
      setDeleteTargetId(null);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('세트 삭제 중 오류:', error);
      alert('세트 삭제에 실패했습니다.');
      setDeleteTargetId(null);
    }
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
            <h3 className="text-lg font-bold text-foreground mb-2">세트 삭제</h3>
            <p className="text-sm text-muted-foreground">
              정말로 이 세트상품을 삭제하시겠습니까?<br/>
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

  type SearchField = 'set_id' | 'set_name';
  const handleSearchFieldChange = (field: SearchField) => {
    setSearchFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleEdit = (set: ISetProduct) => {
    setSelectedSet(set);
    setIsRegistrationModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRegistrationModalOpen(false);
    setSelectedSet(null);
    setViewSet(null);
  };

  const handleRegistrationSuccess = () => {
    fetchSets();
    handleCloseModal();
  };

  const handleDownloadTemplate = () => {
    const headers = ['세트번호', '세트 상품명', '개별품번', '개별 상품명', '비고'];
    const data = [
      ['SET001', '예시 세트상품명', 'ABCD1234-AB-S	', '예시 상품명1', '세트 SET001에'],
      ['', '', 'ABCD1234-AB-M	', '예시 상품명2', '해당 상품들이'],
      ['', '', 'ABCD1234-AB-L	', '예시 상품명3', '등록 됩니다'],
      ['SET002', '다음 세트상품명', 'ZZZZ9876-AB-S	', '다음 상품명1', '세트번호를'],
      ['', '', 'ZZZZ9876-AB-M	', '다음 상품명2', '입력하면'],
      ['', '', 'ZZZZ9876-AB-L	', '다음 상품명3', '다음세트가 등록됩니다']
    ];

    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '세트상품 양식');
    
    // 헤더 스타일 설정 (연두색 배경)
    const headerStyle = {
      fill: { fgColor: { rgb: "CCFFCC" } }, // 연두색 (Light Green)
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };

    // 헤더 셀(A1 ~ E1)에 스타일 적용
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:E1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!ws[address]) continue;
      ws[address].s = headerStyle;
    }

    // 열 너비 설정
    ws['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 30 },
      { wch: 20 }
    ];

    // xlsx-js-style을 사용하여 파일 저장
    XLSXStyle.writeFile(wb, '세트상품_업로드_양식.xlsx');
  };

  // 엑셀 출력 (모든 데이터 내보내기)
  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      // 모든 데이터를 가져오기 위해 size 없이 요청
      const response = await fetch('/api/sets');
      if (!response.ok) throw new Error('데이터 조회 실패');
      const { data } = await response.json();

      const headers = ['세트번호', '세트 상품명', '개별품번', '개별 상품명', '비고'];
      const excelData: any[][] = [];

      data.forEach((set: any) => {
        if (set.individual_products_with_names && set.individual_products_with_names.length > 0) {
          set.individual_products_with_names.forEach((p: any, idx: number) => {
            excelData.push([
              idx === 0 ? set.set_id : '', // 첫 행에만 세트번호 표시 (업로드 양식 호환)
              idx === 0 ? set.set_name : '', // 첫 행에만 세트명 표시
              p.item_number,
              p.product_name,
              idx === 0 ? (set.remarks || '') : '' // 첫 행에만 비고 표시
            ]);
          });
        }
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '세트목록');

      // 헤더 스타일 설정 (연두색 배경)
      const headerStyle = {
        fill: { fgColor: { rgb: "CCFFCC" } },
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };

      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:E1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!ws[address]) continue;
        ws[address].s = headerStyle;
      }

      ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 20 }];

      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      
      XLSXStyle.writeFile(wb, `세트목록_${timestamp}.xlsx`);
      setIsExcelMenuOpen(false);
    } catch (error) {
      console.error('엑셀 출력 오류:', error);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const groupedData: any[] = [];
      let currentSet: any = null;
      
      jsonData.forEach((row: any) => {
        const setId = row['세트번호']?.toString().trim();
        const setName = row['세트 상품명']?.toString().trim();
        const itemNumber = row['개별품번']?.toString().trim();
        const productName = row['개별 상품명']?.toString().trim();
        const remarks = row['비고']?.toString().trim() || '';

        if (setId) {
          if (currentSet) {
            groupedData.push(currentSet);
          }
          currentSet = {
            set_id: setId,
            set_name: setName || '',
            individual_product_ids: [],
            remarks_list: remarks ? [remarks] : []
          };
        }

        if (currentSet) {
          if (itemNumber) {
            // 엑셀에서 읽어올 때 앞뒤 공백 및 보이지 않는 문자 제거
            const cleanItemNumber = itemNumber.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
            const productValue = productName ? `${cleanItemNumber}#${productName.trim()}` : cleanItemNumber;
            currentSet.individual_product_ids.push(productValue);
          }
          
          if (remarks && !setId) {
            currentSet.remarks_list.push(remarks);
          }
        }
      });

      if (currentSet) {
        groupedData.push(currentSet);
      }

      const finalData = groupedData.map(set => ({
        set_id: set.set_id,
        set_name: set.set_name,
        individual_product_ids: set.individual_product_ids,
        remarks: set.remarks_list.join(', ')
      }));

      let successCount = 0;
      let failCount = 0;
      let errorMessages: string[] = [];

      for (const setData of finalData) {
        try {
          if (!setData.set_id || !setData.set_name || setData.individual_product_ids.length === 0) {
            failCount++;
            errorMessages.push(`[${setData.set_id || '알 수 없음'}] 필수 항목 누락`);
            continue;
          }

          // 개별 품번 처리 (부분 일치 검색 로직 추가)
          const expandedProductIds: string[] = [];
          for (const productValue of setData.individual_product_ids) {
            // productValue는 "itemNumber#productName" 또는 "itemNumber" 형식
            const [rawItemNumber, customProductName] = productValue.split('#');

            // 안전하게 정제(보이지 않는 문자/공백 제거) + 끝의 '-' 제거 (예: "LWLIAST0342-" 입력 케이스)
            const cleaned = (rawItemNumber || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
            const normalizedPrefix = cleaned.replace(/-+$/, '');

            // "-" 개수 확인 (정규화된 prefix 기준)
            const dashCount = (normalizedPrefix.match(/-/g) || []).length;

            // 요구사항: "기본품번" 또는 "기본품번-색상"처럼 '-'가 0~1개인 경우에만 하위 옵션들을 확장 등록
            if (dashCount < 2) {
              // 주의: 세트 조회/매칭 로직이 inventory_history.item_number 기준이므로,
              // 여기서도 item_number로 검색/저장해야 하위 품번이 정상 등록됩니다.
              const { data: matchedProducts, error: searchError } = await supabase
                .from('inventory_history')
                .select('item_number, product_name')
                .like('item_number', `${normalizedPrefix}-%`);

              if (!searchError && matchedProducts && matchedProducts.length > 0) {
                matchedProducts.forEach((p: any) => {
                  expandedProductIds.push(`${p.item_number}#${p.product_name}`);
                });
              } else {
                // 하위 옵션이 없으면 자기 자신이 존재하는지 확인 후 등록
                const { data: exactMatch } = await supabase
                  .from('inventory_history')
                  .select('item_number, product_name')
                  .eq('item_number', normalizedPrefix)
                  .maybeSingle();

                if (exactMatch) {
                  // 엑셀에 '개별 상품명'이 들어있으면 그 값을 우선 사용
                  expandedProductIds.push(
                    `${exactMatch.item_number}#${customProductName || exactMatch.product_name}`
                  );
                } else {
                  expandedProductIds.push(productValue);
                }
              }
            } else {
              // '-'가 2개 이상(예: "LMLIAST0344-BU-M")은 이미 옵션까지 포함된 값으로 보고 그대로 저장
              expandedProductIds.push(productValue);
            }
          }

          // 중복 제거
          const uniqueProductIds = Array.from(new Set(expandedProductIds));
          
          // DB 저장을 위해 데이터 가공 (itemNumber#productName 형식에서 itemNumber만 추출하거나 그대로 전달)
          // API(register/route.ts)에서 어떻게 처리하는지 확인 필요하지만, 
          // 현재 UI 로직상 individual_product_ids는 ["품번#이름", ...] 형식을 기대함
          const finalSetData = {
            ...setData,
            individual_product_ids: uniqueProductIds
          };

          const { data: existingSet, error: checkError } = await supabase
            .from('set_products')
            .select('set_id')
            .eq('set_id', setData.set_id)
            .maybeSingle();

          if (checkError) throw checkError;
          if (existingSet) {
            failCount++;
            errorMessages.push(`[${setData.set_id}] 이미 동일한 세트 번호가 존재합니다.`);
            continue;
          }

          const response = await fetch('/api/sets/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalSetData),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const result = await response.json();
            errorMessages.push(`[${setData.set_id}] ${result.error || '저장 실패'}`);
          }
        } catch (error: any) {
          console.error('세트 저장 오류:', error);
          failCount++;
          errorMessages.push(`[${setData.set_id}] ${error.message || '시스템 오류'}`);
        }
      }

      const summary = `업로드 완료!\n성공: ${successCount}개, 실패: ${failCount}개`;
      const detail = errorMessages.length > 0 ? `\n\n실패 사유:\n${errorMessages.join('\n')}` : '';
      alert(summary + detail);
      fetchSets();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('엑셀 파일 처리 오류:', error);
      alert('엑셀 파일 처리 중 오류가 발생했습니다.');
    }
  };

  const SuccessPopup = () => {
    if (!showSuccessPopup) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-in fade-in duration-200">
        <div className="bg-card rounded-xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-50 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">삭제 완료</h3>
            <p className="text-sm text-muted-foreground">
              세트상품이 성공적으로 삭제되었습니다.
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
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
            <h3 className="text-lg font-semibold text-foreground">
              세트목록
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.set_id}
                    onChange={() => handleSearchFieldChange('set_id')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">세트번호</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFields.set_name}
                    onChange={() => handleSearchFieldChange('set_name')}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">상품명</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 md:w-80 text-sm"
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
              
              {/* 엑셀 통합 버튼 및 드롭다운 */}
              <div className="relative border-l pl-4" ref={excelMenuRef}>
                <button
                  onClick={() => setIsExcelMenuOpen(!isExcelMenuOpen)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm flex items-center gap-2 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  엑셀
                  <svg className={`w-3 h-3 transition-transform ${isExcelMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExcelMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-border dark:border-gray-700 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleDownloadTemplate();
                          setIsExcelMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-foreground dark:text-gray-200 hover:bg-muted dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        양식 다운로드
                      </button>
                      
                      <label
                        htmlFor="excel-upload"
                        className="w-full px-4 py-2.5 text-left text-sm text-foreground dark:text-gray-200 hover:bg-muted dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        엑셀 업로드
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => {
                          handleExcelUpload(e);
                          setIsExcelMenuOpen(false);
                        }}
                        className="hidden"
                        id="excel-upload"
                      />

                      <button
                        onClick={handleExportExcel}
                        className="w-full px-4 py-2.5 text-left text-sm text-foreground dark:text-gray-200 hover:bg-muted dark:hover:bg-gray-700 flex items-center gap-2 transition-colors border-t border-gray-100 dark:border-gray-700"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        엑셀 출력
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                세트등록
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
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">
                      세트번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[20%]">
                      상품명
                    </th>
                    <th colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[35%]">
                      구성 상품 정보 (품번 / 상품명)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[20%]">
                      비고
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10%]">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {sets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        조회된 세트상품이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    sets.map((set) => (
                      <tr 
                        key={set.id}
                        className="transition-colors duration-150 hover:bg-accent"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                          {set.set_id}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-foreground break-words">
                          {set.set_name}
                        </td>
                        <td colSpan={2} className="px-6 py-4 text-sm text-foreground">
                          <div className="flex flex-col gap-1">
                            {expandedRows.has(set.id.toString()) ? (
                              <div className="space-y-4 bg-muted dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                {Object.entries(
                                  (set.individual_products_with_names || []).reduce((acc: any, p: any) => {
                                    const groupKey = p.item_number.split('-')[0] || '기타';
                                    if (!acc[groupKey]) acc[groupKey] = [];
                                    acc[groupKey].push(p);
                                    return acc;
                                  }, {})
                                ).map(([groupKey, products]: [string, any]) => (
                                  <div key={groupKey} className="space-y-1">
                                    <h5 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-1">
                                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                      {groupKey}
                                    </h5>
                                    <div className="grid grid-cols-1 gap-1 pl-3">
                                      {products.map((p: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                          <span className="w-32 text-[11px] text-foreground dark:text-gray-300 font-bold">{p.item_number}</span>
                                          <span className="flex-1 text-[11px] text-gray-600 dark:text-muted-foreground truncate" title={p.product_name}>{p.product_name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap gap-2">
                                  {Array.from(new Set(set.individual_products_with_names?.map(p => p.item_number.split('-')[0]))).map((group, idx) => (
                                    <span key={idx} className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      {group}
                                    </span>
                                  ))}
                                </div>
                                {set.individual_products_with_names && set.individual_products_with_names.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground mt-1 font-medium">
                                    총 {set.individual_products_with_names.length}개 품목 등록됨
                                  </span>
                                )}
                              </div>
                            )}
                            <button
                              onClick={(e) => toggleRowExpansion(e, set.id.toString())}
                              className="mt-2 text-[10px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors w-fit bg-white dark:bg-gray-900 px-2 py-1 rounded border border-blue-100 dark:border-blue-900 shadow-sm"
                            >
                              {expandedRows.has(set.id.toString()) ? (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  상세 정보 접기
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  상세 품목 펼치기
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground whitespace-normal break-words" title={set.remarks || ''}>
                          {set.remarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(set);
                              }}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all"
                              title="수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(set.id.toString());
                              }}
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
              disabled={!hasMore || sets.length === 0}
              className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm hover:bg-muted"
            >
              다음
            </button>
          </div>
        </div>
      </div>
      
      <DeleteConfirmPopup />
      <SuccessPopup />

      {(isRegistrationModalOpen && !selectedSet && !viewSet) && (
        <SetRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
          onSuccess={() => {
            fetchSets();
            setIsRegistrationModalOpen(false);
          }}
          mode="create"
        />
      )}

      {selectedSet && (
        <SetRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleRegistrationSuccess}
          initialData={selectedSet}
          mode="edit"
        />
      )}

      {viewSet && !selectedSet && (
        <SetRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => {
            setIsRegistrationModalOpen(false);
            setViewSet(null);
          }}
          initialData={viewSet}
          mode="view"
        />
      )}
    </DashboardLayout>
  );
}
