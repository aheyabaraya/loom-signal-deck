drop policy if exists harne_chat_daily_usage_deny_direct on public.harne_chat_daily_usage;
create policy harne_chat_daily_usage_deny_direct on public.harne_chat_daily_usage
for all to authenticated using (false) with check (false);

drop policy if exists harne_chat_global_daily_usage_deny_direct on public.harne_chat_global_daily_usage;
create policy harne_chat_global_daily_usage_deny_direct on public.harne_chat_global_daily_usage
for all to authenticated using (false) with check (false);
