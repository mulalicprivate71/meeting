-- Zapisnici sastanaka — IMH i IDSS
-- Šema za Supabase (Postgres). Pokrenuti u SQL editoru NOVOG projekta
-- (ne miješati s projektom aplikacije IDSS Pedagog). Skriptu je moguće pokrenuti više puta.
-- STATUS: nije pokretana na stvarnom projektu; pregledana čitanjem i nezavisnom revizijom.

create extension if not exists pgcrypto;

-- ============ Članstvo korisnika po ustanovi ============
create table if not exists public.memberships (
  user_id     uuid not null references auth.users(id) on delete cascade,
  institution text not null check (institution in ('IMH','IDSS')),
  role        text not null check (role in ('direktor','uprava','voditelj','clan')),
  primary key (user_id, institution)
);
alter table public.memberships enable row level security;
drop policy if exists "korisnik vidi svoja clanstva" on public.memberships;
create policy "korisnik vidi svoja clanstva" on public.memberships
  for select to authenticated using (user_id = auth.uid());
-- Članstva dodaje isključivo administrator (service role). Korisnici ih ne mogu mijenjati.

-- ============ Pomoćne funkcije (search_path prazan: sva imena su potpuna) ============
create or replace function public.is_uprava_of(inst text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships
                 where user_id = auth.uid() and institution = inst and role in ('uprava','direktor'));
$$;

