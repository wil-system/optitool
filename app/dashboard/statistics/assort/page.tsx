'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import DateRangePicker from '@/app/components/statistics/DateRangePicker';
import PeriodSelector from '@/app/components/statistics/PeriodSelector';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart } from '@/components/chart-blocks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TableIcon, BarChart3, ChevronRight, ChevronLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

interface IAssortData {
  product_name: string;
  set_product_code: string;
  operation_count: number;
  total_qty: number;
  size_85: number;
  size_90: number;
  size_95: number;
  size_100: number;
  size_105: number;
  size_110: number;
  size_115: number;
  size_120: number;
  assort_85: number;
  assort_90: number;
  assort_95: number;
  assort_100: number;
  assort_105: number;
  assort_110: number;
  assort_115: number;
  assort_120: number;
}

interface GroupedStatistics {
  [date: string]: IAssortData[];
}

export default function AssortStatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [chartViews, setChartViews] = useState<Record<string, boolean>>({});
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [statistics, setStatistics] = useState<GroupedStatistics>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  // 데이터 fetch 함수 - period와 날짜 범위에 따라 데이터를 가져옴
  const fetchStatistics = async () => {
    if (period === 'custom' && (!startDate || !endDate)) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'custom' && startDate && endDate) {
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/statistics/assort?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || '데이터 조회 실패');
      
      // 날짜를 기준으로 내림차순 정렬 (최신 날짜가 위로)
      const sortedData = Object.fromEntries(
        Object.entries(data as Record<string, IAssortData[]>)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      ) as GroupedStatistics;
      
      setStatistics(sortedData);
      setCurrentPage(1); // 데이터가 바뀌면 항상 첫 페이지로
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
      setStatistics({});
    } finally {
      setIsLoading(false);
    }
  };

  // 기간 변경 핸들러 - 상태만 업데이트하고 useEffect에서 fetch 처리
  const handlePeriodChange = (newPeriod: 'daily' | 'monthly' | 'yearly' | 'custom') => {
    setPeriod(newPeriod);
    setStatistics({});
    setCurrentPage(1);
    
    if (newPeriod === 'custom') {
      setStartDate(null);
      setEndDate(null);
    }
  };

  // 사용자 지정 기간 검색
  const handleSearch = () => {
    if (period === 'custom' && (!startDate || !endDate)) {
      alert('기간을 선택해주세요.');
      return;
    }
    fetchStatistics();
  };

  // period가 변경될 때마다 데이터를 자동으로 가져옴 (custom 제외)
  useEffect(() => {
    if (period !== 'custom') {
      fetchStatistics();
    }
  }, [period]);

  const toggleChart = (date: string) => {
    setChartViews(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const handleExportExcel = async () => {
    setIsLoading(true);
    try {
      const workbook = XLSX.utils.book_new();
      const periods: ('daily' | 'monthly' | 'yearly')[] = ['daily', 'monthly', 'yearly'];
      const sheetNames = ['일간', '월간', '년간'];

      for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        const params = new URLSearchParams({ period: p });
        if (startDate && endDate) {
          params.append('startDate', startDate.toISOString());
          params.append('endDate', endDate.toISOString());
        }

        const response = await fetch(`/api/statistics/assort?${params}`);
        const data = await response.json();
        if (!response.ok) continue;

        const sortedData = Object.entries(data as Record<string, IAssortData[]>)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));

        const rows: any[] = [];
        const headers = [
          '기간', '상품명', '세트품번', '운영횟수', '총수량',
          '85(XS)', '90(S)', '95(M)', '100(L)', '105(XL)', '110(XXL)', '115(3XL)', '120(4XL)',
          '85(%)', '90(%)', '95(%)', '100(%)', '105(%)', '110(%)', '115(%)', '120(%)'
        ];
        rows.push(headers);

        sortedData.forEach(([date, products]) => {
          const formattedDate = formatDateRange(date, p, startDate, endDate);
          products.forEach((item: IAssortData) => {
            rows.push([
              formattedDate, item.product_name, item.set_product_code, item.operation_count, item.total_qty,
              item.size_85, item.size_90, item.size_95, item.size_100, item.size_105, item.size_110, item.size_115, item.size_120,
              item.assort_85, item.assort_90, item.assort_95, item.assort_100, item.assort_105, item.assort_110, item.assort_115, item.assort_120
            ]);
          });
          rows.push([]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
            if (!worksheet[cell_ref]) continue;
            worksheet[cell_ref].s = {
              alignment: { vertical: 'center', horizontal: 'center' },
              font: { size: 10 },
              border: {
                top: { style: 'thin', color: { rgb: "E2E8F0" } },
                bottom: { style: 'thin', color: { rgb: "E2E8F0" } },
                left: { style: 'thin', color: { rgb: "E2E8F0" } },
                right: { style: 'thin', color: { rgb: "E2E8F0" } }
              }
            };
            // 헤더 스타일 (1행)
            if (R === 0) {
              // 85(%) ~ 120(%) 항목 (인덱스 13~20)은 주황색, 나머지는 연두색
              if (C >= 13 && C <= 20) {
                worksheet[cell_ref].s.fill = { fgColor: { rgb: "FCE4D6" } }; // 연한 주황색
              } else {
                worksheet[cell_ref].s.fill = { fgColor: { rgb: "E2F0D9" } }; // 연두색 배경
              }
              worksheet[cell_ref].s.font = { bold: true, size: 11 };
            }
          }
        }
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetNames[i]);
      }
      XLSX.writeFile(workbook, `아소트통계_종합_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    } catch (error) {
      console.error('엑셀 출력 중 오류:', error);
      alert('엑셀 출력 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = (products: IAssortData[]) => {
    return (
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="font-semibold w-[200px]">상품명</TableHead>
              <TableHead className="text-right font-semibold w-[100px]">운영횟수</TableHead>
              <TableHead className="text-right font-semibold w-[100px]">총수량</TableHead>
              {['85(XS)', '90(S)', '95(M)', '100(L)', '105(XL)', '110(XXL)', '115(3XL)', '120(4XL)'].map(size => (
                <TableHead key={size} className="text-center font-semibold bg-blue-50/50 dark:bg-blue-950/30 w-[80px]">{size}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((item, idx) => (
              <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium truncate">
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate" title={item.product_name}>{item.product_name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{item.set_product_code}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.operation_count}회</TableCell>
                <TableCell className="text-right font-bold text-primary">{item.total_qty?.toLocaleString()}</TableCell>
                {[
                  { qty: item.size_85, pct: item.assort_85 },
                  { qty: item.size_90, pct: item.assort_90 },
                  { qty: item.size_95, pct: item.assort_95 },
                  { qty: item.size_100, pct: item.assort_100 },
                  { qty: item.size_105, pct: item.assort_105 },
                  { qty: item.size_110, pct: item.assort_110 },
                  { qty: item.size_115, pct: item.assort_115 },
                  { qty: item.size_120, pct: item.assort_120 },
                ].map((size, sIdx) => (
                  <TableCell key={sIdx} className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">{size.qty?.toLocaleString()}</span>
                      <span className="text-[10px] text-blue-600 font-bold">{size.pct}%</span>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderChart = (products: IAssortData[]) => {
    // 상품별로 데이터를 합산하여 전체 아소트 비율 계산
    const totalSizes = products.reduce((acc, curr) => {
      acc.size_85 += curr.size_85;
      acc.size_90 += curr.size_90;
      acc.size_95 += curr.size_95;
      acc.size_100 += curr.size_100;
      acc.size_105 += curr.size_105;
      acc.size_110 += curr.size_110;
      acc.size_115 += curr.size_115;
      acc.size_120 += curr.size_120;
      return acc;
    }, {
      size_85: 0, size_90: 0, size_95: 0, size_100: 0, size_105: 0, size_110: 0, size_115: 0, size_120: 0
    });

    const chartData = [
      { name: '85(XS)', value: totalSizes.size_85 },
      { name: '90(S)', value: totalSizes.size_90 },
      { name: '95(M)', value: totalSizes.size_95 },
      { name: '100(L)', value: totalSizes.size_100 },
      { name: '105(XL)', value: totalSizes.size_105 },
      { name: '110(XXL)', value: totalSizes.size_110 },
      { name: '115(3XL)', value: totalSizes.size_115 },
      { name: '120(4XL)', value: totalSizes.size_120 },
    ].filter(d => d.value > 0);

    return (
      <div className="py-4 flex justify-center">
        <div className="w-full max-w-2xl">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground text-center">전체 사이즈별 아소트 비율</h4>
          <PieChart 
            data={chartData} 
            height={400}
            showLegend={true}
            showLabel={true}
            labelPosition="outside"
          />
        </div>
      </div>
    );
  };

  const formatDateRange = (date: string, period: string, startDate: Date | null, endDate: Date | null) => {
    if (period === 'custom' && startDate && endDate) {
      return `${format(startDate, 'yyyy년 MM월 dd일')} ~ ${format(endDate, 'yyyy년 MM월 dd일')}`;
    }
    switch (period) {
      case 'yearly': return `${date}년`;
      case 'monthly': {
        const [year, month] = date.split('-');
        return `${year}년 ${month}월`;
      }
      case 'daily': return format(new Date(date), 'yyyy년 MM월 dd일');
      default: return date;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">아소트 통계</h1>
          <p className="text-muted-foreground">상품별 사이즈 판매 비중(아소트)을 확인하세요</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <PeriodSelector period={period} onPeriodChange={handlePeriodChange} />
            {period === 'custom' && (
              <>
                <DateRangePicker 
                  startDate={startDate} 
                  endDate={endDate} 
                  onStartDateChange={setStartDate} 
                  onEndDateChange={setEndDate} 
                />
                <Button onClick={handleSearch}>검색</Button>
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            className="bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" 
            onClick={handleExportExcel} 
            disabled={Object.keys(statistics).length === 0}
          >
            <Download className="w-4 h-4 mr-2" /> 엑셀 출력
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : Object.keys(statistics).length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">표시할 데이터가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {(() => {
              const entries = Object.entries(statistics);
              const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));
              const safePage = Math.min(Math.max(1, currentPage), totalPages);
              const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
              const visibleEntries = entries.slice(startIdx, startIdx + ITEMS_PER_PAGE);

              return (
                <>
                  {visibleEntries.map(([date, products]) => (
                    <Card key={date}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-xl">{formatDateRange(date, period, startDate, endDate)}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleChart(date)}
                        >
                          {chartViews[date] ? (
                            <>
                              <TableIcon className="h-4 w-4 mr-2" />
                              테이블 보기
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              차트 보기
                            </>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {chartViews[date] ? renderChart(products) : renderTable(products)}
                      </CardContent>
                    </Card>
                  ))}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                        disabled={safePage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />이전
                      </Button>
                      <div className="text-sm text-muted-foreground">{safePage} / {totalPages}</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                        disabled={safePage === totalPages}
                      >
                        다음<ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
