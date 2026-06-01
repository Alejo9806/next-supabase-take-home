-- Schema reference for the coffee_health table.
-- The actual table is created by the migration file.

create table public.coffee_health (
  id                      integer primary key,
  age                     smallint        not null check (age >= 0),
  gender                  public.gender_type       not null,
  country                 text            not null,
  coffee_intake           numeric(4, 1)   not null,
  caffeine_mg             numeric(6, 1)   not null,
  sleep_hours             numeric(3, 1)   not null,
  sleep_quality           public.sleep_quality_type not null,
  bmi                     numeric(4, 1)   not null,
  heart_rate              smallint        not null check (heart_rate >= 0),
  stress_level            public.stress_level_type  not null,
  physical_activity_hours numeric(3, 1)   not null,
  health_issues           public.health_issues_type not null,
  occupation              public.occupation_type    not null,
  smoking                 boolean         not null default false,
  alcohol_consumption     boolean         not null default false
);

alter table public.coffee_health enable row level security;

create policy "Allow public read access"
  on public.coffee_health
  for select
  using (true);
