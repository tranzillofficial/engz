-- Keep exactly one active pricing settings row and remove all legacy distance/commission tiers.
update public.pricing_settings set is_active=false where id not in (select id from public.pricing_settings where is_active=true order by created_at desc limit 1);
delete from public.pricing_distance_tiers;
delete from public.commission_tiers;
insert into public.commission_tiers(min_orders,max_orders,commission_type,commission_value,sort_order,is_active) values(1,3,'fixed',0,1,true),(4,null,'fixed',6,2,true);
update public.pricing_settings set base_delivery_fee=25,free_orders=3,driver_commission_per_order=6,platform_share_per_agent_order=2.5,agent_share_per_order=3.5,updated_at=now() where is_active=true;
