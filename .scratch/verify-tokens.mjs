import { readFileSync } from "fs";
import path from "path";

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((x) => Math.round(x * 255));
}
function relLum([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function composite(fg, bg, a) { return fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a))); }
function contrast(a, b) {
  const l1 = relLum(a), l2 = relLum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
function parseHsl(hsl) {
  const m = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}
function extractBlock(css, sel) {
  const idx = css.indexOf(sel);
  const start = css.indexOf("{", idx);
  let depth = 0, i = start;
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") { depth--; if (depth === 0) break; }
  }
  return css.slice(start + 1, i);
}
function tokenIn(block, name) {
  const m = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m[1].trim();
}
const css = readFileSync(path.resolve("app/globals.css"), "utf-8");
const light = extractBlock(css, ":root");
const dark = extractBlock(css, ".dark {");
const WHITE = [255,255,255], BLACK = [0,0,0];
let allPass = true;
for (const name of ["success","warning","destructive"]) {
  for (const [theme, block, surf] of [["light", light, WHITE], ["dark", dark, BLACK]]) {
    const tok = hslToRgb(...parseHsl(tokenIn(block, name)));
    const tint = composite(tok, surf, 0.1);
    const r = contrast(tok, tint);
    const ok = r >= 4.5;
    if (!ok) allPass = false;
    console.log(`${theme} --${name.padEnd(11)} ${tokenIn(block,name).padEnd(14)} tint=${r.toFixed(2)}:1 ${ok?"PASS":"FAIL"}`);
  }
}
console.log(allPass ? "\nALL PASS" : "\nSOME FAIL");
