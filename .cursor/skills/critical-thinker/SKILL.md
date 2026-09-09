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

For high-stakes decisions, subtle bug investigations, or architectural modifications, execute a formal multi-thought sequential analysis using the `sequential-thinking` MCP server (`sequentialthinking` tool).

### Standard Execution Pattern

Break down the problem across 5 to 10 thoughts before proposing modifications.
Use branching (`branchFromThought`) to explore alternative hypotheses and revisions (`isRevision: true`) when assumptions are falsified.

---

## 3. The 5-Whys Root Cause Analysis

Do not stop at the first visible error message or bug symptom. Trace the causal chain 5 levels down to unearth architectural flaws before writing fixes.

---

## 4. Inversion Technique (Pre-Mortem)

Before finalizing any technical plan, invert the question:
> *"Təsəvvür edək ki, sabah bu funksiya production-da 100 şagirdin qarşısına çıxdı və tamamilə iflas etdi. Bu necə baş verdi?"*

Primary checkpoints: Offline/slow cellular networks, blurry or handwritten DİM pages, answer leakage, hidden unit cost blowouts.

---

## 5. Invariant Gatekeeper Checklist

Every architectural or code proposal must pass these 5 gates:
1. Golden Rule: Error code taxonomy preserved.
2. Zero Leakage: No answer hints before verification.
3. Unit Economics: $\le \$0.010$/solve.
4. Three-State Honesty: `verification.verified` (`true`/`false`/`null`).
5. Self-Healing Schema: No hard student-path FK 500 crashes.
