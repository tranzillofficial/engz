import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId, getAgentPayments } from '@/lib/services/agent';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell, PageHeader } from '@/components';
import { AgentPaymentsClient } from '@/components/agent/AgentPaymentsClient';
import type { PaymentStatus } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

interface AgentPaymentsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AgentPaymentsPage({ searchParams }: AgentPaymentsPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'agent') {
    redirect('/login');
  }

  const agent = await getAgentByUserId(user.id);
  if (!agent) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status as PaymentStatus | undefined;

  const payments = await getAgentPayments(agent.region_id, statusFilter);

  const navItems = [
    {
      href: '/agent',
      label: 'الرئيسية',
      labelEn: 'Overview',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      href: '/agent/orders',
      label: 'الطلبات',
      labelEn: 'Orders',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
    },
    {
      href: '/agent/drivers',
      label: 'الطيارين',
      labelEn: 'Drivers',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4"/>
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        </svg>
      ),
    },
    {
      href: '/agent/payments',
      label: 'المدفوعات',
      labelEn: 'Payments',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
    },
    {
      href: '/agent/profile',
      label: 'المنطقة',
      labelEn: 'Region',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  return (
    <AppShell
      header={
        <PageHeader
          title="مراجعة مدفوعات العمولات"
          titleEn="Commission Payment Review"
          subtitle={`منطقة ${agent.region.name_ar || agent.region.name}`}
          backHref="/agent"
        />
      }
      navItems={navItems}
    >
      <div className="max-w-md mx-auto py-2 space-y-3">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/agent/payments"
            className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-outline'}`}
          >
            الكل
          </Link>
          <Link
            href="/agent/payments?status=pending"
            className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          >
            قيد المراجعة ⏳
          </Link>
          <Link
            href="/agent/payments?status=confirmed"
            className={`btn btn-sm ${statusFilter === 'confirmed' ? 'btn-primary' : 'btn-outline'}`}
          >
            تم التأكيد ✅
          </Link>
          <Link
            href="/agent/payments?status=rejected"
            className={`btn btn-sm ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-outline'}`}
          >
            مرفوض ❌
          </Link>
        </div>

        <AgentPaymentsClient payments={payments} />
      </div>
    </AppShell>
  );
}
