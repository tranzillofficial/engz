-- Engz operations: fixed delivery pricing, configurable commission split, agent ownership,
-- agent withdrawal requests, notifications and Web Push subscriptions.

alter table public.drivers add column if not exists agent_id uuid references public.agents(id) on delete set null;
alter table public.drivers add column if not exists registration_code text;
create unique index if not exists drivers_registration_code_key on public.drivers(registration_code) where registration_code is not null;
alter table public.agents add column if not exists payout_phone text;
alter table public.agents add column if not exists commission_balance numeric(12,2) not null default 0;

alter table public.pricing_settings add column if not exists free_orders integer not null default 3;
alter table public.pricing_settings add column if not exists driver_commission_per_order numeric(12,2) not null default 6;
alter table public.pricing_settings add column if not exists platform_share_per_agent_order numeric(12,2) not null default 2.5;
alter table public.pricing_settings add column if not exists agent_share_per_order numeric(12,2) not null default 3.5;

create table if not exists public.agent_payout_requests (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete restrict,
  amount numeric(12,2) not null check(amount > 0),
  payout_phone text not null,
  status public.payment_status not null default 'pending',
  admin_notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.agent_payout_requests enable row level security;
revoke all on public.agent_payout_requests from anon,authenticated;
grant select,insert,update on public.agent_payout_requests to authenticated;
create policy agent_payout_requests_select_own on public.agent_payout_requests for select to authenticated using(exists(select 1 from public.agents a where a.id=agent_payout_requests.agent_id and a.user_id=auth.uid()));
create policy agent_payout_requests_select_admin on public.agent_payout_requests for select to authenticated using((select get_user_role())='admin'::public.user_role);
create policy agent_payout_requests_insert_own on public.agent_payout_requests for insert to authenticated with check((select get_user_role())='agent'::public.user_role and exists(select 1 from public.agents a where a.id=agent_payout_requests.agent_id and a.user_id=auth.uid()));
create policy agent_payout_requests_update_admin on public.agent_payout_requests for update to authenticated using((select get_user_role())='admin'::public.user_role) with check((select get_user_role())='admin'::public.user_role);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references public.users(id) on delete cascade,
  recipient_role public.user_role,
  title text not null,
  body text not null,
  type text not null default 'info',
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check(recipient_user_id is not null or recipient_role is not null)
);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon,authenticated;
grant select,update on public.notifications to authenticated;
create policy notifications_select_own on public.notifications for select to authenticated using(recipient_user_id=auth.uid() or (recipient_user_id is null and recipient_role=(select get_user_role())));
create policy notifications_update_own on public.notifications for update to authenticated using(recipient_user_id=auth.uid()) with check(recipient_user_id=auth.uid());
create index if not exists notifications_recipient_idx on public.notifications(recipient_user_id,created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,endpoint)
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon,authenticated;
grant select,insert,update,delete on public.push_subscriptions to authenticated;
create policy push_subscriptions_own on public.push_subscriptions for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Replace legacy commission tiers with the requested first-3-free / 6 EGP model.
delete from public.commission_tiers;
insert into public.commission_tiers(min_orders,max_orders,commission_type,commission_value,sort_order,is_active)
values(1,3,'fixed',0,1,true),(4,null,'fixed',6,2,true);
delete from public.pricing_distance_tiers;
update public.pricing_settings set base_delivery_fee=25, free_orders=3, driver_commission_per_order=6, platform_share_per_agent_order=2.5, agent_share_per_order=3.5, updated_at=now() where is_active=true;

create or replace function public.complete_order_with_commission(p_order_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_order orders%rowtype; v_driver drivers%rowtype; v_settings pricing_settings%rowtype; v_commission numeric(12,2); v_platform numeric(12,2); v_agent numeric(12,2); v_new_balance numeric(12,2); v_agent_balance numeric(12,2); v_count integer;
begin
 select * into v_order from orders where id=p_order_id for update;
 if v_order is null then return jsonb_build_object('success',false,'error','Order not found'); end if;
 if v_order.status <> 'in_progress' then return jsonb_build_object('success',false,'error','Order must be in_progress to complete'); end if;
 if v_order.driver_id is null then return jsonb_build_object('success',false,'error','No driver assigned'); end if;
 if exists(select 1 from commission_transactions where order_id=p_order_id and transaction_type='commission') then return jsonb_build_object('success',false,'error','Commission already calculated for this order'); end if;
 select * into v_driver from drivers where id=v_order.driver_id for update;
 select * into v_settings from pricing_settings where is_active=true limit 1;
 update orders set status='delivered',delivered_at=coalesce(delivered_at,now()) where id=p_order_id;
 v_count:=v_driver.total_completed_orders+1;
 v_commission:=case when v_count<=coalesce(v_settings.free_orders,3) then 0 else coalesce(v_settings.driver_commission_per_order,6) end;
 v_new_balance:=v_driver.commission_balance+v_commission;
 if v_driver.agent_id is not null and v_commission>0 then
   v_platform:=least(v_commission,coalesce(v_settings.platform_share_per_agent_order,2.5));
   v_agent:=greatest(0,v_commission-v_platform);
   select commission_balance into v_agent_balance from agents where id=v_driver.agent_id for update;
   update agents set commission_balance=coalesce(v_agent_balance,0)+v_agent,updated_at=now() where id=v_driver.agent_id;
 else
   v_platform:=v_commission; v_agent:=0;
 end if;
 update drivers set total_completed_orders=v_count,commission_balance=v_new_balance,is_blocked=case when v_settings is not null and v_new_balance>=v_settings.commission_block_threshold then true else is_blocked end,status='online' where id=v_order.driver_id;
 insert into commission_transactions(driver_id,order_id,transaction_type,amount,balance_after,tier_snapshot,notes) values(v_order.driver_id,p_order_id,'commission',v_commission,v_new_balance,jsonb_build_object('free_orders',coalesce(v_settings.free_orders,3),'commission_per_order',coalesce(v_settings.driver_commission_per_order,6),'platform_share',v_platform,'agent_share',v_agent,'agent_id',v_driver.agent_id),'ENgz commission');
 if v_driver.agent_id is not null and v_agent>0 then insert into notifications(recipient_user_id,title,body,type,data) select user_id,'مستحق عمولة جديد','تم إضافة '||v_agent||' ج.م إلى مستحقات منطقتك.','success',jsonb_build_object('amount',v_agent,'order_id',p_order_id) from agents where id=v_driver.agent_id; end if;
 return jsonb_build_object('success',true,'commission',v_commission,'new_balance',v_new_balance,'platform_share',v_platform,'agent_share',v_agent);
end; $$;
revoke all on function public.complete_order_with_commission(uuid) from public;
grant execute on function public.complete_order_with_commission(uuid) to authenticated,service_role;
