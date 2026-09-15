import { getCurrentUser } from '@/lib/services/auth';
import { getAgentByUserId } from '@/lib/services/agent';
import { redirect } from 'next/navigation';
import { AgentProfileClient } from '@/components/agent/AgentProfileClient';

export const dynamic = 'force-dynamic';

export default async function AgentProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'agent') {
    redirect('/login');
  }

  const agent = await getAgentByUserId(user.id);
  if (!agent) {
    redirect('/login');
  }

  return <AgentProfileClient agent={agent} />;
}
