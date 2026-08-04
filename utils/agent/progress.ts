/**
 * Truthful autonomous-generation progress.
 *
 * The runner only ever writes content to *leaf* chapters; parent chapters are
 * structural headings with no content of their own. Counting every chapter as
 * the denominator made `pct` mathematically unable to reach 100% even when the
 * run was genuinely complete — the bar and the "complete" banner contradicted
 * each other. We count leaves only, matching what the runner actually produces.
 */

export interface ChapterLike {
  leaf: boolean;
  content?: string | null;
}

export interface ChapterProgress {
  /** Leaf chapters that already have content. */
  done: number;
  /** Total leaf chapters (the honest denominator). */
  total: number;
  /** 0–100, rounded. */
  pct: number;
  /** true only when every leaf has content. */
  isComplete: boolean;
}

export function computeChapterProgress(chapters: ChapterLike[]): ChapterProgress {
  const leaves = chapters.filter((c) => c.leaf);
  const total = leaves.length;
  const done = leaves.filter((c) => c.content && c.content.length > 0).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;
  return { done, total, pct, isComplete };
}
