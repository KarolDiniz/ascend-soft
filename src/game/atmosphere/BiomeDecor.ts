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
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(phase) * 0.08);
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
