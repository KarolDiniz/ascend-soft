import type { MaterialId } from '../../audio/materials';
import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';
import type { ExtraDrawArgs } from './extraPlatforms';

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Nuvemzinhas brancas flutuando acima da plataforma */
function decorCloudPuffs(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed } = a;
  for (let i = 0; i < 3; i++) {
    const phase = time * 1.1 + i * 1.9 + seed * 0.013;
    const px = cx + Math.sin(phase) * w * 0.32 + (seeded(seed, i + 60) - 0.5) * w * 0.18;
    const py = sy - u * (2.5 + i * 2.2) - Math.abs(Math.sin(phase * 1.25)) * u * 1.8;
    const pw = u * (2 + (i % 2));
    fillPx(ctx, px - pw / 2, py, pw, u, rgba('#FFFFFF', 0.78 - i * 0.1));
    fillPx(ctx, px - pw / 3, py - u, pw * 0.66, u, rgba('#FFFFFF', 0.52));
  }
}

/** Notas musicais pixel flutuando sobre a marimba */
function decorMarimbaNotes(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  if (Math.sin(time * 2.4 + seed * 0.02) < 0.15) return;
  const notes = ['♪', '♫'] as const;
  for (let i = 0; i < 2; i++) {
    const nx = cx + (i - 0.5) * w * 0.35 + Math.sin(time * 3 + i + seed) * u;
    const ny = sy - u * (4 + i * 2.5) - Math.sin(time * 2 + i) * u;
    ctx.save();
    ctx.font = `${Math.max(8, u * 5)}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha *= 0.55 + Math.sin(time * 4 + i) * 0.15;
    ctx.fillStyle = i === 0 ? mat.particle : PASTEL.butter;
    ctx.fillText(notes[i]!, nx, ny);
    ctx.restore();
  }
}

/** Teclas mini sobrevoando o teclado */
function decorKeyboardKeys(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  if (Math.sin(time * 1.8 + seed) < 0.25) return;
  const kx = cx + (seeded(seed, 70) - 0.5) * w * 0.55;
  const ky = sy - u * (3 + Math.sin(time * 2.5) * 2);
  fillPx(ctx, kx - u, ky, u * 2, u * 1.5, rgba(mat.stroke, 0.95));
  fillPx(ctx, kx - u * 0.75, ky + u * 0.15, u * 1.5, u * 0.85, mat.fill);
  fillPx(ctx, kx - u * 0.5, ky - u * 0.5, u, u, rgba(mat.stroke, 0.5));
}

/** Bolha estourando no plástico-bolha */
function decorBubbleWrapPop(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, u, time, seed } = a;
  const idx = Math.floor(time * 0.7 + seed) % 5;
  const bx = cx + (seeded(seed, idx + 80) - 0.5) * w * 0.7;
  const by = sy + h * (0.25 + seeded(seed, idx + 81) * 0.45);
  const pop = (Math.sin(time * 8 + idx * 2) + 1) * 0.5;
  if (pop > 0.82) {
    fillPx(ctx, bx, by, u, u, rgba(PASTEL.white, 0.7));
  } else {
    fillPx(ctx, bx - u, by - u, u * 2, u * 2, rgba(PASTEL.sky, 0.45 + pop * 0.25));
    fillPx(ctx, bx - u * 0.5, by - u * 0.5, u, u, rgba(PASTEL.white, 0.55));
  }
}

/** Gatinho — Zzz quando repousando */
function decorKittenZzz(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed } = a;
  const meow = a.overlay?.kittenMeowFlash ?? 0;
  if (meow > 0.1) return;
  if (Math.sin(time * 1.6 + seed) < 0.35) return;
  const zx = cx + w * 0.28 + Math.sin(time * 2) * u;
  const zy = sy - u * (5 + Math.sin(time * 3) * 1.5);
  ctx.save();
  ctx.font = `${Math.max(7, u * 4)}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = rgba(PASTEL.inkSoft, 0.55);
  ctx.fillText('z', zx, zy);
  ctx.globalAlpha *= 0.65;
  ctx.fillText('z', zx + u * 2, zy - u * 1.5);
  ctx.restore();
}

/** Garrafa PET — gotícula escorrendo */
function decorBottleCondense(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  const drop = (time * 0.5 + seed * 0.01) % 1;
  const dx = cx + w * 0.22;
  const dy = sy + u * 2 + drop * u * 5;
  fillPx(ctx, dx, sy + u, u, u, rgba(PASTEL.sky, 0.65));
  if (drop > 0.35) {
    fillPx(ctx, dx - u * 0.25, dy, u * 0.75, u * (1 + drop), rgba(mat.particle, 0.55));
  }
}

/** Cristal — faísca prismática */
function decorCrystalSpark(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, u, time, seed } = a;
  if (Math.sin(time * 5 + seed) < 0.55) return;
  const sx = cx + (seeded(seed, 90) - 0.5) * w * 0.6;
  const sy0 = sy + h * seeded(seed, 91);
  fillPx(ctx, sx, sy0, u, u, PASTEL.white);
  fillPx(ctx, sx - u, sy0, u, u, rgba(PASTEL.lilac, 0.65));
  fillPx(ctx, sx + u, sy0, u, u, rgba(PASTEL.mint, 0.55));
}

