// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2c_canary_fallback_fix_v001.md section 7] file created under this proposal
// Generic wall-clock timeout. Rejects with Error("timeout") if the promise does
// not settle in time. Provider-agnostic (works for any SDK call).
// ===========================================================================
export function withTimeout<T>(p: Promise<T>, ms: number, label = "timeout"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}
