# Bank Seed Verification — Post-Merge S6 Check

> **Audience:** Product Performancer / QA
> **Context:** PR bank-seed-camera-format follows PR #9 (fingerprint stripping)
> **Goal:** Verify that Qat 2 (bank_fingerprint) emits `match_path=fingerprint` after seed

## Background

**Before this PR:**
- Bank contained 225 rows in synthetic template format: `FAIZ.OF|n=300|p=5`
- Camera used natural DİM format: `"15. Mağazada birinci gün... A) 58% B) 68%..."`
- Formats never matched → 100% `match_path=llm` (40/40 recent camera solves)

**PR #9:** Stripped answer choice digits (A) 58% B) 68%) from fingerprint calculation
**This PR:** Seeds bank with 10 real DİM camera-format questions

**Expected:** Camera solves matching seed questions should now emit `match_path=fingerprint`

---

## Pre-Merge Verification (Development)

Run the verification script:

```bash
node scripts/verify-bank-seed.mjs
```

**Expected output:**
```
✓ ALL TESTS PASSED

VERDICT: Bank seed migration is READY.
After merge + migration apply, Qat 2 (bank_fingerprint) should emit
match_path="fingerprint" for camera captures matching these questions.
```

This proves:
1. ✅ Fingerprint logic strips answer choices correctly
2. ✅ Seed questions' `fingerprint_digits` match computed values
3. ✅ Choice order doesn't affect fingerprint (ambiguity protection)

---

## Post-Merge Verification (Production)

### Step 1: Confirm migration applied

```sql
select count(*) from questions where source = 'dim_seed_camera';
```

**Expected:** `10` rows

### Step 2: Check seed fingerprints

```sql
select 
  substring(canonical, 1, 60) as canonical_preview,
  fingerprint_digits,
  topic_code
from questions 
where source = 'dim_seed_camera'
limit 5;
```

**Expected sample row:**
```
canonical_preview                                            | fingerprint_digits | topic_code
-------------------------------------------------------------|--------------------|-----------------------
15. Mağazada birinci gün bütün malın 20%-i, ikinci gün isə | 15,20,60           | ARITH.PERCENT_OF
```

Note: `fingerprint_digits` does NOT include choice values (58, 68, 72, 80, 88)

### Step 3: Manual camera test

**Simulate a real camera solve** with one of the seed questions:

1. Open `/kamera` in production
2. Upload or capture a photo containing question Q1:
   ```
   15. Mağazada birinci gün bütün malın 20%-i, 
   ikinci gün isə qalan malın 60%-i satıldı. 
   İki gündə mağazadakı bütün malın neçə faizi satıldı?
   A) 58%  B) 68%  C) 72%  D) 80%  E) 88%
   ```
3. Submit solve
4. **Check telemetry** (next step)

### Step 4: Query telemetry for bank hits

```sql
select 
  props->>'match_path' as match_path,
  props->>'layer' as layer,
  props->>'topic_code' as topic_code,
  count(*) as count
from events
where name = 'solve.cascade'
  and created_at >= now() - interval '1 day'
group by props->>'match_path', props->>'layer', props->>'topic_code'
order by count desc;
```

**Expected to see:**
```
match_path   | layer              | topic_code           | count
-------------|--------------------|--------------------- |------
fingerprint  | bank_fingerprint   | ARITH.PERCENT_OF     | 1     ← NEW! Was 0 before
llm          | llm_text           | ...                  | ...   ← Still majority (non-matching questions)
```

### Step 5: Verify response carries match_path

```sql
select 
  ai.match_path,
  q.topic_code,
  q.fingerprint_digits,
  substring(q.canonical, 1, 50) as canonical_preview
from attempt_items ai
join attempts a on a.id = ai.attempt_id
join questions q on q.id = ai.question_id
where a.kind = 'photo_solve'
  and ai.created_at >= now() - interval '1 hour'
  and ai.match_path != 'llm'  -- Filter to bank hits only
order by ai.created_at desc
limit 5;
```

