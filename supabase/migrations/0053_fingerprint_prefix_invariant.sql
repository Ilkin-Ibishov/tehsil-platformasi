-- 0053 · Fingerprint prefiks invariantı (yekun forma)
-- DB-də tətbiq adı: 0051_fingerprint_invariant_correct_source_value (20260813204513)
--
-- INV-01. Yalnız müəllif bankı (source='generated') prefiksli formatdan istifadə edir.
-- user_capture prefiksiz yazır; bank.ts onu `fingerprint_digits` GENERATED sütunu ilə
-- uyğunlaşdırır (ADR-020), ona görə invariant ona şamil edilmir.

create or replace function public.assert_fingerprint_prefix()
returns trigger language plpgsql as $$
declare
  expected text;
begin
  if new.numeric_fingerprint is null then return new; end if;

  if new.source is distinct from 'generated' then return new; end if;

  select fingerprint_prefix into expected
  from public.topic_codes where code = new.topic_code;

  if expected is null then return new; end if;
  if position('|' in new.numeric_fingerprint) = 0 then return new; end if;

  if split_part(new.numeric_fingerprint, '|', 1) is distinct from expected then
    raise exception
      'fingerprint prefiksi uyğunsuzdur: topic_code=% gözlənilən=% alınan=%',
      new.topic_code, expected, split_part(new.numeric_fingerprint, '|', 1);
  end if;

  return new;
end $$;

drop trigger if exists trg_assert_fingerprint_prefix on public.questions;
create trigger trg_assert_fingerprint_prefix
  before insert or update of numeric_fingerprint, topic_code on public.questions
  for each row execute function public.assert_fingerprint_prefix();
