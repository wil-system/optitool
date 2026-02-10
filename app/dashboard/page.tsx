'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload } from 'lucide-react';

interface ExcelRow {
  품목코드: string;
  품번: string;
  품목명: string;
  규격: string;
  합계: number;
}

export default function DashboardPage() {
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);

  const extractItemNumber = (품목명: string) => {
    const match = 품목명.match(/^\d+(?=-)/);
    return match ? match[0] : '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 워크시트를 2차원 배열로 변환
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // 레이블 위치 찾기
      const findLabelRow = (label: string) => {
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          const labelIndex = row.findIndex((cell: string) => 
            cell?.toString().trim() === label
          );
          if (labelIndex !== -1) {
            return { row: i, col: labelIndex };
          }
        }
        return null;
      };

      // 각 레이블의 위치 찾기
      const 품목코드위치 = findLabelRow('품목 코드');
      const 품목명위치 = findLabelRow('품목명');
      const 규격위치 = findLabelRow('규격');
      const 합계위치 = findLabelRow('합계');

      if (!품목코드위치 || !품목명위치 || !규격위치 || !합계위치) {
        alert('필요한 레이블을 찾을 수 없습니다.');
        return;
      }

      // 데이터 추출
      const processedData: ExcelRow[] = [];
      const maxRows = rawData.length;

      for (let i = 품목코드위치.row; i < maxRows; i++) {
        const row = rawData[i];
        if (!row) continue;

        const 품목명Value = row[품목명위치.col + 1]?.toString() || '';

        const item: ExcelRow = {
          품목코드: row[품목코드위치.col + 1]?.toString() || '',
          품번: extractItemNumber(품목명Value),
          품목명: 품목명Value,
          규격: row[규격위치.col + 1]?.toString() || '',
          합계: Number(row[합계위치.col + 1]) || 0
        };

        if (item.품목코드 || item.품목명 || item.규격 || item.합계) {
          processedData.push(item);
        }
      }

      setExcelData(processedData);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">엑셀 파일을 업로드하여 데이터를 확인하세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>엑셀 파일 업로드</CardTitle>
            <CardDescription>
              .xlsx 또는 .xls 파일을 업로드하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {excelData.length > 0 && (
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>품목코드</TableHead>
                      <TableHead>품번</TableHead>
                      <TableHead>품목명</TableHead>
                      <TableHead>규격</TableHead>
                      <TableHead className="text-right">합계</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.품목코드}</TableCell>
                        <TableCell>{row.품번}</TableCell>
                        <TableCell>{row.품목명}</TableCell>
                        <TableCell>{row.규격}</TableCell>
                        <TableCell className="text-right">{row.합계?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 