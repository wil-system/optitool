'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { format } from 'date-fns';
import SalesPlanRegistrationModal from '@/app/components/sales/SalesPlanRegistrationModal';
import SalesCombinedEditModal from '@/app/components/sales/SalesCombinedEditModal';
import { ISalesPlans, ISalesPlanWithPerformance } from '@/app/types/database';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { DeleteConfirmModal, SuccessModal, ErrorModal } from '@/app/components/common/FeedbackModals';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import { supabase } from '@/utils/supabase';

interface Channel {
  id: number;
  channel_code: string;
  channel_name: string;
}

interface Category {
  id: number;
  category_name: string;
}

interface SetProduct {
  id: number;
  set_id: string;
  set_name: string;
  remarks: string;
}

interface Props {
  initialData: ISalesPlans[];
  channels: Channel[];
  categories: Category[];
  setIds: SetProduct[];
}

export default function SalesPerformanceListClient({ initialData, channels: initialChannels, categories: initialCategories, setIds }: Props) {
  const [data, setData] = useState<ISalesPlanWithPerformance[]>([]);
  const [channels, setChannels] = useState(initialChannels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [sets, setSets] = useState<SetProduct[]>(setIds);
  const [selectedPlan, setSelectedPlan] = useState<ISalesPlanWithPerformance | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    season: true,
    channel: true,
    productName: true,
    setId: true
  });
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const excelMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: (currentPage - 1).toString(),
        size: '12',
        searchTerm: appliedSearchTerm,
        season: searchFilters.season ? 'true' : 'false',
        channel: searchFilters.channel ? 'true' : 'false',
        productName: searchFilters.productName ? 'true' : 'false',
        setId: searchFilters.setId ? 'true' : 'false',
        onlyWithPerformance: 'true'
      });

      const [plansResponse, channelsResponse] = await Promise.all([
        fetch(`/api/sales/plans/with-performance?${params}`),
        fetch('/api/channels?size=1000') // 채널은 페이징 없이 충분히 많이 가져옴
      ]);

      if (!plansResponse.ok || !channelsResponse.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const [plansResult, channelsResult] = await Promise.all([
        plansResponse.json(),
        channelsResponse.json()
      ]);

      setData(plansResult.data || []);
      setTotalPages(plansResult.totalPages || 1);
      setChannels(channelsResult.data || []);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, appliedSearchTerm]);

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "ID", "시즌년도", "시즌", "일자", "시작시간", "채널", "세트품번", "상품명", "추가구성", "추가품번",
      "판매가", "수수료", "목표", "총주문수량", "순주문수량", "총매출", "순매출", "달성율", "미리주문%", "종합달성률%",
      "사이즈수량(85)", "사이즈수량(90)", "사이즈수량(95)", "사이즈수량(100)", "사이즈수량(105)", "사이즈수량(110)", "사이즈수량(115)", "사이즈수량(120)"
    ];

    const exampleData = [
      [
        "", "2024", "SS", "2024-03-20", "10:00", "GS홈쇼핑", "SET-001", "예시 상품", "기본구성", "ITEM-001",
        100000, 15, 100
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '판매계획실적 양식');

    const headerStyle = {
      fill: { fgColor: { rgb: "CCFFCC" } },
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" }
      }
    };

    const performanceHeaderStyle = {
      fill: { fgColor: { rgb: "FFE5CC" } }, // 주황색 계열 (Light Orange)
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" }
      }
    };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AB1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!ws[address]) continue;

      // "총주문수량" (인덱스 13) 부터 주황색 적용
      if (C >= 13) {
        ws[address].s = performanceHeaderStyle;
      } else {
        ws[address].s = headerStyle;
      }
    }

    XLSXStyle.writeFile(wb, '판매계획_실적_업로드_양식.xlsx');
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const { data: allData, error } = await supabase
        .from('sales_plans_with_performance')
        .select('*')
        .order('plan_date', { ascending: false });

      if (error) throw error;

      const headers = [
        "ID", "시즌년도", "시즌", "일자", "시작시간", "채널", "세트품번", "상품명", "추가구성", "추가품번",
        "판매가", "수수료", "목표", "총주문수량", "순주문수량", "총매출", "순매출", "달성율", "미리주문%", "종합달성률%",
        "사이즈수량(85)", "사이즈수량(90)", "사이즈수량(95)", "사이즈수량(100)", "사이즈수량(105)", "사이즈수량(110)", "사이즈수량(115)", "사이즈수량(120)"
      ];

      const excelData = allData.map(item => [
        item.id, item.season_year, item.season, item.plan_date, item.plan_time, item.channel_name, item.set_item_code, item.product_name, item.additional_composition, item.additional_item_code,
        item.sale_price, item.commission_rate, item.target_quantity, item.total_order_quantity, item.net_order_quantity, item.total_sales, item.net_sales, item.achievement_rate, item.pre_order_rate, item.total_achievement_rate,
        item.size_85, item.size_90, item.size_95, item.size_100, item.size_105, item.size_110, item.size_115, item.size_120
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '판매계획실적 목록');

      const headerStyle = {
        fill: { fgColor: { rgb: "CCFFCC" } },
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };

      const performanceHeaderStyle = {
        fill: { fgColor: { rgb: "FFE5CC" } }, // 주황색 계열
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };

      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AB1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!ws[address]) continue;

        // "총주문수량" (인덱스 13) 부터 주황색 적용
        if (C >= 13) {
          ws[address].s = performanceHeaderStyle;
        } else {
          ws[address].s = headerStyle;
        }
      }

      const now = new Date();
      const timestamp = format(now, 'yyyyMMdd_HHmm');
      XLSXStyle.writeFile(wb, `판매계획실적_${timestamp}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
      alert('엑셀 출력 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const errors: string[] = [];

      const formattedData = jsonData.map((row: any, index: number) => {
        const rowNum = index + 2; // 헤더 제외하고 2행부터 시작
        const channelName = row['채널']?.toString().trim();

        // 채널 유효성 검사: 기존 채널 테이블의 텍스트와 일치하는지 확인
        if (!channelName) {
          errors.push(`${rowNum}행 [채널]: 값이 누락되었습니다.`);
        } else {
          const matchingChannel = channels.find(c => c.channel_name === channelName);
          if (!matchingChannel) {
            errors.push(`${rowNum}행 [채널]: 등록되지 않은 채널명입니다. (입력값: ${channelName})`);
          }
        }

        const rowData: any = {
          season_year: row['시즌년도']?.toString(),
          season: row['시즌']?.toString(),
          plan_date: row['일자'],
          plan_time: row['시작시간'],
          channel_name: channelName,
          set_item_code: row['세트품번']?.toString(),
          product_name: row['상품명']?.toString(),
          additional_composition: row['추가구성']?.toString(),
          additional_item_code: row['추가품번']?.toString(),
          sale_price: Number(row['판매가'] || 0),
          commission_rate: Number(row['수수료'] || 0),
          target_quantity: Number(row['목표'] || 0),
          total_order_quantity: Number(row['총주문수량'] || 0),
          net_order_quantity: Number(row['순주문수량'] || 0),
          total_sales: Number(row['총매출'] || 0),
          net_sales: Number(row['순매출'] || 0),
          achievement_rate: Number(row['달성율'] || 0),
          pre_order_rate: Number(row['미리주문%'] || 0),
          total_achievement_rate: Number(row['종합달성률%'] || 0),
          size_85: Number(row['사이즈수량(85)'] || 0),
          size_90: Number(row['사이즈수량(90)'] || 0),
          size_95: Number(row['사이즈수량(95)'] || 0),
          size_100: Number(row['사이즈수량(100)'] || 0),
          size_105: Number(row['사이즈수량(105)'] || 0),
          size_110: Number(row['사이즈수량(110)'] || 0),
          size_115: Number(row['사이즈수량(115)'] || 0),
          size_120: Number(row['사이즈수량(120)'] || 0),
        };

        // ID(UUID)가 있는 경우 포함 (업데이트용), 없는 경우 생략 (신규 등록용)
        if (row['ID']) {
          rowData.id = row['ID'];
        }

        return rowData;
      });

      if (errors.length > 0) {
        // 에러가 너무 많으면 상위 10개만 표시
        const displayErrors = errors.length > 10
          ? [...errors.slice(0, 10), `...외 ${errors.length - 10}건의 오류가 더 있습니다.`]
          : errors;
        setErrorMessage(displayErrors.join('\n'));
        setShowErrorModal(true);
        return;
      }

      const { error } = await supabase
        .from('sales_plans_with_performance')
        .upsert(formattedData, { onConflict: 'id' });

      if (error) throw error;

      setShowSuccessModal(true);
      fetchData();
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(err instanceof Error ? err.message : '업로드 중 알 수 없는 오류가 발생했습니다.');
      setShowErrorModal(true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '원';
  };

  const handleEdit = (e: React.MouseEvent, plan: ISalesPlanWithPerformance) => {
    e.stopPropagation();
    setIsEditMode(true);
    setSelectedPlan(plan);
    setIsRegistrationModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    setDeleteTargetId(planId);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const { error } = await supabase
        .from('sales_plans_with_performance')
        .delete()
        .eq('id', deleteTargetId);

      if (error) throw error;

      setDeleteTargetId(null);
      setShowSuccessModal(true);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('sales_plans_with_performance')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      setIsBulkDeleteModalOpen(false);
      setIsDeleteMode(false);
      setSelectedIds(new Set());
      setShowSuccessModal(true);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(plan => plan.id)));
    }
  };

  const handleModalClose = () => {
    setIsRegistrationModalOpen(false);
    setIsEditMode(false);
    setSelectedPlan(undefined);
  };

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const getAchievementColor = (rate: number) => {
    if (rate >= 100) return 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400';
    if (rate >= 80) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400';
    if (rate >= 50) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400';
    return 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400';
  };

  const filteredPlans = data.filter(plan => {
    if (searchTerm === '') return true;

    const searchValue = searchTerm.toLowerCase();
    return (
      (searchFilters.season && plan.season?.toLowerCase().includes(searchValue)) ||
      (searchFilters.channel && plan.channel_name?.toLowerCase().includes(searchValue)) ||
      (searchFilters.productName && plan.product_name?.toLowerCase().includes(searchValue)) ||
      (searchFilters.setId && plan.set_item_code?.toLowerCase().includes(searchValue))
    );
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800">오류 발생</h3>
            <p className="mt-2 text-sm text-red-700">{error.message}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full px-2 sm:px-4">
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
            <h3 className="text-lg font-semibold text-foreground">
              판매실적 목록
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.season}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, season: e.target.checked }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">시즌</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.channel}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, channel: e.target.checked }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">채널</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.productName}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, productName: e.target.checked }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">상품명</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters.setId}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, setId: e.target.checked }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">세트품번</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="pl-10 pr-4 py-2 border border-border rounded-lg w-64 md:w-80 text-sm bg-card text-foreground"
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

              {/* 삭제 버튼 이동 */}
              <div className="border-l border-border pl-4 flex gap-2">
                {!isDeleteMode ? (
                  <button
                    onClick={() => {
                      setIsDeleteMode(true);
                      setExpandedRows(new Set());
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-all shadow-sm"
                  >
                    삭제
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsDeleteMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium transition-all shadow-sm"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedIds.size === 0}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                    >
                      모두 삭제
                    </button>
                  </>
                )}
              </div>

              {/* 엑셀 통합 버튼 및 드롭다운 */}
              <div className="relative border-l border-border pl-4" ref={excelMenuRef}>
                {/* <button
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
                </button> */}

                {isExcelMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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

              {/* <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                계획 추가
              </button> */}
            </div>
          </div>

          {/* 전체 선택 (삭제 모드일 때만 표시) */}
          {isDeleteMode && (
            <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 transition duration-150 ease-in-out"
                />
                <span className="ml-2 text-sm font-medium text-foreground">전체선택 ({selectedIds.size}개 선택됨)</span>
              </label>
            </div>
          )}

          {/* 카드형 리스트 */}
          <div className="p-4 space-y-3">
            {data.map((plan) => {
              const isExpanded = expandedRows.has(plan.id);
              const achievementRate = plan.achievement_rate || 0;

              return (
                <div
                  key={plan.id}
                  className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* 기본 정보 행 */}
                  <div
                    className="flex items-center p-4 cursor-pointer hover:bg-muted"
                    onClick={() => isDeleteMode ? toggleSelectItem(plan.id) : toggleRow(plan.id)}
                  >
                    {/* 삭제 모드일 때의 체크박스 */}
                    {isDeleteMode && (
                      <div className="flex-shrink-0 mr-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(plan.id)}
                          onChange={() => toggleSelectItem(plan.id)}
                          className="form-checkbox h-5 w-5 text-red-600 rounded border-gray-300 transition duration-150 ease-in-out"
                        />
                      </div>
                    )}

                    {/* 확장 아이콘 */}
                    {!isDeleteMode && (
                      <div className="flex-shrink-0 mr-3">
                        <svg
                          className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}

                    {/* 핵심 정보 */}
                    <div className="flex-1 flex items-center text-sm min-w-0">
                      {/* 왼쪽 그룹: 시즌, 일자, 채널 (고정 너비) */}
                      <div className="flex items-center gap-4 w-[320px] flex-shrink-0">
                        {/* 시즌 */}
                        <div className="w-16 flex-shrink-0">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 w-full justify-center">
                            {plan.season_year ? `${plan.season_year.slice(-2)}${plan.season || ''}` : '-'}
                          </span>
                        </div>

                        {/* 일자 */}
                        <div className="text-foreground font-semibold w-28 flex-shrink-0">
                          {plan.plan_date ? format(new Date(plan.plan_date), 'yy/MM/dd') : '-'}
                          <span className="text-muted-foreground ml-2 text-xs">{plan.plan_time?.substring(0, 5)}</span>
                        </div>

                        {/* 채널 */}
                        <div className="w-24 flex-shrink-0">
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 w-full justify-center">
                            {plan.channel_name}
                          </span>
                        </div>
                      </div>

                      {/* 중앙: 상품명 (남은 공간 모두 차지) */}
                      <div className="flex-1 font-semibold text-foreground px-4 min-w-0">
                        {plan.product_name}
                      </div>

                      {/* 오른쪽 그룹: 수량 정보 (고정 너비로 정렬 유지) */}
                      <div className="flex items-center gap-4 flex-shrink-0 w-[420px] justify-end">
                        {/* 목표 */}
                        <div className="w-20 text-center">
                          <div className="text-[10px] text-muted-foreground mb-0.5">목표</div>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-bold bg-muted text-foreground w-full justify-center">
                            {plan.target_quantity?.toLocaleString()}
                          </span>
                        </div>

                        {/* 총주문 */}
                        <div className="w-20 text-center">
                          <div className="text-[10px] text-muted-foreground mb-0.5">총주문</div>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 w-full justify-center">
                            {plan.total_order_quantity?.toLocaleString()}
                          </span>
                        </div>

                        {/* 순주문 */}
                        <div className="w-20 text-center">
                          <div className="text-[10px] text-muted-foreground mb-0.5">순주문</div>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 w-full justify-center">
                            {plan.net_order_quantity?.toLocaleString()}
                          </span>
                        </div>

                        {/* 달성률 */}
                        <div className="w-24 text-center">
                          <div className="text-[10px] text-muted-foreground mb-0.5">달성률</div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-bold ${getAchievementColor(achievementRate)} w-full justify-center`}>
                            {achievementRate.toFixed(1)}%
                          </span>
                        </div>

                        {/* 관리 버튼 */}
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(e, plan);
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
                              handleDelete(e, plan.id as any);
                            }}
                            className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-all"
                            title="삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 확장된 상세 정보 */}
                  {isExpanded && (
                    <div className="border-t border-border bg-gradient-to-br from-muted to-blue-50/30 dark:to-blue-950/20 p-6 animate-in slide-in-from-top-2 duration-200">
                      {/* 상단: 상품, 판매, 실적 정보 */}
                      <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* 상품 정보 */}
                        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            상품 정보
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">세트품번</span>
                              <span className="font-medium text-foreground">{plan.set_item_code || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">추가구성</span>
                              <span className="font-medium text-foreground break-words text-right max-w-[200px]">
                                {plan.additional_composition || '-'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">추가품번</span>
                              <span className="font-medium text-foreground">{plan.additional_item_code || '-'}</span>
                            </div>
                          </div>
                        </div>

                        {/* 판매 정보 */}
                        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            판매 정보
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">판매가</span>
                              <span className="font-bold text-emerald-600">{plan.sale_price?.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">수수료</span>
                              <span className="font-medium text-foreground">{plan.commission_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">총매출</span>
                              <span className="font-bold text-indigo-600">{plan.total_sales?.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">순매출</span>
                              <span className="font-bold text-blue-600">{plan.net_sales?.toLocaleString()}원</span>
                            </div>
                          </div>
                        </div>

                        {/* 실적 정보 */}
                        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            실적 정보
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">총주문수량</span>
                              <span className="font-semibold text-foreground">{plan.total_order_quantity?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">순주문수량</span>
                              <span className="font-semibold text-foreground">{plan.net_order_quantity?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">미리주문%</span>
                              <span className="font-semibold text-purple-600">{plan.pre_order_rate?.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">종합달성률%</span>
                              <span className={`font-bold ${getAchievementColor(plan.total_achievement_rate || 0)} px-2 py-0.5 rounded`}>
                                {plan.total_achievement_rate?.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 하단: 사이즈별 수량 */}
                      <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                          <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          사이즈별 수량
                        </h4>
                        <div className="grid grid-cols-8 gap-3">
                          {[
                            { label: '85(XS)', value: plan.size_85 || 0 },
                            { label: '90(S)', value: plan.size_90 || 0 },
                            { label: '95(M)', value: plan.size_95 || 0 },
                            { label: '100(L)', value: plan.size_100 || 0 },
                            { label: '105(XL)', value: plan.size_105 || 0 },
                            { label: '110(XXL)', value: plan.size_110 || 0 },
                            { label: '115(3XL)', value: plan.size_115 || 0 },
                            { label: '120(4XL)', value: plan.size_120 || 0 },
                          ].map((size, idx) => {
                            const total = (plan.size_85 || 0) + (plan.size_90 || 0) + (plan.size_95 || 0) +
                              (plan.size_100 || 0) + (plan.size_105 || 0) + (plan.size_110 || 0) +
                              (plan.size_115 || 0) + (plan.size_120 || 0);
                            const percentage = total > 0 ? ((size.value / total) * 100).toFixed(1) : '0.0';

                            return (
                              <div
                                key={idx}
                                className="text-center p-3 rounded-lg border-2 transition-all bg-muted border-border"
                              >
                                <div className="text-xs font-bold mb-1 text-muted-foreground">
                                  {size.label}
                                </div>
                                <div className="text-base font-bold text-foreground">
                                  {size.value.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {percentage}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-card px-4 py-3 flex items-center justify-center border-t border-border">
            <nav className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted border border-border disabled:opacity-50"
              >
                이전
              </button>
              <span className="mx-4 text-sm text-foreground">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages || totalPages === 0}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted border border-border disabled:opacity-50"
              >
                다음
              </button>
            </nav>
          </div>
        </div>
      </div>

      {isRegistrationModalOpen && (
        isEditMode && selectedPlan ? (
          <SalesCombinedEditModal
            isOpen={isRegistrationModalOpen}
            onClose={handleModalClose}
            onSuccess={() => {
              fetchData();
              handleModalClose();
            }}
            editData={selectedPlan}
            channels={channels}
          />
        ) : (
          <SalesPlanRegistrationModal
            isOpen={isRegistrationModalOpen}
            onClose={handleModalClose}
            onSuccess={() => {
              fetchData();
              handleModalClose();
            }}
            editData={undefined}
            channels={channels}
          />
        )
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="판매계획 삭제"
        description={`정말로 이 판매계획을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
      />

      <DeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        title="선택 항목 삭제"
        description={`선택한 ${selectedIds.size}개의 항목을 정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="처리 완료"
        description="성공적으로 처리되었습니다."
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="업로드 실패"
        description={errorMessage}
      />
    </DashboardLayout>
  );
}
