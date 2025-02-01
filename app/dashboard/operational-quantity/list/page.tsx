import { Suspense } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import OperationalQuantityListClient from '@/app/dashboard/operational-quantity/list/OperationalQuantityListClient';

export default function OperationalQuantityListPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">운영수량 목록</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <OperationalQuantityListClient />
        </Suspense>
      </div>
    </DashboardLayout>
  );
} 