import type { DecorKind } from './AltitudeZones';

/** Procedural silhouette drawing for biome scenery props. */
export function drawDecor(
  ctx: CanvasRenderingContext2D,
  kind: DecorKind,
  x: number,
  y: number,
  s: number,
  phase: number,
  color: string,
  flyDir = 1,
): void {
  ctx.save();
  ctx.translate(x, y);
  if (kind !== 'bird') ctx.rotate(Math.sin(phase) * 0.08);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  switch (kind) {
    case 'leaf':
      drawLeaf(ctx, s, phase);
      break;
    case 'hibiscus':
      drawHibiscus(ctx, s, phase);
      break;
    case 'citrus':
      drawCitrus(ctx, s);
      break;
    case 'cake':
      drawCake(ctx, s);
      break;
    case 'spoon':
      drawSpoon(ctx, s, phase);
      break;
    case 'creamCloud':
      drawCreamCloud(ctx, s, phase);
      break;
    case 'donut':
      drawDonut(ctx, s);
      break;
    case 'bottle':
      drawBottle(ctx, s);
      break;
    case 'bigBubble':
      drawBigBubble(ctx, s, phase);
      break;
    case 'towel':
      drawTowel(ctx, s);
      break;
    case 'stone':
      drawStone(ctx, s, phase);
      break;
    case 'crystal':
      drawCrystal(ctx, s);
      break;
    case 'iceBlock':
      drawIceBlock(ctx, s);
      break;
    case 'snowflake':
      drawSnowflake(ctx, s, phase);
      break;
    case 'lightRing':
      drawLightRing(ctx, s, phase);
      break;
    case 'softOrb':
      drawSoftOrb(ctx, s, phase);
      break;
    case 'bird':
      drawBird(ctx, s, phase, color, flyDir);
      break;
    case 'flowerBouquet':
      drawFlowerBouquet(ctx, s, phase);
      break;
    case 'windChime':
      drawWindChime(ctx, s, phase);
      break;
    case 'marimbaBar':
      drawMarimbaBar(ctx, s);
      break;
    case 'pottery':
      drawPottery(ctx, s);
      break;
    case 'honeyDrip':
      drawHoneyDrip(ctx, s, phase);
      break;
    case 'keyCap':
      drawKeyCap(ctx, s, phase);
      break;
    case 'bubbleCell':
      drawBubbleCell(ctx, s, phase);
      break;
    case 'sandDune':
      drawSandDune(ctx, s, phase);
      break;
    case 'yarnBall':
      drawYarnBall(ctx, s, phase);
      break;
    case 'pawPrint':
      drawPawPrint(ctx, s);
      break;
    case 'ribbon':
      drawRibbon(ctx, s, phase);
      break;
    case 'origami':
      drawOrigami(ctx, s, phase);
      break;
    case 'whippedSpiral':
      drawWhippedSpiral(ctx, s, phase);
      break;
    case 'slimeStretch':
      drawSlimeStretch(ctx, s, phase);
      break;
    case 'lavenderSprig':
      drawLavenderSprig(ctx, s, phase);
      break;
    case 'cottonPuff':
      drawCottonPuff(ctx, s, phase);
      break;
    case 'steamWisp':
      drawSteamWisp(ctx, s, phase);
      break;
    case 'mushroomCap':
      drawMushroomCap(ctx, s, phase);
      break;
    case 'seashell':
      drawSeashellDecor(ctx, s, phase);
      break;
    case 'bambooStalk':
      drawBambooStalk(ctx, s, phase);
      break;
    case 'popcornKernel':
      drawPopcornKernel(ctx, s, phase);
      break;
    case 'featherWisp':
      drawFeatherWisp(ctx, s, phase);
      break;
    default:
      drawAbstractMote(ctx, s, phase);
  }
  ctx.restore();
}

function drawLeaf(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.rotate(phase * 0.05);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.9, -s * 0.4, s * 0.85, s * 0.5, 0, s);
  ctx.bezierCurveTo(-s * 0.85, s * 0.5, -s * 0.9, -s * 0.4, 0, -s);
  ctx.fill();
  ctx.globalAlpha *= 0.45;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.75);
  ctx.quadraticCurveTo(s * 0.15, 0, 0, s * 0.7);
  ctx.stroke();
}

