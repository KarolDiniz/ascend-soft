-- Ascend Soft — ranking global (Supabase free tier)
-- Cole no SQL Editor do projeto Supabase e execute uma vez.

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null,
  display_name text not null check (char_length(display_name) between 2 and 16),
  height integer not null check (height >= 0 and height <= 500000),
  breaths integer not null default 0 check (breaths >= 0 and breaths <= 100000),
  collectibles integer not null default 0 check (collectibles >= 0 and collectibles <= 5000),
  run_ms integer not null default 0 check (run_ms >= 0 and run_ms <= 7200000),
  created_at timestamptz not null default now()
);

create index if not exists scores_player_height_idx on public.scores (player_id, height desc);
create index if not exists scores_height_idx on public.scores (height desc);

create or replace view public.leaderboard_best as
select distinct on (player_id)
  player_id,
  display_name,
  height,
  breaths,
  collectibles,
  created_at
from public.scores
order by player_id, height desc, created_at asc;

create or replace function public.player_rank(p_height integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select count(*)::integer + 1 from public.leaderboard_best where height > p_height),
    1
  );
$$;

alter table public.scores enable row level security;

drop policy if exists "scores_public_read" on public.scores;
create policy "scores_public_read"
  on public.scores for select to anon, authenticated
  using (true);

drop policy if exists "scores_public_insert" on public.scores;
create policy "scores_public_insert"
  on public.scores for insert to anon, authenticated
  with check (
    char_length(display_name) between 2 and 16
    and height between 0 and 500000
    and breaths between 0 and 100000
    and collectibles between 0 and 5000
    and run_ms between 1000 and 7200000
  );

create or replace function public.scores_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.scores
    where player_id = new.player_id
      and created_at > now() - interval '1 hour'
  ) >= 40 then
    raise exception 'rate_limit_exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists scores_rate_limit_trg on public.scores;
create trigger scores_rate_limit_trg
  before insert on public.scores
  for each row execute function public.scores_rate_limit();

grant usage on schema public to anon, authenticated;
grant select on public.scores to anon, authenticated;
grant insert on public.scores to anon, authenticated;
grant select on public.leaderboard_best to anon, authenticated;
grant execute on function public.player_rank(integer) to anon, authenticated;
