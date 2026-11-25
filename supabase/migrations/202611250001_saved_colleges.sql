create table public.saved_colleges (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  college_id text not null check (college_id ~ '^[a-z0-9][a-z0-9-]{0,159}$'),
  saved_at timestamptz not null default now(),
  primary key (user_id, college_id)
);

alter table public.saved_colleges enable row level security;
revoke all on public.saved_colleges from anon, authenticated;
grant select, insert, delete on public.saved_colleges to authenticated;

create policy "Read own saved colleges" on public.saved_colleges
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Save own colleges" on public.saved_colleges
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Remove own saved colleges" on public.saved_colleges
  for delete to authenticated using ((select auth.uid()) = user_id);
