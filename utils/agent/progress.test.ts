import { describe, it, expect } from "vitest";
import { computeChapterProgress } from "@/utils/agent/progress";

describe("computeChapterProgress", () => {
  it("counts only leaf chapters as the denominator", () => {
    // 1 parent (structural) + 3 leaf chapters, all leaves written.
    const chapters = [
      { leaf: false, content: null },
      { leaf: true, content: "A" },
      { leaf: true, content: "B" },
      { leaf: true, content: "C" },
    ];
    // Parent-inclusive math would give total=4, done=3 -> 75% (never completes).
    // Leaf-only math gives total=3, done=3 -> 100%, complete.
    const result = computeChapterProgress(chapters);
    expect(result.total).toBe(3);
    expect(result.done).toBe(3);
    expect(result.pct).toBe(100);
    expect(result.isComplete).toBe(true);
  });

  it("reports partial progress for un-finished leaves", () => {
    const chapters = [
      { leaf: false, content: null },
      { leaf: true, content: "A" },
      { leaf: true, content: "" },
      { leaf: true, content: "C" },
    ];
    const result = computeChapterProgress(chapters);
    expect(result.total).toBe(3);
    expect(result.done).toBe(2);
    expect(result.pct).toBe(67);
    expect(result.isComplete).toBe(false);
  });

  it("treats a parent chapter with content as still non-leaf", () => {
    // Even if a parent somehow has content, it must not count toward total/done.
    const chapters = [
      { leaf: false, content: "intro" },
      { leaf: true, content: "A" },
    ];
    const result = computeChapterProgress(chapters);
    expect(result.total).toBe(1);
    expect(result.done).toBe(1);
    expect(result.isComplete).toBe(true);
  });

  it("returns 0% and not-complete when there are no chapters", () => {
    const result = computeChapterProgress([]);
    expect(result.total).toBe(0);
    expect(result.done).toBe(0);
    expect(result.pct).toBe(0);
    expect(result.isComplete).toBe(false);
  });

  it("is the exact 'stuck at 64% but DONE' regression fixture", () => {
    // 9 leaves + 5 parents = 14 chapters. Parent-inclusive denominator => done/14.
    // With 9 leaves written that is 9/14 ≈ 64%, so the bar froze below 100%.
    // Leaf-only: 9/9 = 100% the moment the last leaf is written.
    const chapters = [
      ...Array.from({ length: 5 }, () => ({ leaf: false, content: null })),
      ...Array.from({ length: 9 }, (_, i) => ({ leaf: true, content: `ch${i}` })),
    ];
    const result = computeChapterProgress(chapters);
    expect(result.total).toBe(9);
    expect(result.done).toBe(9);
    expect(result.pct).toBe(100);
    expect(result.isComplete).toBe(true);
  });
});
