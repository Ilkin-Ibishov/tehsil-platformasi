-- HANDOFF (49) §1: `0005_solutions_verified_nullable.sql`-dən ƏVVƏL yazılan sətirlər hardcode
-- `verified=true` daşıyır, hətta `verification_method='none'` (yəni sympy YOXLAMADIĞI) olsa belə —
-- köhnə kodun sütunu `NULL` qəbul etməməsinin nəticəsi (bax 0005-in şərhi). Sütun indi üçlü
-- dəyəri dəstəkləyir, köhnə sətirlər öz həqiqi vəziyyətinə (yoxlanılmayıb) geri qaytarılmalıdır.

update solutions set verified = null where verification_method = 'none';