/** Papel — canto levantando */
function decorPaperFlutter(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, mat } = a;
  const flap = Math.sin(time * 3.2) * u * 0.8;
  fillPx(ctx, cx + w * 0.38, sy + flap, u * 2, u, rgba(mat.particle, 0.45));
  fillPx(ctx, cx + w * 0.42, sy - u + flap, u, u * 2, rgba(PASTEL.white, 0.5));
}

/** Gelo — floco de geada */
function decorIceFrost(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed } = a;
  const fx = cx + (seeded(seed, 95) - 0.5) * w * 0.5;
  const fy = sy + u + Math.sin(time * 2 + seed) * u * 0.5;
  fillPx(ctx, fx, fy, u, u, rgba(PASTEL.white, 0.75));
  fillPx(ctx, fx - u, fy, u, u, rgba(PASTEL.sky, 0.5));
  fillPx(ctx, fx + u, fy, u, u, rgba(PASTEL.sky, 0.5));
  fillPx(ctx, fx, fy - u, u, u, rgba(PASTEL.sky, 0.45));
}

/** Cítrico — casca/zeste pixel */
function decorCitrusZest(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  const zx = cx - w * 0.25 + Math.sin(time * 2.5 + seed) * u;
  const zy = sy + u * 0.5;
  fillPx(ctx, zx, zy, u * 2, u, mat.particle);
  fillPx(ctx, zx + u, zy - u * 0.5, u, u, rgba(PASTEL.white, 0.45));
}

/** Veludo — fibra de nap */
function decorVelvetNap(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  const nx = cx + (seeded(seed, 100) - 0.5) * w * 0.7;
  const ny = sy + u + Math.sin(time * 4 + seed) * u * 0.3;
  fillPx(ctx, nx, ny, u, u * 2, rgba(mat.particle, 0.55));
}

/** Seda — fio brilhante */
function decorSilkThread(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, mat } = a;
  const tx = cx + Math.sin(time * 1.5) * w * 0.2;
  fillPx(ctx, tx, sy - u, u, u * 4, rgba(mat.particle, 0.35));
  fillPx(ctx, tx, sy - u * 2, u, u, rgba(PASTEL.white, 0.65));
}

/** Grama — pólen / inseto minúsculo */
function decorGrassPollen(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed } = a;
  const px = cx + (seeded(seed, 110) - 0.5) * w * 0.8;
  const py = sy - u * (2 + Math.sin(time * 3 + seed) * 1.5);
  fillPx(ctx, px, py, u, u, rgba(PASTEL.butter, 0.75));
  fillPx(ctx, px + u, py - u * 0.5, u, u, rgba(PASTEL.white, 0.45));
}

/** Musgo — esporo verde */
function decorMossSpore(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  if (Math.sin(time * 2 + seed) < 0.2) return;
  fillPx(
    ctx,
    cx + (seeded(seed, 120) - 0.5) * w * 0.6,
    sy - u * (1.5 + Math.sin(time * 4) * 1),
    u,
    u,
    rgba(mat.particle, 0.65),
  );
}

/** Argila — grãos caindo na borda */
function decorClayCrumb(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  const side = seeded(seed, 130) > 0.5 ? 1 : -1;
  fillPx(ctx, cx + side * w * 0.42, sy + u + (time * 40) % (u * 3), u, u, mat.particle);
}

/** Cogumelo — esporos flutuando */
function decorMushroomSpore(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  if (Math.sin(time * 2.2 + seed) < 0.15) return;
  fillPx(
    ctx,
    cx + (seeded(seed, 140) - 0.5) * w * 0.5,
    sy - u * (2 + Math.sin(time * 3.5) * 1.5),
    u,
    u,
    rgba(mat.particle, 0.6),
  );
}

/** Pipoca — kernel estourando */
function decorPopcornKernel(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, u, time, seed } = a;
  const pop = (Math.sin(time * 7 + seed * 0.03) + 1) * 0.5;
  if (pop < 0.75) return;
  const kx = cx + (seeded(seed, 150) - 0.5) * w * 0.6;
  const ky = sy + h * 0.3;
  fillPx(ctx, kx, ky, u, u, PASTEL.butter);
  fillPx(ctx, kx - u, ky - u, u * 3, u * 3, rgba(PASTEL.butter, 0.35));
}