function drawHibiscus(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + phase * 0.1;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(a) * s * 0.35,
      Math.sin(a) * s * 0.35,
      s * 0.45,
      s * 0.22,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha *= 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawCitrus(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha *= 0.35;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.7);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCake(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.roundRect(-s * 0.7, -s * 0.15, s * 1.4, s * 0.55, 6);
  ctx.fill();
  ctx.globalAlpha *= 0.85;
  ctx.beginPath();
  ctx.roundRect(-s * 0.55, -s * 0.45, s * 1.1, s * 0.4, 5);
  ctx.fill();
  ctx.globalAlpha *= 0.9;
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.55, s * 0.35, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-s * 0.28, -s * 0.48, s * 0.18, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.28, -s * 0.48, s * 0.18, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpoon(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.rotate(0.4 + Math.sin(phase) * 0.05);
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.55, s * 0.32, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-s * 0.08, -s * 0.15, s * 0.16, s * 1.1, 4);
  ctx.fill();
}

function drawCreamCloud(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const bob = Math.sin(phase) * 2;
  ctx.beginPath();
  ctx.ellipse(-s * 0.35, bob, s * 0.45, s * 0.38, 0, 0, Math.PI * 2);
  ctx.ellipse(s * 0.1, bob - s * 0.15, s * 0.55, s * 0.45, 0, 0, Math.PI * 2);
  ctx.ellipse(s * 0.4, bob + s * 0.05, s * 0.4, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawDonut(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
  ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  ctx.globalAlpha *= 0.5;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * s * 0.48, Math.sin(a) * s * 0.48, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBottle(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.roundRect(-s * 0.35, -s * 0.2, s * 0.7, s * 0.95, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-s * 0.18, -s * 0.65, s * 0.36, s * 0.5, 4);
  ctx.fill();
  ctx.globalAlpha *= 0.4;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(-s * 0.12, s * 0.1, s * 0.1, s * 0.28, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBigBubble(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const pulse = 1 + Math.sin(phase * 1.4) * 0.04;
  ctx.globalAlpha *= 0.55;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.85 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(-s * 0.28, -s * 0.28, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawTowel(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.roundRect(-s * 0.55, -s * 0.35, s * 1.1, s * 0.7, 8);
  ctx.fill();
  ctx.globalAlpha *= 0.4;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * s * 0.18, -s * 0.3);
    ctx.lineTo(i * s * 0.18, s * 0.3);
    ctx.stroke();
  }
}

function drawStone(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.75, s * 0.4, phase * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha *= 0.35;
  ctx.beginPath();
  ctx.ellipse(-s * 0.15, -s * 0.08, s * 0.25, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrystal(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.45, -s * 0.15);
  ctx.lineTo(s * 0.25, s * 0.85);
  ctx.lineTo(-s * 0.35, s * 0.55);
  ctx.lineTo(-s * 0.5, -s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= 0.4;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.lineTo(0, s * 0.4);
  ctx.stroke();
}

function drawIceBlock(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, s * 0.35);
  ctx.lineTo(-s * 0.35, -s * 0.45);
  ctx.lineTo(s * 0.45, -s * 0.55);
  ctx.lineTo(s * 0.6, s * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= 0.35;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.2);
  ctx.lineTo(s * 0.15, -s * 0.35);
  ctx.lineTo(s * 0.05, s * 0.05);
  ctx.closePath();
  ctx.fill();
}

function drawSnowflake(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.rotate(phase * 0.15);
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55);
    ctx.lineTo(
      Math.cos(a) * s * 0.55 + Math.cos(a + 0.8) * s * 0.25,
      Math.sin(a) * s * 0.55 + Math.sin(a + 0.8) * s * 0.25,
    );
    ctx.stroke();
  }
}

function drawLightRing(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const pulse = 1 + Math.sin(phase * 1.2) * 0.06;
  ctx.globalAlpha *= 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.7 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha *= 0.6;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.4 * pulse, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSoftOrb(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const pulse = 1 + Math.sin(phase) * 0.05;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * pulse);
  g.addColorStop(0, 'rgba(255,250,240,0.55)');
  g.addColorStop(0.55, 'rgba(255,230,200,0.22)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, s * pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawAbstractMote(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.7, s * 0.45, phase * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha *= 0.5;
  ctx.beginPath();
  ctx.ellipse(s * 0.2, -s * 0.1, s * 0.35, s * 0.28, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlowerBouquet(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const bob = Math.sin(phase * 0.8) * s * 0.06;
  ctx.fillStyle = '#78B868';
  ctx.fillRect(-s * 0.06, bob, s * 0.12, s * 0.55);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + phase * 0.08;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(a) * s * 0.28,
      bob - s * 0.35 + Math.sin(a) * s * 0.18,
      s * 0.2,
      s * 0.14,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha *= 0.75;
  ctx.beginPath();
  ctx.arc(0, bob - s * 0.35, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawWindChime(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.lineTo(0, -s * 0.2);
  ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    const swing = Math.sin(phase * 2 + i) * s * 0.12;
    ctx.beginPath();
    ctx.moveTo(i * s * 0.22, -s * 0.2);
    ctx.lineTo(i * s * 0.22 + swing, s * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(i * s * 0.22 + swing, s * 0.42, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMarimbaBar(ctx: CanvasRenderingContext2D, s: number): void {
  for (let i = 0; i < 4; i++) {
    const bw = s * 0.85;
    const bh = s * (0.12 + (i % 2) * 0.04);
    ctx.globalAlpha *= 0.85 - i * 0.08;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -s * 0.35 + i * s * 0.18, bw, bh, 3);
    ctx.fill();
  }
}

function drawPottery(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.ellipse(0, s * 0.15, s * 0.42, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.08, s * 0.32, s * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha *= 0.35;
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.22, s * 0.2, s * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Pássaro pastel sobrevoando — asas batendo, direção horizontal */
function drawBird(
  ctx: CanvasRenderingContext2D,
  s: number,
  phase: number,
  color: string,
  flyDir: number,
): void {
  const dir = flyDir >= 0 ? 1 : -1;
  ctx.scale(dir, 1);

  const glide = Math.sin(phase * 0.55) * s * 0.06;
  const flap = Math.sin(phase * 13.5);
  const wingUp = flap > 0;

  // Corpo
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, glide, s * 0.38, s * 0.22, -0.12, 0, Math.PI * 2);
  ctx.fill();

  // Cabeça
  ctx.beginPath();
  ctx.arc(s * 0.28, glide - s * 0.08, s * 0.17, 0, Math.PI * 2);
  ctx.fill();

  // Bico
  ctx.fillStyle = 'rgba(255, 210, 150, 0.85)';
  ctx.beginPath();
  ctx.moveTo(s * 0.4, glide - s * 0.06);
  ctx.lineTo(s * 0.58, glide - s * 0.02);
  ctx.lineTo(s * 0.4, glide + s * 0.02);
  ctx.closePath();
  ctx.fill();

  // Asa (batida)
  ctx.fillStyle = color;
  ctx.globalAlpha *= 0.88;
  const wingY = glide + (wingUp ? -s * 0.18 : s * 0.1);
  const wingTilt = wingUp ? -0.55 : 0.35;
  ctx.beginPath();
  ctx.ellipse(-s * 0.08, wingY, s * 0.42, s * 0.14, wingTilt, 0, Math.PI * 2);
  ctx.fill();

  // Cauda
  ctx.globalAlpha *= 0.75;
  ctx.beginPath();
  ctx.moveTo(-s * 0.32, glide);
  ctx.lineTo(-s * 0.58, glide - s * 0.12);
  ctx.lineTo(-s * 0.52, glide + s * 0.06);
  ctx.closePath();
  ctx.fill();

  // Olho
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(40, 50, 60, 0.55)';
  ctx.beginPath();
  ctx.arc(s * 0.32, glide - s * 0.1, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
}

function drawHoneyDrip(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.15, s * 0.55, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  const drip = Math.sin(phase * 1.2) * s * 0.08;
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, s * 0.15);
  ctx.quadraticCurveTo(-s * 0.08, s * 0.55 + drip, 0, s * 0.75 + drip);
  ctx.quadraticCurveTo(s * 0.08, s * 0.55 + drip, s * 0.12, s * 0.15);
  ctx.fill();
  ctx.globalAlpha *= 0.45;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4);
    ctx.stroke();
  }
}

function drawKeyCap(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const press = Math.sin(phase * 2) * s * 0.04;
  ctx.beginPath();
  ctx.roundRect(-s * 0.45, -s * 0.35 + press, s * 0.9, s * 0.55, 6);
  ctx.fill();
  ctx.globalAlpha *= 0.35;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.roundRect(-s * 0.32, -s * 0.28 + press, s * 0.64, s * 0.12, 3);
  ctx.fill();
}

function drawBubbleCell(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const pop = Math.sin(phase * 3.5);
  if (pop > 0.85) {
    ctx.globalAlpha *= 0.35;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-s * 0.15, -s * 0.15, s * 0.3, s * 0.3);
    return;
  }
  ctx.globalAlpha *= 0.55;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(-s * 0.15, -s * 0.15, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawSandDune(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const drift = Math.sin(phase * 0.4) * s * 0.12;
  ctx.beginPath();
  ctx.moveTo(-s * 0.8 + drift, s * 0.2);
  ctx.quadraticCurveTo(-s * 0.2 + drift, -s * 0.55, s * 0.5 + drift, s * 0.15);
  ctx.quadraticCurveTo(s * 0.75 + drift, s * 0.35, s * 0.85 + drift, s * 0.45);
  ctx.lineTo(-s * 0.85 + drift, s * 0.45);
  ctx.closePath();
  ctx.fill();
}

function drawYarnBall(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha *= 0.4;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI + phase * 0.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.15, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha *= 0.7;
  ctx.beginPath();
  ctx.moveTo(s * 0.35, s * 0.2);
  ctx.quadraticCurveTo(s * 0.7 + Math.sin(phase) * s * 0.1, s * 0.5, s * 0.55, s * 0.85);
  ctx.stroke();
}

function drawPawPrint(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.ellipse(0, s * 0.1, s * 0.28, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  const pads = [
    [-s * 0.22, -s * 0.18],
    [0, -s * 0.32],
    [s * 0.22, -s * 0.18],
    [-s * 0.12, -s * 0.42],
    [s * 0.12, -s * 0.42],
  ];
  for (const [px, py] of pads) {
    ctx.beginPath();
    ctx.ellipse(px, py, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRibbon(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const wave = Math.sin(phase * 0.8) * s * 0.15;
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.2, -s * 0.45 + wave, s * 0.2, s * 0.05);
  ctx.quadraticCurveTo(s * 0.55, s * 0.35 - wave, s * 0.75, s * 0.15);
  ctx.lineTo(s * 0.65, s * 0.28);
  ctx.quadraticCurveTo(s * 0.4, s * 0.48 - wave, 0, s * 0.2);
  ctx.quadraticCurveTo(-s * 0.45, -s * 0.05 + wave, -s * 0.6, s * 0.05);
  ctx.closePath();
  ctx.fill();
}

function drawOrigami(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const tilt = Math.sin(phase * 0.5) * 0.08;
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.55);
  ctx.lineTo(s * 0.5, s * 0.35);
  ctx.lineTo(-s * 0.5, s * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.55);
  ctx.lineTo(0, s * 0.35);
  ctx.stroke();
}

function drawWhippedSpiral(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.lineWidth = s * 0.14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 3.5; a += 0.15) {
    const r = s * 0.08 + a * s * 0.06;
    const x = Math.cos(a + phase * 0.2) * r;
    const y = Math.sin(a + phase * 0.2) * r - s * 0.1;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha *= 0.5;
  ctx.beginPath();
  ctx.arc(0, -s * 0.1, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawSlimeStretch(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const stretch = 1 + Math.sin(phase * 1.3) * 0.18;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.35 * stretch, s * 0.55 / stretch, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha *= 0.45;
  ctx.beginPath();
  ctx.moveTo(s * 0.25 * stretch, -s * 0.1);
  ctx.quadraticCurveTo(s * 0.65 * stretch, s * 0.15, s * 0.45 * stretch, s * 0.55);
  ctx.stroke();
}

function drawLavenderSprig(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const sway = Math.sin(phase * 0.6) * s * 0.06;
  ctx.fillStyle = '#88A878';
  ctx.fillRect(-s * 0.04 + sway, -s * 0.5, s * 0.08, s * 0.85);
  for (let i = 0; i < 6; i++) {
    const ly = -s * 0.4 + i * s * 0.13;
    ctx.beginPath();
    ctx.ellipse(-s * 0.12 + sway, ly, s * 0.1, s * 0.06, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.12 + sway, ly + s * 0.04, s * 0.1, s * 0.06, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha *= 0.55;
  ctx.beginPath();
  ctx.ellipse(sway, -s * 0.55, s * 0.08, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCottonPuff(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const bob = Math.sin(phase) * s * 0.05;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * s * 0.22, bob + Math.sin(a) * s * 0.22, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha *= 0.6;
  ctx.beginPath();
  ctx.arc(0, bob, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function drawSteamWisp(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.globalAlpha *= 0.45;
  ctx.lineWidth = s * 0.1;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    const ox = i * s * 0.22;
    for (let t = 0; t <= 1; t += 0.08) {
      const y = s * 0.35 - t * s * 0.85;
      const x = ox + Math.sin(t * 6 + phase + i) * s * 0.12;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawMushroomCap(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const bob = Math.sin(phase * 0.7) * s * 0.05;
  ctx.fillStyle = '#E88868';
  ctx.beginPath();
  ctx.ellipse(0, bob - s * 0.15, s * 0.75, s * 0.45, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#F8F0E8';
  ctx.fillRect(-s * 0.12, bob, s * 0.24, s * 0.55);
  ctx.globalAlpha *= 0.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(-s * 0.25 + i * s * 0.18, bob - s * 0.2, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSeashellDecor(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, s * 0.3);
  ctx.quadraticCurveTo(0, -s * 0.6 + Math.sin(phase) * s * 0.05, s * 0.5, s * 0.3);
  ctx.quadraticCurveTo(0, s * 0.15, -s * 0.5, s * 0.3);
  ctx.fill();
  ctx.globalAlpha *= 0.4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.35 + i * s * 0.18, s * 0.2);
    ctx.quadraticCurveTo(0, -s * 0.1 + i * s * 0.08, s * 0.35 - i * s * 0.18, s * 0.2);
    ctx.stroke();
  }
}

function drawBambooStalk(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const sway = Math.sin(phase * 0.5) * s * 0.06;
  ctx.fillStyle = '#88B868';
  ctx.fillRect(-s * 0.1 + sway, -s * 0.5, s * 0.2, s);
  ctx.globalAlpha *= 0.45;
  ctx.fillRect(-s * 0.14 + sway, -s * 0.15, s * 0.28, s * 0.06);
  ctx.fillRect(-s * 0.14 + sway, s * 0.15, s * 0.28, s * 0.06);
}

function drawPopcornKernel(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const pop = Math.sin(phase * 2.5);
  ctx.beginPath();
  ctx.arc(0, 0, s * (0.45 + pop * 0.04), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha *= 0.55;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(-s * 0.15, -s * 0.15, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawFeatherWisp(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const drift = Math.sin(phase * 0.6) * s * 0.12;
  ctx.globalAlpha *= 0.5;
  ctx.lineWidth = s * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.quadraticCurveTo(drift, 0, drift * 0.5, -s * 0.45);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(drift * 0.2, -s * 0.1 - i * s * 0.12);
    ctx.lineTo(drift * 0.5 + s * 0.25, -s * 0.05 - i * s * 0.1);
    ctx.stroke();
  }
}
