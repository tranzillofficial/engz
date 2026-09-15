import { getCurrentUser } from '@/lib/services/auth';
import { getAdminPayments } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader } from '@/components';
import { AdminPaymentsClient } from '@/components/admin/AdminPaymentsClient';
import type { PaymentStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

interface AdminPaymentsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status as PaymentStatus | undefined;

  const payments = await getAdminPayments(statusFilter);

  return (
    <AppShell
      header={
        <PageHeader
          title="مراجعة كل المدفوعات"
          titleEn="Platform Payments Ledger"
          subtitle={`إجمالي الإشعارات: ${payments.length}`}
          backHref="/admin"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-3">
        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/admin/payments"
            className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline'}`}
          >
            الكل
          </Link>
          <Link
            href="/admin/payments?status=pending"
            className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          >
            قيد المراجعة ⏳
          </Link>
          <Link
            href="/admin/payments?status=confirmed"
            className={`btn btn-sm ${statusFilter === 'confirmed' ? 'btn-primary' : 'btn-outline'}`}
          >
            مؤكدة ✅
          </Link>
          <Link
            href="/admin/payments?status=rejected"
            className={`btn btn-sm ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-outline'}`}
          >
            مرفوضة ❌
          </Link>
        </div>

        <AdminPaymentsClient payments={payments} />
      </div>
    </AppShell>
  );
}
