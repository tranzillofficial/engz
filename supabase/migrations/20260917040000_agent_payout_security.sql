-- Agent payouts: only admins can create/update; agents can only read their own payouts.
create table if not exists public.agent_payouts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'manual',
  reference text not null default '',
  notes text not null default '',
  status public.payment_status not null default 'pending',
  created_by uuid not null references public.users(id) on delete restrict,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.agent_payouts enable row level security;
revoke all on public.agent_payouts from anon, authenticated;
grant select, insert, update, delete on public.agent_payouts to authenticated;
create policy agent_payouts_select_admin on public.agent_payouts for select to authenticated using ((select get_user_role()) = 'admin'::public.user_role);
create policy agent_payouts_select_own on public.agent_payouts for select to authenticated using (exists (select 1 from public.agents a where a.id = agent_payouts.agent_id and a.user_id = (select auth.uid())));
create policy agent_payouts_insert_admin on public.agent_payouts for insert to authenticated with check ((select get_user_role()) = 'admin'::public.user_role and created_by = (select auth.uid()));
create policy agent_payouts_update_admin on public.agent_payouts for update to authenticated using ((select get_user_role()) = 'admin'::public.user_role) with check ((select get_user_role()) = 'admin'::public.user_role);
create index if not exists agent_payouts_agent_id_idx on public.agent_payouts(agent_id);
create index if not exists agent_payouts_status_idx on public.agent_payouts(status);

-- Never allow an agent to confirm/reject driver commission payments through the RPC.
create or replace function public.confirm_payment(p_payment_id uuid, p_reviewer_id uuid, p_review_notes text default 'تم التحقق وتأكيد استلام المبلغ')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_payment public.payment_confirmations%rowtype; v_driver public.drivers%rowtype; v_settings public.pricing_settings%rowtype; v_new_balance decimal(12,2);
begin
  if (auth.uid() is null or get_user_role() <> 'admin'::public.user_role or p_reviewer_id <> auth.uid()) then
    return jsonb_build_object('success', false, 'error', 'غير مصرح — تأكيد الدفعات متاح للإدارة فقط');
  end if;
  select * into v_payment from public.payment_confirmations where id=p_payment_id for update;
  if v_payment is null then return jsonb_build_object('success',false,'error','Payment not found'); end if;
  if v_payment.status <> 'pending' then return jsonb_build_object('success',false,'error','Payment already processed'); end if;
  select * into v_driver from public.drivers where id=v_payment.driver_id for update;
  if v_driver is null then return jsonb_build_object('success',false,'error','Driver not found'); end if;
  select * into v_settings from public.pricing_settings where is_active=true limit 1;
  v_new_balance := greatest(0, v_driver.commission_balance - v_payment.amount);
  update public.payment_confirmations set status='confirmed', reviewed_by=p_reviewer_id, review_notes=p_review_notes, reviewed_at=now() where id=p_payment_id;
  insert into public.commission_transactions(driver_id,transaction_type,amount,balance_after,notes) values(v_payment.driver_id,'payment',v_payment.amount,v_new_balance,'Payment confirmed: ' || v_payment.reference);
  update public.drivers set commission_balance=v_new_balance,is_blocked=case when v_settings is not null and v_new_balance >= v_settings.commission_block_threshold then true else false end where id=v_payment.driver_id;
  return jsonb_build_object('success',true,'new_balance',v_new_balance);
end; $$;
revoke all on function public.confirm_payment(uuid,uuid,text) from public;
grant execute on function public.confirm_payment(uuid,uuid,text) to authenticated;
