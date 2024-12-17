'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import DashboardLayout from '@/app/components/layout/DashboardLayout';

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
    // 숫자가 시작되는 위치를 찾음
    const numberStartMatch = 품목명.match(/\d/);
    if (!numberStartMatch) return '';
    
    const startIndex = numberStartMatch.index;
    if (startIndex === undefined) return '';
    
    // 숫자 시작 위치부터 끝까지의 문자열
    const remainingStr = 품목명.slice(startIndex);
    
    // 첫 번째 '-' 위치를 찾음
    const dashIndex = remainingStr.indexOf('-');
    
    // '-'가 없는 경우 전체 숫자를 반환
    if (dashIndex === -1) {
      const match = remainingStr.match(/^\d+/);
      return match ? match[0] : '';
    }
    
    // '-' 전까지의 문자열에서 연속된 숫자만 추출
    const subStr = remainingStr.substring(0, dashIndex);
    const match = subStr.match(/^\d+/);
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
      const 품목코드위치 = findLabelRow('품목코드');
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

      for (let i = 품목코드위치.row + 1; i < maxRows; i++) {
        const row = rawData[i];
        if (!row) continue;

        const 품목명Value = row[품목명위치.col]?.toString() || '';

        const item: ExcelRow = {
          품목코드: row[품목코드위치.col]?.toString() || '',
          품번: extractItemNumber(품목명Value),
          품목명: 품목명Value,
          규격: row[규격위치.col]?.toString() || '',
          합계: Number(row[합계위치.col]) || 0
        };

        if (item.품목코드 || item.품목명 || item.규격 || item.합계) {
          processedData.push(item);
        }
      }

      setExcelData(processedData);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <DashboardLayout>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">엑셀 파일 업로드</h3>
        
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="mb-4"
        />

        {excelData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    품목코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    품번
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    품목명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    규격
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    합계
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {excelData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.품목코드}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.품번}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.품목명}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.규격}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {row.합계?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 