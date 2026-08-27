import type { MaterialId } from '../../audio/materials';

/** Single frame size — keep AI exports at this resolution */
export const SPRITE_FRAME_W = 256;
export const SPRITE_FRAME_H = 160;
export const SPRITE_FRAMES = 6;

export const SPRITE_SHEET_W = SPRITE_FRAME_W * SPRITE_FRAMES;
export const SPRITE_SHEET_H = SPRITE_FRAME_H;

/** Frame index semantics */
export const SPRITE_FRAME = {
  idle: 0,
  squash1: 1,
  squash2: 2,
  squash3: 3,
  squash4: 4,
  rebound: 5,
} as const;

/** Drop PNGs in public/assets/platforms/{id}.png */
export function spriteUrl(material: MaterialId): string {
  return `/assets/platforms/${material}.png`;
}

export const ALL_SPRITE_MATERIALS: MaterialId[] = [
  'jelly',
  'butter',
  'mochi',
  'chocolate',
  'citrus',
  'honeycomb',
  'glycerin',
  'whipped',
  'kinetic',
  'iceSoap',
  'clearSlime',
  'butterSlime',
];
