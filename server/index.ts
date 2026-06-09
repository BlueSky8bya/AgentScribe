// ===========================================================================
// [PROPOSAL: docs/proposals/archive/2026-06-09/proposal_phase3b_llm_expander_v001.md] file created under this proposal
// Minimal LLM backend. POST /api/expand only. The provider API key lives in
// server env (OPENAI_API_KEY) and is never sent to the client or logged.
// Dev-only hardening: CORS restricted to localhost, request body size limit,
// simple in-memory rate limit. Public deployment needs auth/usage limits (deferred).
// ===========================================================================
import express, { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import { sanitizeExpandRequest } from "./inputFirewall.js";
import { route } from "./modelRouter.js";
import { LlmExpander } from "./llmExpander.js";
import { listProviderSummaries, canRunRealGeneration } from "./providers/capabilityMatrix.js";

const PORT = Number(process.env.PORT ?? 8787);

// CORS: localhost origins only (dev). No wildcard.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
]);

function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}

// Simple fixed-window in-memory rate limit (per IP). Dev-grade only.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    next();
    return;
  }
  if (rec.count >= RATE_MAX) {
    res.status(429).json({ error_type: "rate_limited" });
    return;
  }
  rec.count++;
  next();
}

const app = express();
app.use(cors);
app.use(express.json({ limit: "64kb" }));
app.use(rateLimit);

// Provider availability (status + key presence). NEVER returns any key value.
app.get("/api/providers", (_req: Request, res: Response) => {
  res.json({ providers: listProviderSummaries() });
});

app.post("/api/expand", async (req: Request, res: Response) => {
  let request;
  try {
    request = sanitizeExpandRequest(req.body);
  } catch (e) {
    res.status(400).json({ error_type: e instanceof ZodError ? "invalid_request" : "bad_request" });
    return;
  }
  // No silent substitution: an explicitly-chosen provider that cannot generate
  // real output (mock without dev flag / missing key) is rejected, not swapped.
  const chosen = request.options?.provider;
  if (chosen && !canRunRealGeneration(chosen)) {
    res.status(409).json({ error_type: "provider_unavailable", provider: chosen });
    return;
  }
  try {
    const decision = route({
      provider: chosen,
      effective_scale: request.effective_scale,
      budget_class: request.options?.budget_class,
      quality_pref: request.options?.quality_pref,
    });
    const expander = new LlmExpander();
    const { expansion, cost } = await expander.expandDetailed(
      { seed: request.seed, characters: request.characters, effective_scale: request.effective_scale },
      decision,
    );
    res.json({ expansion, cost });
  } catch {
    // Never leak internals (no key, no prompt, no stack) to the client.
    res.status(500).json({ error_type: "server_error" });
  }
});

// Started directly (not under test import).
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  app.listen(PORT, () => {
    console.log(`[AgentScribe] expand API on http://localhost:${PORT}`);
  });
}

export { app };
