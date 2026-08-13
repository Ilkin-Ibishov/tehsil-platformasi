-- 0051 · Taksonomiya cədvəlləri + fingerprint invariantı
-- DB-də tətbiq adı: 0049_taxonomy_reference_tables_and_fingerprint_invariant (20260813202812)
-- DİQQƏT: bu miqrasiyanın sərt FK-ları 0052-də geri alınıb (produksiya riski).

create table if not exists public.topic_codes (
  code               text primary key,
  fingerprint_prefix text unique,   -- null = bank şablonu yoxdur
  title_az           text not null,
  bank_matchable     boolean not null default false,
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

insert into public.topic_codes (code, fingerprint_prefix, title_az, bank_matchable) values
  ('ALG.LINEAR_EQUATION',    'LIN',      'Xətti tənlik',          true),
  ('ALG.QUADRATIC_EQUATION', 'QUAD.MIN', 'Kvadrat tənlik',        true),
  ('ALG.VIETA_SUM',          'QUAD.SUM', 'Viyet teoremi',         true),
  ('ARITH.PERCENT_OF',       'FAIZ.OF',  'Ədədin faizi',          true),
  ('ARITH.PERCENT_INCREASE', 'FAIZ.INC', 'Faizlə artım',          true),
  ('ALG.WORK_RATE',           null,      'İş-məhsuldarlıq',       false),
  ('ARITH.PERIODIC_DECIMALS', null,      'Dövri onluq kəsrlər',   false),
  ('GEO.ANALYTIC_3D',         null,      'Fəza analitik həndəsə', false),
  ('PROB.BASIC',              null,      'Sadə ehtimal',          false),
  ('STAT.MEDIAN',             null,      'Median',                false)
on conflict (code) do nothing;

create table if not exists public.error_codes (
  code        text primary key,
  title_az    text not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.error_codes (code, title_az, description) values
  ('SIGN_CHOICE',         'İşarə seçimi',        'Mənfi/müsbət işarə səhv seçilib'),
  ('OPERATION_CONFUSION', 'Əməl qarışıqlığı',    'Vurma/bölmə və ya toplama/çıxma qarışdırılıb'),
  ('PLACE_VALUE',         'Mərtəbə dəyəri',      'Onluq vergülün yeri səhvdir'),
  ('SCOPE_CONFUSION',     'Baza qarışıqlığı',    'Faiz səhv bazadan götürülüb'),
  ('FORMULA_MISAPPLIED',  'Düstur səhv tətbiqi', 'Düzgün düstur, səhv yerləşdirmə'),
  ('TRANSPOSE_SIGN',      'Keçirmə işarəsi',     'Tərəf dəyişəndə işarə dəyişdirilməyib'),
  ('ROOT_SELECTION',      'Kök seçimi',          'Kvadrat tənlikdə səhv kök seçilib'),
  ('INCOMPLETE_ANSWER',   'Yarımçıq cavab',      'Cavabın bir hissəsi yazılıb'),
  ('ARITHMETIC',          'Hesablama səhvi',     'Metod düzgün, hesablama səhv'),
  ('UNKNOWN',             'Tanınmayan',          'Heç bir distraktora uyğun gəlmir')
on conflict (code) do nothing;

grant select on public.topic_codes, public.error_codes to app_runtime;

comment on table public.topic_codes is
  'Mövzu kodlarının yeganə həqiqət mənbəyi. fingerprint_prefix BURADAN oxunur, topic_code-dan törədilmir.';
