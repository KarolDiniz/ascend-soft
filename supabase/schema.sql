-- Ascend Soft — ranking global (Supabase free tier)
-- Cole no SQL Editor do projeto Supabase e execute uma vez.

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null,
  display_name text not null check (char_length(display_name) between 2 and 16),
  height integer not null check (height >= 0 and height <= 3000000),
  breaths integer not null default 0 check (breaths >= 0 and breaths <= 100000),
  collectibles integer not null default 0 check (collectibles >= 0 and collectibles <= 5000),
  run_ms integer not null default 0 check (run_ms >= 0 and run_ms <= 86400000),
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
    and display_name ~ '^[A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç0-9 ]+$'
    and display_name ~ '[A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç]'
    and height between 3 and 3000000
    and breaths between 0 and 100000
    and collectibles between 0 and 5000
    and run_ms between 1000 and 86400000
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

-- Ranking semanal: temporada 1 a partir de 2026-09-02; depois reinicia toda segunda (SP).
create index if not exists scores_created_at_idx on public.scores (created_at desc);

create or replace view public.leaderboard_weekly as
select distinct on (player_id)
  player_id,
  display_name,
  height,
  breaths,
  collectibles,
  created_at
from public.scores
where created_at >= greatest(
  date_trunc('week', timezone('America/Sao_Paulo', now()))
  at time zone 'America/Sao_Paulo',
  timestamptz '2026-09-02 00:00:00-03'
)
order by player_id, height desc, created_at asc;

create or replace function public.player_rank_weekly(p_height integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select count(*)::integer + 1 from public.leaderboard_weekly where height > p_height),
    1
  );
$$;

grant select on public.leaderboard_weekly to anon, authenticated;
grant execute on function public.player_rank_weekly(integer) to anon, authenticated;

-- Realtime: INSERT em scores atualiza o ranking no cliente (capa + partida).
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.scores';
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

-- —— Nomes: ofensas + unicidade (case/leet-insensitive) ——

create or replace function public.normalize_player_name(n text)
returns text
language plpgsql
immutable
strict
as $$
declare
  s text;
begin
  s := lower(btrim(n));
  s := translate(
    s,
    'áàâãäéèêëíìîïóòôõöúùûüçñýÿ@0$4€35781!|',
    'aaaaaeeeeiiiiooooouuuucnyyaosaeestbiii'
  );
  s := regexp_replace(s, '[^a-z0-9]', '', 'g');
  s := regexp_replace(s, '(.)\1{2,}', '\1\1', 'g');
  return s;
end;
$$;

create table if not exists public.name_blocklist (
  token text primary key,
  match text not null default 'contains' check (match in ('exact', 'contains'))
);

alter table public.name_blocklist enable row level security;

insert into public.name_blocklist (token, match) values
  ('cu', 'exact'),
  ('pp', 'exact'),
  ('kkk', 'exact'),
  ('nazi', 'exact'),
  ('puta', 'exact'),
  ('puto', 'exact'),
  ('bicha', 'exact'),
  ('viado', 'exact'),
  ('veado', 'exact'),
  ('macaco', 'exact'),
  ('nigga', 'exact'),
  ('dick', 'exact'),
  ('cock', 'exact'),
  ('sexo', 'exact'),
  ('porra', 'contains'),
  ('caralho', 'contains'),
  ('merda', 'contains'),
  ('bosta', 'contains'),
  ('buceta', 'contains'),
  ('xoxota', 'contains'),
  ('punheta', 'contains'),
  ('siririca', 'contains'),
  ('foder', 'contains'),
  ('fodase', 'contains'),
  ('putinha', 'contains'),
  ('putaria', 'contains'),
  ('vadia', 'contains'),
  ('vagabunda', 'contains'),
  ('arrombado', 'contains'),
  ('filhadaputa', 'contains'),
  ('vaisefuder', 'contains'),
  ('cuzao', 'contains'),
  ('boiola', 'contains'),
  ('traveco', 'contains'),
  ('crioulo', 'contains'),
  ('criolo', 'contains'),
  ('nazista', 'contains'),
  ('hitler', 'contains'),
  ('nigger', 'contains'),
  ('faggot', 'contains'),
  ('retardado', 'contains'),
  ('retardada', 'contains'),
  ('mongoloide', 'contains'),
  ('fuck', 'contains'),
  ('fucking', 'contains'),
  ('bitch', 'contains'),
  ('asshole', 'contains'),
  ('whore', 'contains'),
  ('slut', 'contains'),
  ('pussy', 'contains')