**Expected:** At least one row with `match_path = 'fingerprint'`

---

## Success Criteria

✅ **S6 PASS:** At least **1 camera solve** emits `match_path=fingerprint` within 24h of merge

- [ ] Migration applied (10 seed rows present)
- [ ] Manual camera test completed with a seed question
- [ ] Telemetry shows `match_path=fingerprint` / `layer=bank_fingerprint`
- [ ] `attempt_items.match_path` contains non-`llm` value

---

## Troubleshooting

### No fingerprint hits observed

1. **Check cascade is enabled:**
   ```sql
   select * from app_config where key = 'cascade_enabled';
   ```
   Expected: `value = '1'`

2. **Check fingerprint stripping (PR #9):**
   - Verify PR #9 is merged and deployed
   - Check `bank.ts` contains the choice-stripping regex:
     ```typescript
     const withoutChoices = canonical.replace(/\b[A-Ea-e]\)\s*-?\d+(\.\d+)?%?\b/g, '');
     ```

3. **Check question was actually in seed set:**
   - Compare camera canonical with seed questions in migration 0075
   - Fingerprint must match EXACTLY (including question number prefix)

4. **Check logs for bank layer execution:**
   - Look for `[cascade/bank_fingerprint]` log entries
   - Check for "NAMIZƏD" (candidate) messages

### Fingerprint ambiguity

If you see logs like:
```
[cascade/bank_fingerprint] 2 namizəd, topic_code='...' ayırmadı — İMTİNA
```

This means:
- Multiple questions have the same fingerprint (same digits)
- `topic_code` couldn't disambiguate them
- System **correctly** refused to guess (returned `null` → next layer)

**This is expected behavior** (ADR-020 T2: fingerprint alone isn't always unique)

---

## Seed Questions Reference

| ID  | Question Preview | Fingerprint | Topic |
|-----|------------------|-------------|-------|
| Q1  | 15. Mağazada... 20%-i... 60%-i | `15,20,60` | ARITH.PERCENT_OF |
| Q2  | 23. x² - 7x + 12 = 0 | `23,7,12,0` | ALG.VIETA_PRODUCT |
| Q3  | 8. 3x + 5 = 20 | `8,3,5,20` | ALG.LINEAR_EQUATION |
| Q4  | 12. Kitabın qiyməti 50... 20% artırıldı | `12,50,20` | ARITH.PERCENT_INCREASE |
| Q5  | 17. √48 sadələşdirin | `17,48,3,2,3,2,6` | ALG.SQUARE_ROOT_SIMPLIFY |
| Q6  | 5. 24/36 kəsrini sadələşdirin | `5,24,36,2,3,4,5,6` | ARITH.FRACTION_SIMPLIFY |
| Q7  | 19. 5 alma 10 manat... 8 alma? | `19,5,10,8` | ARITH.PROPORTION |
| Q8  | 31. x² + 6x + 9 = 0 kökü | `31,6,9,0` | ALG.QUADRATIC_DISCRIMINANT |
| Q9  | 14. 3,7,11,15... 10-cu hədd | `14,3,7,11,15,10` | ALG.ARITHMETIC_SEQUENCE |
| Q10 | 21. Ədədin 25%-i 40 | `21,25,40` | ARITH.PERCENT_REVERSE |

**Easiest test:** Q1 (two-stage percent problem) — common DİM pattern, clear fingerprint

---

## Notes for Future Expansion

This seed is **intentionally small** (10 questions) to:
- Prove the architecture works
- Verify fingerprint matching in production
- Establish baseline for future bank growth

**Next steps** (separate PRs):
- Seed 50–100 more real DİM questions from `evals/golden-set-math-dim-vB.jsonl`
- Add eval harness test: `scripts/eval.py --expect-bank-hits <set>`
- Automated fingerprint validation in CI

---

**Last updated:** 2026-09-11 (seed PR)
**Related:** PR #9 (fingerprint stripping), ADR-020 (cascade layers), ClickUp bank-bake
