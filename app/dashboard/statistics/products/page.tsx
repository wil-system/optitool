'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import DateRangePicker from '@/app/components/statistics/DateRangePicker';
import PeriodSelector from '@/app/components/statistics/PeriodSelector';
import { BarChart, PieChart } from '@/components/chart-blocks';
import { IProductStatistics } from '@/app/types/statistics';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TableIcon, ChevronDown, ChevronRight, ChevronLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

interface GroupedStatistics {
  [date: string]: IProductStatistics[];
}

export default function ProductStatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [chartViews, setChartViews] = useState<Record<string, boolean>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
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

      const response = await fetch(`/api/statistics/products?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || '데이터 조회 실패');
      
      // 날짜를 기준으로 내림차순 정렬 (최신 날짜가 위로)
      const sortedData = Object.fromEntries(
        Object.entries(data as Record<string, IProductStatistics[]>)
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

  const toggleProduct = (date: string, productCode: string) => {
    const key = `${date}_${productCode}`;
    setExpandedProducts(prev => ({
      ...prev,
      [key]: !prev[key]
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

        const response = await fetch(`/api/statistics/products?${params}`);
        const data = await response.json();
        if (!response.ok) continue;

        const sortedData = Object.entries(data as Record<string, IProductStatistics[]>)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));

        const rows: any[] = [];
        // 헤더 정의
        const headers = ['기간', '상품명', '세트번호', '채널명', '운영횟수', '목표', '총주문', '순주문', '총매출', '순매출', '달성률(%)', '종합달성률(%)', '점유율(%)'];
        rows.push(headers);

        sortedData.forEach(([date, products]) => {
          const formattedDate = formatDateRange(date, p, startDate, endDate);
          
          const productGroups = products.reduce((acc, product) => {
            const key = product.set_product_code;
            if (!acc[key]) {
              acc[key] = {
                product_name: product.product_name,
                set_product_code: product.set_product_code,
                channels: [],
                total: {
                  operation_count: 0, target: 0, total_order: 0, performance: 0, total_sales: 0, sales_amount: 0,
                  achievement_rate_sum: 0, total_achievement_rate_sum: 0,
                }
              };
            }
            acc[key].channels.push(product);
            acc[key].total.operation_count += product.operation_count;
            acc[key].total.target += product.target;
            acc[key].total.total_order += product.total_order;
            acc[key].total.performance += product.performance;
            acc[key].total.total_sales += product.total_sales;
            acc[key].total.sales_amount += product.sales_amount;
            acc[key].total.achievement_rate_sum += (product.achievement_rate || 0);
            acc[key].total.total_achievement_rate_sum += (product.total_achievement_rate || 0);
            return acc;
          }, {} as Record<string, any>);

          Object.values(productGroups).forEach((group: any) => {
            // 상품 합계 행
            rows.push([
              formattedDate,
              group.product_name,
              group.set_product_code,
              '--- 상품 합계 ---',
              group.total.operation_count,
              group.total.target,
              group.total.total_order,
              group.total.performance,
              group.total.total_sales,
              group.total.sales_amount,
              (group.total.achievement_rate_sum / group.channels.length).toFixed(1),
              (group.total.total_achievement_rate_sum / group.channels.length).toFixed(1),
              '' // 합계행 점유율 비움
            ]);

            // 채널별 상세 행
            group.channels.forEach((channel: IProductStatistics) => {
              rows.push([
                formattedDate,
                '',
                '',
                channel.channel,
                channel.operation_count,
                channel.target,
                channel.total_order,
                channel.performance,
                channel.total_sales,
                channel.sales_amount,
                channel.achievement_rate?.toFixed(1),
                channel.total_achievement_rate?.toFixed(1),
                (group.total.sales_amount > 0 ? (channel.sales_amount / group.total.sales_amount * 100) : 0).toFixed(1)
              ]);
            });
            rows.push([]); // 빈 행
          });
        });

        const worksheet = XLSX.utils.aoa_to_sheet(rows);

        // 스타일 적용
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!worksheet[cell_ref]) continue;

            // 기본 스타일
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
              worksheet[cell_ref].s.fill = { fgColor: { rgb: "E2F0D9" } }; // 연두색 배경
              worksheet[cell_ref].s.font = { bold: true, size: 11 };
            }

            // 상품 합계 행 스타일
            const cellValue = worksheet[XLSX.utils.encode_cell({ c: 3, r: R })]?.v;
            if (cellValue === '--- 상품 합계 ---') {
              worksheet[cell_ref].s.fill = { fgColor: { rgb: "F8FAFC" } };
              worksheet[cell_ref].s.font.bold = true;
              if (C === 3) worksheet[cell_ref].s.font.color = { rgb: "3B82F6" };
            }
          }
        }

        // 열 너비 설정
        worksheet['!cols'] = [
          { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 10 },
          { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
          { wch: 12 }, { wch: 12 }, { wch: 10 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetNames[i]);
      }

      const fileName = `상품별통계_종합_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('엑셀 출력 중 오류:', error);
      alert('엑셀 출력 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = (date: string, products: IProductStatistics[]) => {
    // 상품별(세트품번)로 그룹화
    const productGroups = products.reduce((acc, product) => {
      const key = product.set_product_code;
      if (!acc[key]) {
        acc[key] = {
          product_name: product.product_name,
          set_product_code: product.set_product_code,
          channels: [],
          total: {
            operation_count: 0,
            total_order: 0,
            performance: 0,
            total_sales: 0,
            sales_amount: 0,
            target: 0,
            temperature_sum: 0,
            temperature_count: 0,
          }
        };
      }
      acc[key].channels.push(product);
      acc[key].total.operation_count += product.operation_count;
      acc[key].total.total_order += product.total_order;
      acc[key].total.performance += product.performance;
      acc[key].total.total_sales += product.total_sales;
      acc[key].total.sales_amount += product.sales_amount;
      acc[key].total.target += product.target;
      acc[key].total.temperature_sum += product.temperature;
      acc[key].total.temperature_count += 1;
      return acc;
    }, {} as Record<string, {
      product_name: string;
      set_product_code: string;
      channels: IProductStatistics[];
      total: any;
    }>);

    return (
      <div className="space-y-4">
        {Object.values(productGroups).map((group) => {
          const expansionKey = `${date}_${group.set_product_code}`;
          const isExpanded = expandedProducts[expansionKey] ?? false;
          
          return (
            <div key={group.set_product_code} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* 상품 헤더 (기본 뷰 / 요약) */}
              <div 
                className="bg-primary/10 px-6 py-2.5 border-b flex justify-between items-center cursor-pointer hover:bg-primary/15 transition-colors"
                onClick={() => toggleProduct(date, group.set_product_code)}
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-primary" />
                  )}
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-base text-foreground whitespace-nowrap">
                      {group.product_name}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] uppercase tracking-tighter text-primary/70 font-bold">SET</span>
                      <span className="text-xs font-bold text-primary bg-white px-2 py-0.5 rounded border border-primary/20 shadow-sm">
                        {group.set_product_code}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-primary/70 text-xs font-medium">순매출</span>
                    <span className="font-bold text-primary">{group.total.sales_amount.toLocaleString()}원</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-primary/70 text-xs font-medium">종합달성률</span>
                    <span className="font-bold text-green-600">
                      {(group.channels.length > 0 
                        ? (group.channels.reduce((sum, c) => sum + (c.total_achievement_rate || 0), 0) / group.channels.length) 
                        : 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 테이블 */}
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="font-semibold">채널명</TableHead>
                    <TableHead className="text-right font-semibold">운영횟수</TableHead>
                    <TableHead className="text-right font-semibold">목표</TableHead>
                    <TableHead className="text-right font-semibold">총주문</TableHead>
                    <TableHead className="text-right font-semibold">순주문</TableHead>
                    <TableHead className="text-right font-semibold">총매출</TableHead>
                    <TableHead className="text-right font-semibold">순매출</TableHead>
                    <TableHead className="text-right font-semibold">달성률</TableHead>
                    <TableHead className="text-right font-semibold">종합달성률</TableHead>
                    <TableHead className="text-right font-semibold">점유율</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 채널별 상세 내역 (펼쳤을 때만 표시) */}
                  {isExpanded && group.channels.map((channel, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                      <TableCell className="font-medium">{channel.channel}</TableCell>
                      <TableCell className="text-right">{channel.operation_count}회</TableCell>
                      <TableCell className="text-right">{channel.target?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{channel.total_order?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{channel.performance?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{channel.total_sales?.toLocaleString()}원</TableCell>
                      <TableCell className="text-right">{channel.sales_amount?.toLocaleString()}원</TableCell>
                      <TableCell className="text-right">
                        <span className={channel.achievement_rate >= 100 ? "text-green-600 font-semibold" : ""}>
                          {channel.achievement_rate?.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{channel.total_achievement_rate?.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <span className="text-primary font-medium">
                          {(group.total.sales_amount > 0 
                            ? (channel.sales_amount / group.total.sales_amount * 100) 
                            : 0).toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* 상품 합계 (항상 표시) */}
                  <TableRow className="bg-muted/50 font-bold border-t-2 border-muted-foreground/20 hover:bg-muted/70 transition-colors">
                    <TableCell className="text-foreground py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-muted-foreground/40 rounded-full"></div>
                        {isExpanded ? '상품 합계' : `${group.product_name} 합계`}
                      </div>
                    </TableCell>
                  <TableCell className="text-right">{group.total.operation_count}회</TableCell>
                  <TableCell className="text-right">{group.total.target.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{group.total.total_order.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{group.total.performance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{group.total.total_sales.toLocaleString()}원</TableCell>
                  <TableCell className="text-right">{group.total.sales_amount.toLocaleString()}원</TableCell>
                  <TableCell className="text-right">
                    <span className={group.total.target > 0 && (group.total.performance / group.total.target * 100) >= 100 ? "text-green-600" : ""}>
                      {(group.channels.length > 0 
                        ? (group.channels.reduce((sum, c) => sum + (c.achievement_rate || 0), 0) / group.channels.length) 
                        : 0).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {(group.channels.length > 0 
                      ? (group.channels.reduce((sum, c) => sum + (c.total_achievement_rate || 0), 0) / group.channels.length) 
                      : 0).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          );
        })}
      </div>
    );
  };

  const renderChart = (products: IProductStatistics[]) => {
    // 상품별(세트품번)로 데이터 합산
    const productAggregated = products.reduce((acc, product) => {
      const key = product.set_product_code;
      if (!acc[key]) {
        acc[key] = {
          name: `${product.product_name} (${product.set_product_code})`,
          set_product_code: product.set_product_code,
          performance: 0,
          total_order: 0,
          target: 0,
        };
      }
      acc[key].performance += product.performance || 0;
      acc[key].total_order += product.total_order || 0;
      acc[key].target += product.target || 0;
      return acc;
    }, {} as Record<string, { name: string; set_product_code: string; performance: number; total_order: number; target: number }>);

    // 실적과 목표를 하나의 배열로 변환 (그룹화된 막대 그래프용)
    const chartData = Object.values(productAggregated)
      .flatMap(p => [
        { name: p.name || `미지정 (${p.set_product_code})`, value: p.target || 0, type: '1. 목표' },
        { name: p.name || `미지정 (${p.set_product_code})`, value: p.total_order || 0, type: '2. 총주문' },
        { name: p.name || `미지정 (${p.set_product_code})`, value: p.performance || 0, type: '3. 순주문' }
      ]);

    // 점유율 데이터 (원형 차트용)
    const shareData = Object.values(productAggregated)
      .map(p => ({
        name: p.name || `미지정 (${p.set_product_code})`,
        value: p.performance || 0
      }))
      .filter(d => d.value > 0);

    return (
      <div className="py-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground text-center">상품별 목표 / 총주문 / 순주문 현황</h4>
          <BarChart
            data={chartData}
            height={460}
            seriesField="type"
            color={['#94a3b8', '#60a5fa', '#3b82f6']} // 목표: 회색, 총주문: 연파랑, 순주문: 진파랑
            staggerLabels
          />
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground text-center">상품별 점유율 (순주문 기준)</h4>
          <PieChart
            data={shareData}
            height={460}
            showLegend={true}
            showLabel={false}
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
      case 'yearly':
        return `${date}년`;
      case 'monthly': {
        const [year, month] = date.split('-');
        return `${year}년 ${month}월`;
      }
      case 'daily':
        return format(new Date(date), 'yyyy년 MM월 dd일');
      default:
        return date;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">상품별 통계</h1>
          <p className="text-muted-foreground">상품별 판매 현황을 확인하세요</p>
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
                <Button onClick={handleSearch}>
                  검색
                </Button>
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            className="bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
            onClick={handleExportExcel}
            disabled={Object.keys(statistics).length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            엑셀 출력
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
                        <CardTitle className="text-xl">
                          {formatDateRange(date, period, startDate, endDate)}
                        </CardTitle>
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
                        {chartViews[date] ? renderChart(products) : renderTable(date, products)}
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
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        이전
                      </Button>

                      <div className="text-sm text-muted-foreground">
                        {safePage} / {totalPages}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                      >
                        다음
                        <ChevronRight className="h-4 w-4 ml-2" />
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