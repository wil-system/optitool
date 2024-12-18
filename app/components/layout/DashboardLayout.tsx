import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 왼쪽 사이드바 - 너비 축소 */}
      <div className="w-48 bg-white shadow-lg">
        <div className="p-3">
          <h1 className="text-lg font-bold">관리자 대시보드</h1>
        </div>
        <nav className="mt-2">
          <ul className="space-y-1">
            <li className="px-3 py-2 hover:bg-gray-100">
              <a href="/dashboard">대시보드</a>
            </li>
            <li className="px-3 py-2 hover:bg-gray-100">
              <div>
                <a>상품 관리</a>
                <ul className="ml-3 mt-1 space-y-1">
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/products/register">상품등록</a>
                  </li>
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/products/list">상품목록</a>
                  </li>
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/sets/list">세트목록</a>
                  </li>
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/products/categories">카테고리 설정</a>
                  </li>
                </ul>
              </div>
            </li>
            <li className="px-3 py-2 hover:bg-gray-100">
              <div>
                <a>판매 관리</a>
                <ul className="ml-3 mt-1 space-y-1">
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/channels/list">판매채널</a>
                  </li>
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/sales/plans/list">판매계획</a>
                  </li>
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/sales/performance">판매실적 등록</a>
                  </li>
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/sales/performance/list">판매실적 목록</a>
                  </li>
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/sales/production">생산수량</a>
                  </li>
                  <li className="px-2 py-1 hover:bg-gray-100">
                    <a href="/dashboard/sales/settlement">정산</a>
                  </li>
                </ul>
              </div>
            </li>
            <li className="px-3 py-2 hover:bg-gray-100">
              <a href="/dashboard/users">사용자 관리</a>
            </li>
            <li className="px-3 py-2 hover:bg-gray-100">
              <a href="/dashboard/settings">설정</a>
            </li>
          </ul>
        </nav>
      </div>

      {/* 오른쪽 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 