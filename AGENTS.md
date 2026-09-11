# AGENTS — Cursor və Antigravity əməliyyat təlimatı

Konstitusiya `CLAUDE.md`-dir. Cowork onu yeniləyir. Bu fayl icraçı agentlərə (Cursor və Antigravity) **haradan oxumağı** deyir, yaşayan vəziyyəti təkrar etmir.

## Rollar

| Kim | Harada | İş |
|---|---|---|
| Cowork | Claude Project | BA / PO, `CLAUDE.md`, `PRODUCT.md`, `STEP-SCHEMA.json` |
| Cursor | IDE | executor. `main`-də işlə, HANDOFF yaz, ClickUp yenilə |
| Antigravity | IDE / CLI | executor. `main`-də işlə, HANDOFF yaz, ClickUp yenilə |

## Kontekst büdcəsi

Yaşayan rəqəm, növbə bloku, model adı, miqrasiya nömrəsi **qaydaya/skill-ə köçürülmür**. Onlar bir neçə gündə köhnəlir və token yeyir.

| Ehtiyac | Nə et | Nə etmə |
|---|---|---|
| Cari növbə | `docs/HANDOFF.md` — **yalnız ilk ~80 sətir** (ən yeni yuxarıdadır) | Faylı axtarma, indeksdən gətir, tam oxu |
| Qapı / faza | `docs/PHASE-1.md` | `CLAUDE.md`-dəki köhnə xülasəni həqiqət say |
| Aktiv model / xərc | DB `app_config.active_model`, `attempt_items.cost_usd` | Bu fayldakı və ya `PRODUCT.md`-dəki rəqəm |
| Səhv kodu | `docs/STEP-SCHEMA.json` → `error_codes` | Enum-u qaydaya yapışdır |
| Hadisə adı | `docs/TELEMETRY.md` | Yeni adı kodda uydur |
| Token / rəng | `docs/DESIGN-TOKENS.json` | Komponentdə hardcode |
| Sxema | `supabase/migrations/` (sıra). `DATA-MODEL.md` icmaldır | Yalnız sənədə güvən |

## Sessiya

1. Kod yazmazdan əvvəl HANDOFF-un son 2 blokunu oxu.
2. ClickUp tapşırığını `in progress`-ə çək (MCP: `user-clickup_extended_local`).
3. Bitəndə: `close-session` skill — HANDOFF prepend, `LOG.md` 3 sətir, ClickUp `complete`, **commit** (gözləmə).
4. Ayrı feature branch açma. `main`-ə merge olunmayan kod Vercel-ə çatmır.
5. İstifadəçi push istəyəndə `git push`-dan SONRA mütləq verify et: `gh run list --limit 1` (CI) və `vercel ls` (deploy). Status `failure`/`Error` olarsa "tamamlandı" demə, logu aç (`gh run view --log-failed`, `vercel inspect <url> --logs`) və səbəbi bildir.

## Agent konfiqurasiya xəritəsi

| Parça | Cursor | Antigravity | Nə vaxt yüklənir |
|---|---|---|---|
| Qaydalar | `.cursor/rules/*.mdc` (`.agents/rules/*.md` məzmunu, Cursor frontmatter) | `AGENTS.md` + `.agents/rules/*.md` | Always / glob / iyerarxik |
| Skill-lər | `.cursor/skills/` (mənbə: `.agents/skills/` via `scripts/sync-agent-context.mjs`) | `.agents/skills/` | Təsvir uyğun gələndə |
| Hook-lar | `.cursor/hooks.json` (Cursor shell/read qoruyucuları — Antigravity hook JSON-u köçürülmür) | `.agents/hooks.json` | PreToolUse (komanda, sirr), Stop |
| Subagent | `.cursor/agents/` (mənbə: `.agents/agents/`) | `define_subagent` / `invoke_subagent` | Tələb olduqda |
| MCP | Supabase, ClickUp, Slack | Supabase, sequential-thinking, github, chrome | Alət çağırışı |

Spesifik bacarıqlar:
- Düşüncə və Sokratik analiz → `critical-thinker` (sequential-thinking MCP).
- Backend, kaskad və DB → `backend-developer`.
- Tələblərin təhlili və texniki sənədləşdirmə → `it-business-analyst`.
- Şagird və abituriyent gözü ilə sınaq / erqonomika → `student-reviewer`.
- Məhsul sualı → `product-analyst` skill və ya `product` subagent.
- UI audit → `ux-audit` və ya `ux-design-review` skill (əvvəl `known-state.md`).
- Hərtərəfli test planlar, ssenarilər və axın optimizasiyası → `qa-tester` skill və ya `qa_tester` subagent.
- Koddan sonra → `reviewer` subagent.
