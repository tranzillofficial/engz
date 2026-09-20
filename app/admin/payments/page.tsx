import { getCurrentUser } from '@/lib/services/auth';
import { getAdminPayments } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader } from '@/components';
import { AdminPaymentsClient } from '@/components/admin/AdminPaymentsClient';
import { AdminPaymentMethodCard } from '@/components/admin/AdminPaymentMethodCard';
import { createClient } from '@/lib/supabase/server';
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
  const db = await createClient();
  let { data: paymentMethod } = await (db as any)
    .from('payment_methods')
    .select('method_key,method_name,account_name,account_number,instructions')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!paymentMethod) {
    const { data: legacyMethod } = await (db as any)
      .from('admin_payment_methods')
      .select('method_key,method_name,account_name,account_number,instructions')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    paymentMethod = legacyMethod;
  }

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

        <AdminPaymentMethodCard method={paymentMethod} />
        <AdminPaymentsClient payments={payments} />
      </div>
    </AppShell>
  );
}
