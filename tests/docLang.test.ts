// [PROPOSAL: docs/proposals/LATEST_PROPOSAL.md section 4.1] Doc-language guard unit test
import { describe, it, expect } from "vitest";
import { hasHangul } from "../scripts/check-doc-lang.mjs";

describe("doc-language guard", () => {
  it("flags Hangul text", () => {
    expect(hasHangul("이것은 한국어")).toBe(true);
  });
  it("passes plain English", () => {
    expect(hasHangul("This is English. section 5.")).toBe(false);
  });
});