on conflict (token) do update set match = excluded.match;

create or replace function public.name_is_clean(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  key text := public.normalize_player_name(p_name);
  tok text;
begin
  if key is null or char_length(key) < 2 then
    return false;
  end if;
  if p_name !~ '^[A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç0-9 ]+$'
     or p_name !~ '[A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç]' then
    return false;
  end if;
  if exists (select 1 from public.name_blocklist b where b.match = 'exact' and b.token = key) then
    return false;
  end if;
  foreach tok in array regexp_split_to_array(lower(p_name), '[^a-z0-9áàâãäéèêëíìîïóòôõöúùûüçñ]+')
  loop
    if exists (
      select 1 from public.name_blocklist b
      where b.match = 'exact' and b.token = public.normalize_player_name(tok)
    ) then
      return false;
    end if;
  end loop;
  if exists (
    select 1 from public.name_blocklist b
    where b.match = 'contains' and position(b.token in key) > 0
  ) then
    return false;
  end if;
  return true;
end;
$$;

create or replace function public.name_is_available(p_name text, p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.scores s
    where public.normalize_player_name(s.display_name) = public.normalize_player_name(p_name)
      and s.player_id is distinct from p_player_id
  );
$$;

create or replace function public.scores_name_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.display_name := btrim(new.display_name);
  if new.display_name !~ '^[A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç0-9 ]+$'
     or new.display_name !~ '[A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç]' then
    raise exception 'name_invalid' using errcode = 'P0001';
  end if;
  if not public.name_is_clean(new.display_name) then
    raise exception 'name_blocked' using errcode = 'P0001';
  end if;
  if not public.name_is_available(new.display_name, new.player_id) then
    raise exception 'name_taken' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists scores_name_guard_trg on public.scores;
create trigger scores_name_guard_trg
  before insert on public.scores
  for each row execute function public.scores_name_guard();

create or replace function public.scores_plausibility_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.height < 3 then
    raise exception 'score_implausible' using errcode = 'P0001';
  end if;
  -- 2.5 u/ms = 2500 u/s (trampolim ~1800 u/s; sticky ~554)
  if (new.height::bigint * 1000) > (new.run_ms::bigint * 2500) then
    raise exception 'score_implausible' using errcode = 'P0001';
  end if;
  if new.breaths > greatest(12, new.height / 16) then
    raise exception 'score_implausible' using errcode = 'P0001';
  end if;
  if new.collectibles > greatest(8, new.height / 12) then
    raise exception 'score_implausible' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists scores_plausibility_trg on public.scores;
create trigger scores_plausibility_trg
  before insert on public.scores
  for each row execute function public.scores_plausibility_guard();

revoke all on public.name_blocklist from public, anon, authenticated;
grant execute on function public.normalize_player_name(text) to anon, authenticated;
grant execute on function public.name_is_available(text, uuid) to anon, authenticated;

-- Tabela já existente: CREATE IF NOT EXISTS não altera CHECK. Rode o arquivo inteiro.
alter table public.scores drop constraint if exists scores_height_check;
alter table public.scores add constraint scores_height_check
  check (height >= 0 and height <= 3000000);

alter table public.scores drop constraint if exists scores_run_ms_check;
alter table public.scores add constraint scores_run_ms_check
  check (run_ms >= 0 and run_ms <= 86400000);

-- Recorde de 1.010.261 atribuído ao nome errado; o jogador é RyanLindo.
delete from public.scores
where id = '284d6a86-31dc-4004-99ed-d8f318c35bb7'
   or player_id = '6af8d8a6-4664-42f1-8f62-209ee7100b09';

