"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Package,
  ShoppingCart,
  BarChart3,
  Warehouse,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Home,
  Box,
  Layers,
  FolderTree,
  Search,
  Store,
  ClipboardList,
  FileEdit,
  ListOrdered,
  PieChart,
  TrendingUp,
  PackageSearch,
  Plus,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  children?: { name: string; href: string; icon: React.ReactNode }[];
}

const menuItems: MenuItem[] = [
  {
    name: '방송 일정',
    href: '/',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    name: '상품 관리',
    icon: <Package className="h-4 w-4" />,
    children: [
      { name: '단일상품', href: '/dashboard/products/list', icon: <Box className="h-4 w-4" /> },
      { name: '세트상품', href: '/dashboard/sets/list', icon: <Layers className="h-4 w-4" /> },
      // { name: '카테고리', href: '/dashboard/products/categories', icon: <FolderTree className="h-4 w-4" /> },
      // { name: '품목조회', href: '/dashboard/products/search', icon: <Search className="h-4 w-4" /> },
    ],
  },
  {
    name: '판매 관리',
    icon: <ShoppingCart className="h-4 w-4" />,
    children: [
      { name: '판매채널', href: '/dashboard/channels/list', icon: <Store className="h-4 w-4" /> },
      { name: '판매계획', href: '/dashboard/sales/plans/list', icon: <ClipboardList className="h-4 w-4" /> },
      { name: '판매실적', href: '/dashboard/sales/performance/list', icon: <ListOrdered className="h-4 w-4" /> },
    ],
  },
  {
    name: '통계',
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      { name: '상품별 통계', href: '/dashboard/statistics/products', icon: <PieChart className="h-4 w-4" /> },
      { name: '채널별 통계', href: '/dashboard/statistics/channels', icon: <TrendingUp className="h-4 w-4" /> },
      { name: '아소트 통계', href: '/dashboard/statistics/assort', icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    name: '재고',
    icon: <Warehouse className="h-4 w-4" />,
    children: [
      { name: '창고재고 수량', href: '/dashboard/inventory', icon: <PackageSearch className="h-4 w-4" /> },
      { name: '운영수량 등록', href: '/dashboard/operational-quantity', icon: <Plus className="h-4 w-4" /> },
      { name: '운영수량 목록', href: '/dashboard/operational-quantity/list', icon: <List className="h-4 w-4" /> },
    ],
  },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['상품 관리', '판매 관리', '통계', '재고']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (pathname === href) return true;
    
    // 서브 경로 확인 (예: /dashboard/products/list/123 이 /dashboard/products/list 에 매칭되도록)
    // 단, 더 구체적인 매칭이 있는 경우는 제외 (예: /dashboard/operational-quantity/list 가 있을 때 /dashboard/operational-quantity 매칭 방지)
    if (pathname.startsWith(href + '/')) {
      const isMoreSpecificMatch = menuItems
        .flatMap(item => [item, ...(item.children || [])])
        .some(m => m.href && m.href !== href && m.href.startsWith(href) && pathname.startsWith(m.href));
      
      return !isMoreSpecificMatch;
    }
    
    return false;
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* 로고 영역 */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-semibold">라페어 운영관리</span>
          )}
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon}
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {expandedMenus.includes(item.name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>
                  {sidebarOpen && expandedMenus.includes(item.name) && item.children && (
                    <ul className="ml-4 mt-1 space-y-1 border-l pl-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              isActive(child.href)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            {child.icon}
                            <span>{child.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* 하단 영역 */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* 모바일 헤더 */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="text-lg font-semibold">라페어 운영관리</span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        {/* 데스크톱 사이드바 */}
        <aside
          className={cn(
            "hidden lg:flex h-screen sticky top-0 flex-col border-r bg-card transition-all duration-300",
            "w-64"
          )}
        >
          <SidebarContent />
        </aside>

        {/* 사이드바 토글 버튼 제거됨 */}

        {/* 모바일 사이드바 오버레이 */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* 모바일 사이드바 */}
        <aside
          className={cn(
            "fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 border-r bg-card transition-transform duration-300 lg:hidden",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent />
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-auto">
          <div className="w-full py-6 px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 