-- `get_advisors(security)` `0043`-dən sonra 3 yeni WARN göstərdi: `private.acc_num`/
-- `mk_distr`/`distr` (`0038`/`0039`) açıq `search_path` təyin etmirdi — `resolve_translation`-da
-- (gate-78, `0029`) düzəldilən EYNİ sinif zəiflik (çağıran öz sessiyasında `search_path`-i
-- dəyişib fərqli obyekt həll etdirə bilər). Üçü də `LANGUAGE sql immutable`, `SECURITY
-- DEFINER` DEYİL — praktiki risk aşağıdır, amma dəyişiklik pulsuzdur, advisor-u təmiz saxlayır.

alter function private.acc_num(numeric) set search_path = private, pg_temp;
alter function private.mk_distr(jsonb, text, text) set search_path = private, pg_temp;
alter function private.distr(jsonb, jsonb) set search_path = private, pg_temp;
