// Standalone WCAG contrast checker for the status tokens.
// Models `text-{status}` (the token at full alpha) over `bg-{status}/10`
// (the token at 10% alpha composited over the theme surface).

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

function contrast(rgbA, rgbB) {
  const l1 = relLum(rgbA), l2 = relLum(rgbB);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

function parse(hsl) {
  const m = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

const candidates = {
  light: {
    success: "142 72% 35%",
    warning: "35 95% 38%",
    destructive: "0 74% 42%",
  },
  dark: {
    success: "142 69% 55%",
    warning: "38 92% 62%",
    destructive: "0 84% 62%",
  },
};

for (const theme of ["light", "dark"]) {
  const surface = theme === "light" ? WHITE : BLACK;
  console.log(`\n== ${theme} ==`);
  for (const [name, hsl] of Object.entries(candidates[theme])) {
    const token = hslToRgb(...parse(hsl));
    const tint = composite(token, surface, 0.1);
    const ratio = contrast(token, tint);
    const pass = ratio >= 4.5 ? "PASS" : "FAIL";
    // Also check text on raw surface (e.g. plain white / black page)
    const ratioSurface = contrast(token, surface);
    const passSurface = ratioSurface >= 4.5 ? "PASS" : "FAIL";
    console.log(
      `${name.padEnd(11)} ${hsl.padEnd(14)} tint=${ratio.toFixed(2)}:1 ${pass} | onSurface=${ratioSurface.toFixed(2)}:1 ${passSurface}`
    );
  }
}
