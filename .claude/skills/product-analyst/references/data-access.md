# Getting real evidence instead of guessing

## Production vs. local — know which one you're looking at

This product's real database (Supabase project `oxjzehxnbumgyoqjonju`, reachable via
the Supabase MCP tools when connected) holds whatever real state exists — as of this
skill's authoring, that's 15-20 pilot-scale device rows at most, since the Phase 1 gate
has not yet been passed (check `docs/HANDOFF.md`'s latest entries to see whether that's
still true). A local Docker Postgres (see `ux-design-review/references/
testing-methodology.md` for setup) may also exist with **synthetic seed/test data** —
never present a query result from the local database as if it describes real student
behavior. Always state which database a number came from.

**Check for real data before analyzing it as if it's real:**

```sql
select count(*) as total_attempts,
       count(distinct device_id) as distinct_devices,
       min(created_at) as earliest, max(created_at) as latest
from attempts;
```

If `distinct_devices` is small and `earliest`/`latest` cluster around known development
sessions (cross-check against `docs/HANDOFF.md` dates), this is development/smoke-test
data, not usage data — say so. If asked to assess retention or engagement and only this
kind of data exists, the honest answer is "not measurable yet, here's what the query
will look like once real students are active" — include the query, don't skip the
question.

## Queries that answer the gate's own two conditions, once real data exists

**Volume** (100+ real solves):
```sql
select count(*) from attempt_items where delivered = true;
```

**Retention** (≥8 of 20 devices return ≥3 times within 7 days of their first solve) —
this needs a per-device first-solve anchor, not a calendar week:
```sql
with first_solve as (
  select a.device_id, min(ai.created_at) as first_at
  from attempt_items ai join attempts a on a.id = ai.attempt_id
  where ai.delivered = true
  group by a.device_id
),
returns_in_window as (
  select fs.device_id, count(*) as solves_in_7d
  from first_solve fs
  join attempts a on a.device_id = fs.device_id
  join attempt_items ai on ai.attempt_id = a.id
  where ai.delivered = true
    and ai.created_at >= fs.first_at
    and ai.created_at < fs.first_at + interval '7 days'
  group by fs.device_id
)
select count(*) filter (where solves_in_7d >= 3) as retained_devices,
       count(*) as total_devices
from returns_in_window;
```

Sanity-check this query's own correctness against a synthetic case before trusting its
output on real data — insert a few fake rows with known timestamps, verify the count
comes out right, then delete them (see the cleanup discipline in
`ux-design-review/references/testing-methodology.md`, same rule applies here).

## Funnel / drop-off, from the `events` table

`docs/TELEMETRY.md`'s event names are the funnel steps. A rough drop-off query for the
core solve funnel:

```sql
select name, count(distinct attempt_id) as unique_attempts
from events
where name in ('capture.screen_opened', 'capture.photo_taken', 'crop.confirmed',
                'solve.requested', 'solve.response', 'solution.completed')
group by name
order by array_position(
  array['capture.screen_opened','capture.photo_taken','crop.confirmed',
        'solve.requested','solve.response','solution.completed'], name);
```

Read the actual current event list from `docs/TELEMETRY.md` before running this — the
list above is illustrative and may drift; don't hardcode it from memory across
sessions.

## Cost tracking

```sql
select date_trunc('day', created_at) as day,
       count(*) as items,
       sum(cost_usd) as total_cost_usd,
       avg(cost_usd) as avg_cost_per_item,
       count(*) filter (where match_path != 'llm') as cache_hits,
       round(100.0 * count(*) filter (where match_path != 'llm') / nullif(count(*),0), 1) as cache_hit_pct
from attempt_items
where cost_usd is not null
group by 1 order by 1;
```

`match_path` values are the taxonomy from `docs/TELEMETRY.md` (`hash`/`fingerprint`/
`llm`/`image_cache`/`bank` as of this writing — confirm against the live doc). A
`cache_hit_pct` trend over time, once real usage exists, is the single most direct
readout on whether the unit-economics mitigations in `product-context.md` are actually
working, versus existing in code but rarely triggering.
