import { Suspense } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import InventoryClient from '@/app/dashboard/inventory/InventoryClient';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div>
        
        <Suspense fallback={<LoadingSpinner />}>
          <InventoryClient />
        </Suspense>
      </div>
    </DashboardLayout>
  );
} 