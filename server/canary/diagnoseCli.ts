// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3c2c_canary_fallback_fix_v001.md section 3] file created under this proposal
// CLI: npm run canary:diagnose -- <claude|gemini>. Owner runs with key in .env +
// ALLOW_GATED_LIVE_CANARY=1. Prints a REDACTED diagnosis (failure_type counts,
// representative zod paths, latency) — never a key, prompt, output, or payload.
// ===========================================================================
import type { ProviderId } from "../providers/capabilityMatrix.js";
import { hasKey, gatedLiveCanaryAllowed } from "../providers/capabilityMatrix.js";
import { diagnoseProvider } from "./diagnose.js";

async function main(): Promise<void> {
  try { process.loadEnvFile(); } catch { /* no .env present */ }
  const provider = process.argv[2] as ProviderId | undefined;
  if (provider !== "claude" && provider !== "gemini") {
    console.error("usage: canary:diagnose -- <claude|gemini>");
    process.exit(2);
  }
  if (!gatedLiveCanaryAllowed()) {
    console.error("refused: set ALLOW_GATED_LIVE_CANARY=1 (dev only)");
    process.exit(2);
  }
  if (!hasKey(provider)) {
    console.error(`refused: missing server env key for ${provider}`);
    process.exit(2);
  }
  const report = await diagnoseProvider(provider);
  console.log(JSON.stringify(report, null, 2)); // redacted by construction
}

if (process.argv[1] && process.argv[1].endsWith("diagnoseCli.ts")) {
  main().catch((e) => { console.error("diagnose error:", e instanceof Error ? e.name : "unknown"); process.exit(1); });
}
