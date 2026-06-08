// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md §5] Phase 1 observability span + lightweight logger
// Logger is OFF by default. Never logs secrets/keys.
import type { TelemetrySpan } from "../schemas/telemetry.js";

export type LogLevel = "off" | "summary" | "trace" | "debug";

let level: LogLevel = "off";
export function setLogLevel(l: LogLevel): void {
  level = l;
}

const sink: TelemetrySpan[] = [];

/** Record a span. Suppressed entirely when level is "off". */
export function recordSpan(span: TelemetrySpan): void {
  if (level === "off") return;
  sink.push(span);
}

export function getSpans(): readonly TelemetrySpan[] {
  return sink;
}

let counter = 0;
/** Deterministic id helper (no Math.random / Date in this layer for testability). */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}
