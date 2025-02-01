import { Suspense } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import OperationalQuantityClient from '@/app/dashboard/operational-quantity/OperationalQuantityClient';

 

export default function OperationalQuantityPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">운영가능 수량</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <OperationalQuantityClient />
        </Suspense>
      </div>
    </DashboardLayout>
  );
} 