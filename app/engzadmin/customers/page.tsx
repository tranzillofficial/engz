import { getCurrentUser } from '@/lib/services/auth';
import { getAdminCustomers } from '@/lib/services/admin';
import { redirect } from 'next/navigation';
import { AppShell, PageHeader, Card } from '@/components';

export const dynamic = 'force-dynamic';

export default async function EngzAdminCustomersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const customers = await getAdminCustomers();

  return (
    <AppShell
      header={
        <PageHeader
          title="قائمة العملاء"
          titleEn="Customers Management"
          subtitle={`إجمالي العملاء: ${customers.length}`}
          backHref="/engzadmin"
        />
      }
    >
      <div className="max-w-md mx-auto py-2 space-y-3">
        {customers.map((c) => (
          <Card key={c.id} className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                {c.full_name?.charAt(0) || 'ع'}
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {c.full_name}
                </h4>
                <div className="text-xs text-gray-500">{c.phone || c.email}</div>
              </div>
            </div>

            <span className="text-[10px] text-gray-400">
              انضم: {new Date(c.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
            </span>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
