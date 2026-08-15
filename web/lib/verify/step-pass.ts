// ClickUp 86eyn28kn — orta addımda ilişmə çıxışı. Qızıl qayda: keçid final cavabı AÇMIR,
// `error_code` yazılmadan irəli getmir. «Cavabı göstər» yalnız son addımda qalır (86eymrkjn).
//
// Klient qapısı ipucunu da tələb edir (server ipucunu saxlamır). Server qapısı
// `step_events`-dəki səhv cəhdə söykənir — klientin "wrong" statusuna ETİBAR EDİLMİR.

export type StepPassClientGate = {
  isLastStep: boolean;
  hintOpen: boolean;
  status: "idle" | "checking" | "correct" | "wrong" | "network_error";
};

export function canPassStuckStep(g: StepPassClientGate): boolean {
  return !g.isLastStep && g.hintOpen && g.status === "wrong";
}

export type StepPassServerGate = {
  isLastStep: boolean;
  alreadyCorrect: boolean;
  hasWrongAttempt: boolean;
};

export function resolveStepPass(
  g: StepPassServerGate,
): { ok: true } | { ok: false; error: "last_step" | "already_correct" | "no_wrong_attempt" } {
  if (g.isLastStep) return { ok: false, error: "last_step" };
  if (g.alreadyCorrect) return { ok: false, error: "already_correct" };
  if (!g.hasWrongAttempt) return { ok: false, error: "no_wrong_attempt" };
  return { ok: true };
}
