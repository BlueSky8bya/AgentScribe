// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 9] Phase 2 Preflight Room UI
import { useState } from "react";
import type { WorkRecord } from "../core/schemas/index.js";
import { reviewBlueprint } from "../core/editorialRoom.js";
import { lockBlueprint } from "../core/preflight/lockBlueprint.js";

export function PreflightRoom({ work }: { work: WorkRecord }) {
  const [current, setCurrent] = useState<WorkRecord>(work);
  const [acks, setAcks] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const { gate, canary } = reviewBlueprint(current);
  const warnAxes = gate.findings.filter((f) => f.severity === "warn").map((f) => f.axis);

  function toggleAck(axis: string) {
    setAcks((a) => (a.includes(axis) ? a.filter((x) => x !== axis) : [...a, axis]));
  }

  function onLock() {
    const r = lockBlueprint(current, acks);
    if (r.locked && r.work) {
      setCurrent(r.work);
      setMessage("Locked. Zones tagged (Hard/Soft/Fluid).");
    } else if (r.needs_ack.length > 0) {
      setMessage("Acknowledge warnings to proceed: " + r.needs_ack.join(", "));
    } else {
      setMessage("Lock refused:\n" + r.reasons.join("\n"));
    }
  }

  return (
    <div className="preflight">
      <h2>Editorial Room — {current.public.seed.work_id}</h2>
      <p>Lock status: <strong>{current.public.lock.status}</strong></p>

      <h3>Design assets</h3>
      <ul>
        <li>Characters: {current.public.character_bibles.map((c) => `${c.name}(${c.importance_level})`).join(", ") || "—"}</li>
        <li>Relationships: {current.public.relationship_map.length}</li>
        <li>Reveals: {current.public.reveal_schedule.length}</li>
        <li>Episodes: {current.public.episode_cards.length}</li>
      </ul>

      <h3>Candidate Gates — {gate.verdict}</h3>
      <ul>
        {gate.findings.map((f, i) => (
          <li key={i}>
            [{f.severity}] {f.axis}: {f.reason}
            {f.severity === "warn" && (
              <label style={{ marginLeft: 8 }}>
                <input type="checkbox" checked={acks.includes(f.axis)} onChange={() => toggleAck(f.axis)} /> acknowledge
              </label>
            )}
          </li>
        ))}
      </ul>

      <h3>Schema Canary — {canary.ok ? "clean" : "errors"}</h3>
      {!canary.ok && <ul>{canary.errors.map((e, i) => <li key={i}>{e.code}: {e.detail}</li>)}</ul>}

      <button onClick={onLock} disabled={current.public.lock.status === "locked"}>
        Lock Blueprint
      </button>
      {message && <pre style={{ whiteSpace: "pre-wrap", color: message.startsWith("Locked") ? "green" : "crimson" }}>{message}</pre>}
      {warnAxes.length > 0 && current.public.lock.status !== "locked" && (
        <p style={{ color: "#a60" }}>{warnAxes.length} warning(s) — acknowledge to lock.</p>
      )}
    </div>
  );
}
