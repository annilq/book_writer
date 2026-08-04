import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Ticket 01 — Status-color token contrast.
 *
 * Status text is rendered as `text-{status}` on `bg-{status}/10` (the token at
 * 10% alpha over the theme surface). The tokens themselves must be contrast-
 * safe so every surface that consumes them inherits the fix for free.
 *
 * This test reads the real `globals.css`, extracts the status tokens from the
 * `:root` (light) and `.dark` blocks, and asserts that each status text color
 * clears WCAG AA (>= 4.5:1) against its 10% tint in BOTH themes.
 */

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((x) => Math.round(x * 255)) as [number, number, number];
}

function relLum([r, g, b]: [number, number, number]): number {
  const lin = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function composite(fg: [number, number, number], bg: [number, number, number], alpha: number) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as [number, number, number];
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const l1 = relLum(a);
  const l2 = relLum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function parseHsl(hsl: string): [number, number, number] {
  const m = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) throw new Error(`bad hsl: ${hsl}`);
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

function extractBlock(css: string, selector: string): string {
  const idx = css.indexOf(selector);
  if (idx === -1) throw new Error(`selector ${selector} not found`);
  // find the first `{` after the selector, then its matching `}`
  const start = css.indexOf("{", idx);
  let depth = 0;
  let i = start;
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return css.slice(start + 1, i);
}

function tokenIn(block: string, name: string): string {
  const m = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} not found in block`);
  return m[1].trim();
}

const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf-8");
const lightBlock = extractBlock(css, ":root");
const darkBlock = extractBlock(css, ".dark {");

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

const STATUSES = ["success", "warning", "destructive"] as const;

describe("status-color token contrast (ticket 01)", () => {
  for (const name of STATUSES) {
    it(`light --${name} clears AA on its 10% tint`, () => {
      const token = hslToRgb(...parseHsl(tokenIn(lightBlock, name)));
      const tint = composite(token, WHITE, 0.1);
      const ratio = contrast(token, tint);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it(`dark --${name} clears AA on its 10% tint`, () => {
      const token = hslToRgb(...parseHsl(tokenIn(darkBlock, name)));
      const tint = composite(token, BLACK, 0.1);
      const ratio = contrast(token, tint);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
});
