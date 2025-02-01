import { Suspense } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import InventoryClient from '@/app/dashboard/inventory/InventoryClient';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">창고 재고수량</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <InventoryClient />
        </Suspense>
      </div>
    </DashboardLayout>
  );
} 