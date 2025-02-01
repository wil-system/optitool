import { IInventoryData } from '@/app/types/inventory';

interface IInventoryTableProps {
  data: IInventoryData[];
}

export default function InventoryTable({ data }: IInventoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">품목코드</th>
            <th className="border p-2 text-left">품목명</th>
            <th className="border p-2 text-center">규격</th>
            <th className="border p-2 text-right">합계</th>
            <th className="border p-2 text-right">(신)반품창고</th>
            <th className="border p-2 text-right">106-화성창고</th>
            <th className="border p-2 text-right">인천창고</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border p-2">{item.product_code}</td>
              <td className="border p-2">{item.product_name}</td>
              <td className="border p-2 text-center">{item.specification}</td>
              <td className="border p-2 text-right">{item.total.toLocaleString()}</td>
              <td className="border p-2 text-right">{item.warehouse_12345.toLocaleString()}</td>
              <td className="border p-2 text-right">{item.warehouse_106.toLocaleString()}</td>
              <td className="border p-2 text-right">{item.warehouse_3333.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 