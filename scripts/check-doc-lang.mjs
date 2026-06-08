// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 4.1] Doc-language guard (constitution section 2)
// Fails (exit 1) if any agent-facing file contains Hangul. Developer-facing docs are exempt.
import { readFileSync, existsSync } from "node:fs";

// Fixed agent-facing targets that MUST be English (no glob; explicit list is robust).
const FILES = [
  "CLAUDE.md",
  "docs/runbook.md",
  "docs/architecture.md",
  "docs/agents.md",
  "docs/schemas.md",
  "docs/testing.md",
  "docs/agent_interaction_protocol.md",
  "docs/state.md",
  "docs/backlog.md",
  "src/agents/director/director_skill.md",
  "src/agents/planner/planner_skill.md",
  "src/agents/writer/writer_skill.md",
  "src/python_engine/qa/qa_skill.md",
];

const HANGUL = /[가-힣]/;

/** Return [{file, line, text}] for lines containing Hangul. */
export function findHangul(paths) {
  const hits = [];
  for (const file of paths) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((text, i) => {
      if (HANGUL.test(text)) hits.push({ file, line: i + 1, text: text.trim().slice(0, 80) });
    });
  }
  return hits;
}

/** Detect Hangul in a raw string (used by unit tests). */
export function hasHangul(s) {
  return HANGUL.test(s);
}

function main() {
  const hits = findHangul(FILES);
  if (hits.length > 0) {
    console.error("Doc-language guard FAILED (agent-facing files must be English):");
    for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.text}`);
    process.exit(1);
  }
  console.log("Doc-language guard OK");
}

if (process.argv[1] && process.argv[1].endsWith("check-doc-lang.mjs")) {
  main();
}
