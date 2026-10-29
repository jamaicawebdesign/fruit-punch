-- Double-entry bookkeeping schema
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null check (type in ('asset','liability','equity','revenue','expense')),
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  description text not null,
  created_at timestamptz not null default now()
);

create table journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references journal_entries(id) on delete cascade,
  account_id uuid not null references accounts(id),
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  check ((debit = 0) <> (credit = 0))
);

create index on journal_lines (entry_id);
create index on journal_lines (account_id);

-- Atomically create an entry with its lines; rejects unbalanced entries.
create function create_journal_entry(p_date date, p_description text, p_lines jsonb)
returns uuid language plpgsql security invoker as $$
declare
  v_id uuid;
  v_debit numeric;
  v_credit numeric;
begin
  select coalesce(sum((l->>'debit')::numeric),0), coalesce(sum((l->>'credit')::numeric),0)
    into v_debit, v_credit from jsonb_array_elements(p_lines) l;
  if jsonb_array_length(p_lines) < 2 or v_debit <> v_credit then
    raise exception 'Journal entry must have at least two lines and balance';
  end if;
  insert into journal_entries (entry_date, description)
    values (coalesce(p_date, current_date), p_description) returning id into v_id;
  insert into journal_lines (entry_id, account_id, debit, credit)
    select v_id, (l->>'account_id')::uuid,
           coalesce((l->>'debit')::numeric,0), coalesce((l->>'credit')::numeric,0)
    from jsonb_array_elements(p_lines) l;
  return v_id;
end $$;

create view trial_balance with (security_invoker = true) as
select a.id as account_id, a.code, a.name, a.type,
       coalesce(sum(l.debit),0) as debit, coalesce(sum(l.credit),0) as credit
from accounts a left join journal_lines l on l.account_id = a.id
group by a.id;

alter table accounts enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;

create policy "own accounts" on accounts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own entries" on journal_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own lines" on journal_lines for all
  using (exists (select 1 from journal_entries e where e.id = entry_id and e.user_id = auth.uid()))
  with check (exists (select 1 from journal_entries e where e.id = entry_id and e.user_id = auth.uid())
    and exists (select 1 from accounts a where a.id = account_id and a.user_id = auth.uid()));