/** Bambu — folha balançando */
function decorBambooLeaf(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, mat } = a;
  const sway = Math.sin(time * 1.8) * u;
  fillPx(ctx, cx + w * 0.25 + sway, sy - u * 2, u * 3, u, rgba('#7AB858', 0.7));
  fillPx(ctx, cx + w * 0.2 + sway, sy - u, u * 2, u, mat.particle);
}

/** Concha — bolha de ar */
function decorSeashellBubble(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed } = a;
  const drift = (time * 0.4 + seed * 0.01) % 1;
  fillPx(
    ctx,
    cx + (seeded(seed, 160) - 0.5) * w * 0.4,
    sy - u * (1 + drift * 4),
    u * 1.5,
    u * 1.5,
    rgba(PASTEL.sky, 0.55 - drift * 0.3),
  );
}

/** Boba — canudo com bolha */
function decorBobaBubble(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, u, time, mat } = a;
  const by = sy + h * 0.25 + Math.sin(time * 3) * u;
  fillPx(ctx, cx + w * 0.3, by, u, u, rgba(mat.particle, 0.85));
  fillPx(ctx, cx + w * 0.28, by - u, u * 1.5, u * 1.5, rgba(PASTEL.white, 0.4));
}

/** Pena — fluff minúsculo flutuando */
function decorFeatherDrift(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, mat } = a;
  if (Math.sin(time * 1.8) < 0.2) return;
  const fx = cx + Math.sin(time * 1.2) * w * 0.28;
  const fy = sy - u * (2.5 + Math.sin(time * 2.8) * 1.8);
  fillPx(ctx, fx, fy, u, u, rgba(mat.fill, 0.5));
  fillPx(ctx, fx + u, fy - u * 0.5, u, u, rgba(PASTEL.lilac, 0.4));
  fillPx(ctx, fx - u * 0.5, fy + u * 0.3, u, u, rgba('#FFFFFF', 0.45));
}

/** Rolha — pó de cortiça */
function decorCorkDust(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  if (Math.sin(time * 3 + seed) < 0.3) return;
  fillPx(ctx, cx + w * 0.35, sy + u + (time * 30) % (u * 4), u, u, rgba(mat.particle, 0.5));
}

/** Macaron — migalha doce */
function decorMacaronCrumb(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed, mat } = a;
  fillPx(
    ctx,
    cx + (seeded(seed, 170) - 0.5) * w * 0.5,
    sy + u + Math.sin(time * 4) * u * 0.3,
    u,
    u,
    rgba(mat.particle, 0.65),
  );
}

/** Kalimba — brilho metálico */
function decorKalimbaGlint(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, u, time, seed } = a;
  if (Math.sin(time * 4 + seed) < 0.5) return;
  fillPx(ctx, cx + (seeded(seed, 180) - 0.5) * w * 0.4, sy + u * 2, u, u, rgba(PASTEL.butter, 0.75));
}

/** Pandeiro — anel de vibração */
function decorTambourineRing(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, u, time } = a;
  const pulse = (Math.sin(time * 5) + 1) * 0.5;
  if (pulse < 0.6) return;
  const rx = w * 0.38;
  fillPx(ctx, cx - rx, sy + h * 0.38, rx * 2, u, rgba(PASTEL.butter, 0.25 * pulse));
}

const DECOR: Partial<Record<MaterialId, (a: ExtraDrawArgs) => void>> = {
  cloud: decorCloudPuffs,
  marimba: decorMarimbaNotes,
  kalimba: decorKalimbaGlint,
  xylophone: decorMarimbaNotes,
  tambourine: decorTambourineRing,
  woodBlock: decorMarimbaNotes,
  mushroom: decorMushroomSpore,
  popcorn: decorPopcornKernel,
  bamboo: decorBambooLeaf,
  seashell: decorSeashellBubble,
  macaron: decorMacaronCrumb,
  boba: decorBobaBubble,
  feather: decorFeatherDrift,
  cork: decorCorkDust,
  keyboard: decorKeyboardKeys,
  bubbleWrap: decorBubbleWrapPop,
  kitten: decorKittenZzz,
  plasticBottle: decorBottleCondense,
  crystal: decorCrystalSpark,
  paper: decorPaperFlutter,
  iceSoap: decorIceFrost,
  citrus: decorCitrusZest,
  velvet: decorVelvetNap,
  silk: decorSilkThread,
  grass: decorGrassPollen,
  moss: decorMossSpore,
  clay: decorClayCrumb,
};

/** Detalhes ambientais pixel — sem custo de partícula, desenhados na plataforma */
export function drawPlatformAmbientDecor(material: MaterialId, args: ExtraDrawArgs): void {
  DECOR[material]?.(args);
}
