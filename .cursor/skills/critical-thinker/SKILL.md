---
name: critical-thinker
description: >-
  Applies Socratic mirroring, deep critical thinking, sequential thinking MCP workflows, and root-cause analysis to challenge assumptions, resolve pedagogical dilemmas, and prevent regressions in core error_code taxonomy. Use when evaluating complex architectural decisions, solving ambiguous bugs, deliberating trade-offs, or validating that proposals obey the project's golden rules.
---

# Critical Thinker & Socratic Analyst

A cognitive framework designed to prevent superficial implementations, identify hidden pitfalls, challenge premature consensus, and rigorously preserve the pedagogical integrity and unit economics of Təhsil Platforması.

---

## 1. The Core Stance: Socratic Mirroring

When presented with a complex problem, ambiguous feature request, or architectural choice, **do not jump directly to code generation**. First mirror and interrogate the premise.

### The Mirroring Workflow

1. **Reflect & Reframe**:
   Restate the user's or stakeholder's prompt in explicit, unvarnished terms:
   > *"Sizin təklifiniz əslində X problemini həll etmək üçün Y mexanizmini təklif edir, lakin bu Z kompromisini qəbul etmək deməkdir."*
2. **Expose Implicit Assumptions**:
   Identify what must be true for the proposal to succeed:
   - Does this assume reliable low-latency network connections on mobile?
   - Does this assume the student already understands mathematical terminology?
   - Does this assume the LLM will reliably follow instructions without strict JSON schema enforcement?
3. **Socratic Probing Questions**:
   - **Tələbin kökü**: Bu dəyişikliyin arxasındakı real problem nədir? Səthi simptom yoxsa fundamental çatışmazlıq?
   - **Qızıl Qayda testi**: Bu dəyişiklik `error_code` taksonomiyasını və səhvin adlandırılmasını zəiflədirmi? Şagirdə hazır cavab vermək asanlığı yaradırmı?
   - **Alternativ yollar**: Bu problemi kod yazmadan, sadəcə prompt təkmilləşdirməsi və ya deterministik şablon (Qat 3) ilə həll etmək mümkündürmü?
   - **Yan təsirlər**: Əgər bu funksiya uğursuz olarsa, şagird təcrübəsi və ya vahid iqtisadiyyatı ($0.010/həll) necə təsirlənəcək?

---

## 2. Sequential Thinking Protocol (MCP Integration)

For high-stakes decisions, subtle bug investigations, or architectural modifications, execute a formal multi-thought sequential analysis using the `sequential-thinking` MCP server (`sequentialthinking` tool via `call_mcp_tool`).

### Standard Execution Pattern

```typescript
// Initial thought: Frame the problem and estimate depth
call_mcp_tool({
  ServerName: "sequential-thinking",
  ToolName: "sequentialthinking",
  Arguments: {
    thought: "Problemin dekonstruksiyası: [Məsələnin dəqiq təsviri]. Hipotez 1: ... Hipotez 2: ...",
    thoughtNumber: 1,
    totalThoughts: 5,
    nextThoughtNeeded: true
  }
});
```

### Thought Progression Rules

1. **Thought 1 (Framing & Hypothesis Generation)**: Define boundary conditions, invariants, and competing hypotheses.
2. **Thought 2 (Analytical Testing & Data Grounding)**: Verify against real files (`CLAUDE.md`, `STEP-SCHEMA.json`, `docs/DATA-MODEL.md`, `prompts/`).
3. **Thought 3 (Branching / Inversion)**:
   - Use `branchFromThought` and `branchId` to evaluate an alternative hypothesis:
     *"Bəs əgər problem LLM-də deyil, kliyentin visualViewport listener-indədirsə?"*
4. **Thought 4 (Revision & Counter-Evidence)**:
   - Use `isRevision: true` and `revisesThought` if an earlier assumption is falsified by project evidence.
5. **Thought 5 (Synthesis & Decisive Verdict)**:
   - Summarize the verified resolution and set `nextThoughtNeeded: false`.

---

## 3. The 5-Whys Root Cause Analysis

Do not stop at the first visible error message or bug symptom. Trace the causal chain 5 levels down:

```
[Semptom]: Şagird addımı cavablamadan "Növbəti" basıb keçdi.
  ↳ Niyə? Kliyent UI-da "Keç" düyməsi error_code tələb etmədən aktivləşdi.
    ↳ Niyə? API /api/steps/pass endpoint-i statusu yoxlamadan 200 qaytardı.
      ↳ Niyə? persist.ts-də step_events cədvəlinə is_correct=false yazıldı, amma error_code null getdi.
        ↳ Niyə? Prompt addım üçün xüsusi distractor/misconception kodu təyin etməmişdi.
          ↳ Kök Səbəb: Qat 5 sistem promptunda orta addımlar üçün məcburi distractor qaydası unudulub.
```

---

## 4. Inversion Technique (Pre-Mortem)

Before finalizing any technical plan, invert the question:
> *"Təsəvvür edək ki, sabah bu funksiya production-da 100 şagirdin qarşısına çıxdı və tamamilə iflas etdi. Bu necə baş verdi?"*

### Primary Inversion Checkpoints

1. **Offline / Zəif Şəbəkə**: Şagird kənd yerində 3G ilə şəkil çəkir, 19 saniyə gözləyir və səhifəni bağlayır.
2. **Bulanıq / Əyri DİM Səhifəsi**: Şagird qələmlə qaralanmış test toplusunu çəkir. Qat 1 OCR səhv oxuyur, Qat 5 isə xəyali tənlik həll edir.
3. **Cavab Ovcuna Verilməsi**: İpucu o qədər açıqdır ki, şagird düşünmədən cavabı yazır və öyrənmə sıfır olur.
4. **Gizli Xərc Partlayışı**: Bir istifadəçi eyni sualı 10 dəfə fərqli bucaqdan çəkir, keş bypass olur, xərc \$0.15-ə qalxır.
5. **Giriş Baryerləri & Premature Auth (Drop-off tələsi)**: Şagirdin qarşısına girişdə email/şifrə divarı qoyulur (40–60% drop-off). Şagird linki Telegram/Instagram-dan açanda Google OAuth in-app webview-də `403: disallowed_useragent` atır və tətbiq tərk edilir.

---

## 5. Invariant Gatekeeper Checklist

Every architectural or code proposal must pass these 5 gates:

| Qapı | Tələb | Keçid Şərti |
|---|---|---|
| **Qızıl Qayda** | Səhvin adlandırılması (`error_code`) | Səhvi dəqiq adlandırmayan heç bir həll qəbul edilmir. |
| **Sızma Qadağası (ADR-017)** | Sıfır sızma (`leak_rate = 0%`) | Aralıq addımlarda yekun cavab və ya həllin açarı əsla görünməməlidir. |
| **Vahid İqtisadiyyatı** | $\le \$0.010$/həll | Keş qatları (0, 2, 3) işləməli, gərəksiz LLM çağırışları bloklanmalıdır. |
| **Üçlü Status Dürüstlüyü** | `verification.verified` | `true`, `false` və ya `null`. `method='none'` olduqda əsla `true` göndərilməməlidir. |
| **Özünü-Sağaldan Sxem** | Self-healing student path | Şagird axınında naməlum `topic_code`/`error_code` üçün DB 500 atmamalı, `needs_review=true` ilə qeydə almalıdır. |
