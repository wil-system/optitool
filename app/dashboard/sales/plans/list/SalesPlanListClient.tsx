'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { format } from 'date-fns';
import SalesPlanRegistrationModal from '@/app/components/sales/SalesPlanRegistrationModal';
import SalesPerformanceRegistrationModal from '@/app/components/sales/SalesPerformanceRegistrationModal';
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

export default function SalesPlanListClient({ initialData, channels: initialChannels, categories: initialCategories, setIds }: Props) {
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
        excludeWithPerformance: 'true'
      });
      
      const [plansResponse, channelsResponse, setsResponse] = await Promise.all([
        fetch(`/api/sales/plans/with-performance?${params}`),
        fetch('/api/channels?size=1000'), // 채널은 페이징 없이 충분히 많이 가져옴
        fetch('/api/sets?size=1000') // 세트 목록 가져오기
      ]);
      
      if (!plansResponse.ok || !channelsResponse.ok || !setsResponse.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const [plansResult, channelsResult, setsResult] = await Promise.all([
        plansResponse.json(),
        channelsResponse.json(),
        setsResponse.json()
      ]);

      console.log('Fetched sets:', setsResult.data?.length); // 디버깅용 로그

      setData(plansResult.data || []);
      setTotalPages(plansResult.totalPages || 1);
      setChannels(channelsResult.data || []);
      setSets(setsResult.data || []);
      
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
        const rawSetItemCode = row['세트품번'];
        const setItemCode = rawSetItemCode?.toString().trim();
        const channelName = row['채널']?.toString().trim();
        let productName = row['상품명']?.toString();

        // 필수 필드 검증
        if (!row['일자']) errors.push(`${rowNum}행 [일자]: 값이 누락되었습니다.`);
        if (!channelName) {
          errors.push(`${rowNum}행 [채널]: 값이 누락되었습니다.`);
        } else {
          // 채널 유효성 검사: 기존 채널 테이블의 텍스트와 일치하는지 확인
          const matchingChannel = channels.find(c => c.channel_name === channelName);
          if (!matchingChannel) {
            errors.push(`${rowNum}행 [채널]: 등록되지 않은 채널명입니다. (입력값: ${channelName})`);
          }
        }
        if (!setItemCode) errors.push(`${rowNum}행 [세트품번]: 값이 누락되었습니다.`);

        // 날짜 형식 검증 (일자가 있는 경우)
        if (row['일자']) {
          const dateValue = row['일자'];
          const dateStr = dateValue.toString();
          
          // 날짜 형식이 유효한지 확인
          if (dateStr && isNaN(Date.parse(dateStr))) {
            errors.push(`${rowNum}행 [일자]: 날짜 형식이 올바르지 않습니다. (입력값: ${dateStr})`);
          }
        }

        // 숫자 필드 검증
        const numberFields = [
          { key: '판매가', value: row['판매가'] },
          { key: '수수료', value: row['수수료'] },
          { key: '목표', value: row['목표'] }
        ];

        numberFields.forEach(field => {
          if (field.value && isNaN(Number(field.value))) {
            errors.push(`${rowNum}행 [${field.key}]: 숫자 형식이 아닙니다. (입력값: ${field.value})`);
          }
        });

        // 상품명이 없고 세트품번이 있는 경우, setIds에서 해당 세트의 이름을 찾아 대체
        if (!productName && setItemCode) {
          // 세트품번을 문자열로 비교 (엑셀에서 숫자로 읽힐 수 있으므로 toString() 후 trim())
          const matchingSet = sets.find(s => {
            const sid = s.set_id?.toString().trim();
            return sid === setItemCode;
          });
          
          if (matchingSet) {
            productName = matchingSet.set_name;
          } else {
            errors.push(`${rowNum}행 [세트품번]: 시스템에 등록되지 않은 세트품번입니다. (입력값: ${setItemCode}, 로드된 세트: ${sets.length}건)`);
          }
        }

        // 날짜 변환 함수 (엑셀 시리얼 날짜를 YYYY-MM-DD 형식으로 변환)
        const convertExcelDate = (dateValue: any): string | null => {
          if (!dateValue) return null;
          
          // 이미 문자열 형식인 경우 (YYYY-MM-DD 등)
          if (typeof dateValue === 'string') {
            // 날짜 구분자 통일 (., /, - 등을 - 로 변환)
            const normalized = dateValue.replace(/[./]/g, '-');
            const parsed = new Date(normalized);
            if (!isNaN(parsed.getTime())) {
              return parsed.toISOString().split('T')[0];
            }
            return normalized;
          }
          
          // 엑셀 시리얼 날짜 (숫자)인 경우
          if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
            return jsDate.toISOString().split('T')[0];
          }
          
          // Date 객체인 경우
          if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
          }
          
          return null;
        };

        // 시간 변환 함수 (다양한 형식을 HH:MM:SS 형식으로 변환)
        const convertExcelTime = (timeValue: any): string | null => {
          if (!timeValue) return null;
          
          // 문자열인 경우 (HH:MM, HH:MM:SS 등)
          if (typeof timeValue === 'string') {
            const cleaned = timeValue.trim();
            // HH:MM 형식이면 :SS 추가
            if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
              return cleaned + ':00';
            }
            // 이미 HH:MM:SS 형식
            if (/^\d{1,2}:\d{2}:\d{2}$/.test(cleaned)) {
              return cleaned;
            }
            return cleaned;
          }
          
          // 엑셀 시리얼 시간 (0~1 사이의 소수)인 경우
          if (typeof timeValue === 'number' && timeValue < 1) {
            const totalSeconds = Math.round(timeValue * 86400);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          }
          
          return null;
        };

        const rowData: any = {
          season_year: row['시즌년도']?.toString(),
          season: row['시즌']?.toString(),
          plan_date: convertExcelDate(row['일자']),
          plan_time: convertExcelTime(row['시작시간']),
          channel_name: channelName,
          set_item_code: setItemCode,
          product_name: productName,
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

      // 각 행을 개별적으로 처리하여 상세한 오류 정보 수집
      let successCount = 0;
      let failCount = 0;
      const uploadErrors: string[] = [];

      for (let i = 0; i < formattedData.length; i++) {
        const rowData = formattedData[i];
        const rowNum = i + 2; // 엑셀 행 번호 (헤더 제외)

        try {
          const { error: upsertError } = await supabase
            .from('sales_plans_with_performance')
            .upsert([rowData], { onConflict: 'id' });

          if (upsertError) {
            failCount++;
            console.log(`${rowNum}행 에러 상세:`, upsertError); // 디버깅용
            
            // Supabase 에러 메시지 파싱하여 컬럼명 추출
            let errorDetail = upsertError.message;
            let columnName = '';
            let problemValue = '';
            
            // 다양한 패턴으로 컬럼명 추출 시도
            const columnMatch = 
              errorDetail.match(/column "([^"]+)"/i) || 
              errorDetail.match(/Key \(([^)]+)\)/i) ||
              errorDetail.match(/for type ([^\s]+)/i);
            
            if (columnMatch) {
              const dbColumn = columnMatch[1];
              // DB 컬럼명을 한글 필드명으로 매핑
              const columnMap: { [key: string]: string } = {
                'plan_date': '일자',
                'channel_name': '채널',
                'set_item_code': '세트품번',
                'product_name': '상품명',
                'sale_price': '판매가',
                'commission_rate': '수수료',
                'target_quantity': '목표',
                'plan_time': '시작시간',
                'season_year': '시즌년도',
                'season': '시즌',
                'id': 'ID'
              };
              columnName = columnMap[dbColumn] || dbColumn;
              
              // 해당 컬럼의 실제 값 가져오기
              const dbColumnToDataKey: { [key: string]: string } = {
                'plan_date': 'plan_date',
                'channel_name': 'channel_name',
                'set_item_code': 'set_item_code',
                'product_name': 'product_name',
                'plan_time': 'plan_time',
                'season_year': 'season_year',
                'season': 'season',
                'id': 'id'
              };
              const dataKey = dbColumnToDataKey[dbColumn];
              if (dataKey && rowData[dataKey]) {
                problemValue = ` (입력값: ${rowData[dataKey]})`;
              }
            }
            
            // 일반적인 DB 에러 메시지를 사용자 친화적으로 변환
            if (errorDetail.includes('duplicate key')) {
              errorDetail = columnName ? `[${columnName}] 중복된 값입니다.${problemValue}` : `ID가 중복되었습니다.${problemValue}`;
            } else if (errorDetail.includes('violates foreign key')) {
              errorDetail = columnName ? `[${columnName}] 참조 데이터가 존재하지 않습니다.${problemValue}` : `참조 데이터가 존재하지 않습니다.${problemValue}`;
            } else if (errorDetail.includes('violates not-null') || errorDetail.includes('null value')) {
              errorDetail = columnName ? `[${columnName}] 필수 값이 누락되었습니다.` : '필수 값이 누락되었습니다.';
            } else if (errorDetail.includes('invalid input syntax')) {
              // "invalid input syntax for type uuid" 같은 메시지에서 타입 추출
              const typeMatch = errorDetail.match(/for (?:type )?(\w+)/i);
              const dataType = typeMatch ? typeMatch[1] : '';
              
              if (dataType === 'uuid' || dataType === 'UUID') {
                errorDetail = columnName ? `[${columnName}] UUID 형식이 올바르지 않습니다.${problemValue}` : `UUID 형식이 올바르지 않습니다.${problemValue}`;
              } else if (dataType === 'date') {
                errorDetail = columnName ? `[${columnName}] 날짜 형식이 올바르지 않습니다.${problemValue}` : `날짜 형식이 올바르지 않습니다.${problemValue}`;
              } else if (dataType === 'time') {
                errorDetail = columnName ? `[${columnName}] 시간 형식이 올바르지 않습니다.${problemValue}` : `시간 형식이 올바르지 않습니다.${problemValue}`;
              } else {
                errorDetail = columnName ? `[${columnName}] 데이터 형식(${dataType})이 올바르지 않습니다.${problemValue}` : `데이터 형식이 올바르지 않습니다.${problemValue}`;
              }
            } else if (errorDetail.includes('numeric field overflow')) {
              errorDetail = columnName ? `[${columnName}] 숫자 값이 허용 범위를 초과했습니다.${problemValue}` : `숫자 값이 허용 범위를 초과했습니다.${problemValue}`;
            } else if (errorDetail.includes('value too long')) {
              errorDetail = columnName ? `[${columnName}] 입력값이 너무 깁니다.${problemValue}` : `입력값이 너무 깁니다.${problemValue}`;
            } else if (columnName) {
              // 기타 오류이지만 컬럼명을 추출한 경우
              errorDetail = `[${columnName}] ${errorDetail}${problemValue}`;
            } else {
              // 컬럼명을 추출하지 못한 경우 원본 에러 메시지 표시
              errorDetail = `${errorDetail}`;
            }
            
            uploadErrors.push(`${rowNum}행: ${errorDetail}`);
          } else {
            successCount++;
          }
        } catch (err) {
          failCount++;
          console.log(`${rowNum}행 예외 발생:`, err); // 디버깅용
          const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
          uploadErrors.push(`${rowNum}행: ${errorMsg}`);
        }
      }

      // 결과 표시
      if (uploadErrors.length > 0) {
        const summary = `업로드 완료: 성공 ${successCount}건, 실패 ${failCount}건\n\n실패 사유:\n`;
        const displayErrors = uploadErrors.length > 10 
          ? [...uploadErrors.slice(0, 10), `...외 ${uploadErrors.length - 10}건의 오류가 더 있습니다.`]
          : uploadErrors;
        setErrorMessage(summary + displayErrors.join('\n'));
        setShowErrorModal(true);
      } else {
        setShowSuccessModal(true);
      }

      if (successCount > 0) {
        fetchData();
      }
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

  const handleModalClose = () => {
    setIsRegistrationModalOpen(false);
    setIsEditMode(false);
    setSelectedPlan(undefined);
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
              판매계획 목록
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

              {/* 엑셀 통합 버튼 및 드롭다운 */}
              <div className="relative border-l border-border pl-4" ref={excelMenuRef}>
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
              
              <button
                onClick={() => setIsRegistrationModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                계획 추가
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border table-fixed">
              <thead className="bg-muted">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[6%]">시즌</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[8%]">일자</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[6%]">시작시간</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[8%]">채널</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10%]">세트품번</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">상품명</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[10%]">추가구성</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[9%]">추가품번</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-[8%]">판매가</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-[5%]">수수료</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-[7%]">목표</th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-[8%]">관리</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {data.map((plan) => (
                  <tr 
                    key={plan.id} 
                    className={`hover:bg-accent text-xs ${selectedPlan?.id === plan.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                  >
                    <td className="px-2 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      {plan.season_year ? `${plan.season_year.slice(-2)}${plan.season || ''}` : '-'}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      {plan.plan_date ? format(new Date(plan.plan_date), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap overflow-hidden text-ellipsis">{plan.plan_time?.substring(0, 5)}</td>
                    <td className="px-2 py-4 whitespace-nowrap overflow-hidden text-ellipsis">{plan.channel_name}</td>
                    <td className="px-2 py-4 whitespace-nowrap overflow-hidden text-ellipsis">{plan.set_item_code}</td>
                    <td className="px-2 py-4 whitespace-nowrap overflow-hidden text-ellipsis" title={plan.product_name || ''}>{plan.product_name}</td>
                    <td className="px-2 py-4 whitespace-nowrap overflow-hidden text-ellipsis" title={plan.additional_composition || ''}>{plan.additional_composition || '-'}</td>
                    <td className="px-2 py-4 whitespace-nowrap overflow-hidden text-ellipsis">{plan.additional_item_code || '-'}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-right overflow-hidden text-ellipsis">{plan.sale_price?.toLocaleString()}원</td>
                    <td className="px-2 py-4 whitespace-nowrap text-right overflow-hidden text-ellipsis">{plan.commission_rate}%</td>
                    <td className="px-2 py-4 whitespace-nowrap text-right overflow-hidden text-ellipsis">{plan.target_quantity?.toLocaleString()}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(plan);
                            setIsPerformanceModalOpen(true);
                          }}
                          className="p-1.5 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-600 hover:text-white transition-all"
                          title="실적등록"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </button>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <SalesPlanRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={handleModalClose}
          onSuccess={() => {
            fetchData();
            handleModalClose();
          }}
          editData={isEditMode ? selectedPlan : undefined}
          channels={channels}
        />
      )}

      {isPerformanceModalOpen && selectedPlan && (
        <SalesPerformanceRegistrationModal
          isOpen={isPerformanceModalOpen}
          onClose={() => {
            setIsPerformanceModalOpen(false);
            setSelectedPlan(undefined);
          }}
          onSuccess={() => {
            fetchData();
            setIsPerformanceModalOpen(false);
            setSelectedPlan(undefined);
          }}
          planData={selectedPlan}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="판매계획 삭제"
        description={`정말로 이 판매계획을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`}
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