create or replace function public.can_see(scope text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case scope
    when 'IMH'  then exists (select 1 from public.memberships where user_id = auth.uid() and institution = 'IMH')
    when 'IDSS' then exists (select 1 from public.memberships where user_id = auth.uid() and institution = 'IDSS')
    -- zajednički sastanak: samo uprava obje ustanove
    when 'ZAJEDNICKI' then public.is_uprava_of('IMH') and public.is_uprava_of('IDSS')
    else false end;
$$;

-- Direktor ustanove
create or replace function public.is_direktor_of(inst text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships
                 where user_id = auth.uid() and institution = inst and role = 'direktor');
$$;

-- Potvrđivanje zapisnika: samo Direktor (odluka Direktora, QP 10); za zajednički sastanak Direktor obje ustanove.
create or replace function public.can_confirm(scope text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case scope
    when 'IMH'  then public.is_direktor_of('IMH')
    when 'IDSS' then public.is_direktor_of('IDSS')
    when 'ZAJEDNICKI' then public.is_direktor_of('IMH') and public.is_direktor_of('IDSS')
    else false end;
$$;

-- Uređivanje nacrta: autor ili Direktor.
create or replace function public.can_edit(scope text, author uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.can_see(scope) and (author = auth.uid() or public.can_confirm(scope));
$$;

-- ============ Sastanci i zapisnici (obrazac QP 10.ZS-01 / ZS-02 čuva se u polju podaci) ============
create table if not exists public.meetings (
  id         uuid primary key default gen_random_uuid(),
  scope      text not null check (scope in ('IMH','IDSS','ZAJEDNICKI')),
  status     text not null default 'saglasnost'
             check (status in ('saglasnost','snimanje','obrada','nacrt','potvrdjen')),
  podaci     jsonb not null default '{}'::jsonb check (pg_column_size(podaci) < 4000000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.meetings enable row level security;

drop policy if exists "citanje zapisnika" on public.meetings;
create policy "citanje zapisnika" on public.meetings for select to authenticated using (
  public.can_see(scope)
  and ( coalesce(podaci->>'povjerljivost','Opći') <> 'Strogo povjerljivo'
        or created_by = auth.uid()
        or public.can_confirm(scope) )
);

drop policy if exists "unos zapisnika" on public.meetings;
create policy "unos zapisnika" on public.meetings for insert to authenticated
  with check (public.can_see(scope) and created_by = auth.uid()
              and status in ('saglasnost','snimanje','obrada','nacrt'));

-- Izmjena samo dok nije potvrđen, i samo autor ili uprava.
drop policy if exists "izmjena nacrta" on public.meetings;
create policy "izmjena nacrta" on public.meetings for update to authenticated
  using (status <> 'potvrdjen' and public.can_edit(scope, created_by))
  with check (public.can_edit(scope, created_by));
-- Brisanje nije dozvoljeno korisnicima (nema delete politike).

create or replace function public.meetings_guard() returns trigger
language plpgsql set search_path = '' as $$
declare dozvoljeno boolean;
begin
  if new.id <> old.id then raise exception 'Identifikator se ne može mijenjati.'; end if;
  if new.scope <> old.scope then raise exception 'Ustanova se ne može mijenjati.'; end if;
  if new.created_by is distinct from old.created_by then raise exception 'Autor se ne može mijenjati.'; end if;
  if old.status = 'potvrdjen' then raise exception 'Potvrđeni zapisnik je zaključan.'; end if;

  dozvoljeno := new.status = old.status
    or (old.status, new.status) in (('saglasnost','snimanje'),('saglasnost','nacrt'),
                                    ('snimanje','obrada'),('snimanje','nacrt'),
                                    ('obrada','nacrt'),('nacrt','potvrdjen'));
  if not dozvoljeno then raise exception 'Nedozvoljen prelaz statusa: % -> %', old.status, new.status; end if;

  if new.status = 'potvrdjen' then
    if not public.can_confirm(new.scope) then
      raise exception 'Zapisnik može potvrditi samo Direktor.';
    end if;
    -- vrijeme i osobu potvrde upisuje server, ne klijent
    new.podaci := jsonb_set(jsonb_set(new.podaci, '{potvrdjenoKada}', to_jsonb(now())),
                            '{potvrdioId}', to_jsonb(auth.uid()::text));
  end if;

  new.updated_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists trg_meetings_guard on public.meetings;
create trigger trg_meetings_guard before update on public.meetings
  for each row execute function public.meetings_guard();

-- ============ Evidencija saglasnosti za snimanje ============
create table if not exists public.consents (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  given_by    text not null,
  note        text,
  recorded_by uuid not null default auth.uid(),
  created_at  timestamptz not null default now()
);
alter table public.consents enable row level security;
drop policy if exists "saglasnost: citanje" on public.consents;
create policy "saglasnost: citanje" on public.consents for select to authenticated
  using (exists (select 1 from public.meetings m where m.id = meeting_id));
-- Saglasnost se može unijeti samo dok je sastanak u statusu 'saglasnost', i samo kao prijavljeni korisnik.
drop policy if exists "saglasnost: unos" on public.consents;
create policy "saglasnost: unos" on public.consents for insert to authenticated
  with check (recorded_by = auth.uid()
              and exists (select 1 from public.meetings m where m.id = meeting_id and m.status = 'saglasnost'));

-- ============ Transkripti (upisuje samo serverska funkcija) ============
create table if not exists public.transcripts (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  provider   text not null,
  text       text not null,
  segments   jsonb,
  created_at timestamptz not null default now()
);
alter table public.transcripts enable row level security;
drop policy if exists "transkript: citanje" on public.transcripts;
create policy "transkript: citanje" on public.transcripts for select to authenticated
  using (exists (select 1 from public.meetings m where m.id = meeting_id));

-- ============ Dnevnik radnji (upisuje samo serverska funkcija) ============
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  meeting_id uuid,
  user_id    uuid,
  action     text not null,
  at         timestamptz not null default now()
);
alter table public.audit_log enable row level security;
drop policy if exists "dnevnik: citanje" on public.audit_log;
create policy "dnevnik: citanje" on public.audit_log for select to authenticated
  using (exists (select 1 from public.meetings m where m.id = meeting_id and public.can_confirm(m.scope)));
-- Nema insert politike za korisnike: dnevnik ne mogu krivotvoriti.

-- ============ Privatna pohrana audija: <meeting_id>/<naziv> ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('snimci', 'snimci', false, 26214400,
        array['audio/webm','audio/mp4','audio/x-m4a','audio/m4a','audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/aac'])
on conflict (id) do update set public = false, file_size_limit = 26214400,
        allowed_mime_types = excluded.allowed_mime_types;

-- Otprema samo dok traje snimanje/obrada i samo autor ili uprava
drop policy if exists "snimci: otprema" on storage.objects;
create policy "snimci: otprema" on storage.objects for insert to authenticated
  with check (bucket_id = 'snimci'
    and exists (select 1 from public.meetings m
                where m.id::text = (storage.foldername(name))[1]
                  and m.status in ('snimanje','obrada')
                  and public.can_edit(m.scope, m.created_by)));
drop policy if exists "snimci: citanje" on storage.objects;
create policy "snimci: citanje" on storage.objects for select to authenticated
  using (bucket_id = 'snimci'
    and exists (select 1 from public.meetings m where m.id::text = (storage.foldername(name))[1]));
-- Brisanje snimaka radi samo serverska funkcija (akcija "purge").
