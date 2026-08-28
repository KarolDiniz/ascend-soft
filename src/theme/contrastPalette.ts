import { parseColor, rgba } from './pastelPalette';

/** Distância mínima RGB entre plataforma e fundo (percepção). */
export const MIN_PLATFORM_BG_DISTANCE = 52;

/** Delta mínimo de luminância relativa (WCAG-inspired). */
export const MIN_PLATFORM_BG_LUM_DELTA = 0.2;

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function relativeLuminance(color: string): number {
  const [r, g, b] = parseColor(color).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Distância perceptual simples — pesos aproximados do olho humano. */
export function colorDistance(a: string, b: string): number {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);
}

export function darkenHex(hex: string, amt: number): string {
  const [r, g, b] = parseColor(hex);
  return rgbToHex(r - amt, g - amt, b - amt);
}

export function lightenHex(hex: string, amt: number): string {
  const [r, g, b] = parseColor(hex);
  return rgbToHex(r + amt, g + amt, b + amt);
}

export function blendHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  const u = Math.min(1, Math.max(0, t));
  return rgbToHex(
    ar + (br - ar) * u,
    ag + (bg - ag) * u,
    ab + (bb - ab) * u,
  );
}

/** Separa matiz do fundo quando tons ficam colados (útil em brancos/cremes). */
function hueShiftAway(from: string, base: string, degrees: number): string {
  const [r, g, b] = parseColor(base);
  const [fr, fg, fb] = parseColor(from);
  const pushR = (fr - r) * 0.35 + degrees * 0.6;
  const pushG = (fg - g) * 0.35 - degrees * 0.25;
  const pushB = (fb - b) * 0.35 + degrees * 0.85;
  return rgbToHex(r + pushR, g + pushG, b + pushB);
}

function hasEnoughContrast(platformFill: string, bg: string): boolean {
  return (
    colorDistance(platformFill, bg) >= MIN_PLATFORM_BG_DISTANCE &&
    Math.abs(relativeLuminance(platformFill) - relativeLuminance(bg)) >= MIN_PLATFORM_BG_LUM_DELTA
  );
}

/** Céu sempre legivelmente distinto do fill das plataformas do mesmo material. */
export function buildSkyPalette(
  platformFill: string,
  accent: string,
): { top: string; mid: string; bottom: string; accent: string; blob: string[] } {
  const lum = relativeLuminance(platformFill);
  let topD = lum > 0.74 ? 44 : lum > 0.58 ? 32 : 24;
  let midD = lum > 0.74 ? 72 : lum > 0.58 ? 52 : 38;
  let botD = lum > 0.74 ? 92 : lum > 0.58 ? 68 : 50;

  let top = darkenHex(platformFill, topD);
  let mid = darkenHex(platformFill, midD);
  let bottom = darkenHex(platformFill, botD);

  for (let i = 0; i < 10 && !hasEnoughContrast(platformFill, mid); i++) {
    topD += 6;
    midD += 10;
    botD += 10;
    top = darkenHex(platformFill, topD);
    mid = darkenHex(platformFill, midD);
    bottom = darkenHex(platformFill, botD);
  }

  if (!hasEnoughContrast(platformFill, mid)) {
    mid = hueShiftAway(platformFill, mid, 18);
    bottom = hueShiftAway(platformFill, bottom, 24);
    top = hueShiftAway(platformFill, top, 12);
  }

  if (!hasEnoughContrast(platformFill, mid)) {
    mid = blendHex(mid, '#6E7884', 0.28);
    bottom = blendHex(bottom, '#5A646E', 0.32);
  }

  return {
    top,
    mid,
    bottom,
    accent,
    blob: [rgba(accent, 0.22), rgba(platformFill, 0.16), rgba(accent, 0.1)],
  };
}

/** Ajusta fill contra um ou mais tons de fundo. */
export function ensurePlatformContrast(platformFill: string, ...backgrounds: string[]): string {
  let result = platformFill;
  for (const bg of backgrounds) {
    result = separatePlatformFromBackground(result, bg);
  }
  return result;
}

/** Ajusta fill da plataforma se ainda colidir com o céu na altura atual. */
export function separatePlatformFromBackground(platformFill: string, skyMid: string): string {
  if (hasEnoughContrast(platformFill, skyMid)) return platformFill;

  const platLum = relativeLuminance(platformFill);
  const skyLum = relativeLuminance(skyMid);
  let adjusted = platformFill;

  for (let i = 0; i < 8; i++) {
    if (hasEnoughContrast(adjusted, skyMid)) return adjusted;
    if (platLum >= skyLum) {
      adjusted = darkenHex(adjusted, 10 + i * 5);
    } else {
      adjusted = lightenHex(adjusted, 10 + i * 5);
    }
  }

  return hueShiftAway(skyMid, adjusted, platLum >= skyLum ? -22 : 22);
}
