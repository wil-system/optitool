import { Suspense } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import OperationalQuantityListClient from '@/app/dashboard/operational-quantity/list/OperationalQuantityListClient';

export default function OperationalQuantityListPage() {
  return (
    <DashboardLayout>
      <div>
       
        <Suspense fallback={<LoadingSpinner />}>
          <OperationalQuantityListClient />
        </Suspense>
      </div>
    </DashboardLayout>
  );
} 