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
function composite(fg, bg, alpha) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
}
function contrast(a, b) {
  const l1 = relLum(a), l2 = relLum(b);
  const [x, y] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (x + 0.05) / (y + 0.05);
}
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

// Find the lightest (highest L) value that passes 4.5:1 for text-on-tint(white)
function findLight(h, s, label) {
  for (let l = 60; l >= 8; l--) {
    const tok = hslToRgb(h, s, l);
    const tint = composite(tok, WHITE, 0.1);
    const r = contrast(tok, tint);
    if (r >= 4.5) {
      console.log(`${label.padEnd(12)} light -> ${h} ${s}% ${l}%  (tint=${r.toFixed(2)})`);
      return { h, s, l };
    }
  }
  console.log(`${label} NO PASS`);
  return null;
}
// Find the darkest (lowest L) value that passes 4.5:1 for text-on-tint(black) in dark
function findDark(h, s, label) {
  for (let l = 40; l <= 80; l++) {
    const tok = hslToRgb(h, s, l);
    const tint = composite(tok, BLACK, 0.1);
    const r = contrast(tok, tint);
    if (r >= 4.5) {
      console.log(`${label.padEnd(12)} dark  -> ${h} ${s}% ${l}%  (tint=${r.toFixed(2)})`);
      return { h, s, l };
    }
  }
  console.log(`${label} NO PASS (dark)`);
  return null;
}

findLight(142, 76, "success");
findLight(35, 95, "warning");
findLight(0, 72, "destructive");
findDark(142, 69, "success");
findDark(38, 92, "warning");
findDark(0, 84, "destructive");
