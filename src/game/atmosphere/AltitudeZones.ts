export type ZoneId = 'garden' | 'bakery' | 'spa' | 'frost' | 'ether';

export type AmbientType =
  | 'pollen'
  | 'sugarDust'
  | 'steam'
  | 'bubbleFloat'
  | 'foamSpeck'
  | 'frost'
  | 'snowMote'
  | 'lightOrb'
  | 'petal'
  | 'sparkleIdle'
  | 'sprinkle'
  | 'dripAmbient'
  | 'emberSoft';

export type BlobKind = 'slice' | 'petal' | 'scoop' | 'bubble' | 'crystal' | 'orb' | 'flake';

export type DecorKind =
  | 'leaf'
  | 'hibiscus'
  | 'citrus'
  | 'cake'
  | 'spoon'
  | 'creamCloud'
  | 'donut'
  | 'bottle'
  | 'bigBubble'
  | 'towel'
  | 'stone'
  | 'crystal'
  | 'iceBlock'
  | 'snowflake'
  | 'lightRing'
  | 'softOrb'
  | 'abstractMote';

export type OverlayKind = 'mottle' | 'sugarVeil' | 'caustics' | 'frostEdge' | 'goldBloom';

export interface ZonePalette {
  top: string;
  mid: string;
  bottom: string;
  accent: string;
  blob: string[];
}

export interface AmbientPreset {
  type: AmbientType;
  weight: number;
  color: string;
}

export interface AltitudeZone {
  id: ZoneId;
  name: string;
  /** Display label PT-BR on biome enter */
  label: string;
  minY: number;
  maxY: number;
  palette: ZonePalette;
  ambient: AmbientPreset[];
  windX: number;
  windY: number;
  density: number;
  breathPeriod: number;
  grainAlpha: number;
  blobKinds: BlobKind[];
  scenery: DecorKind[];
  overlay: OverlayKind;
  /** Target active ambient particles (before mobile scale) */
  particleBudget: number;
}

/** Overlap band for soft crossfade between zones */
export const ZONE_BLEND = 120;

export const ALTITUDE_ZONES: AltitudeZone[] = [
  {
    id: 'garden',
    name: 'Jardim creme',
    label: 'jardim…',
    minY: 0,
    maxY: 500,
    palette: {
      top: '#c5e0dc',
      mid: '#efe6c8',
      bottom: '#f3d5c8',
      accent: '#e8c878',
      blob: [
        'rgba(170, 220, 205, 0.32)',
        'rgba(245, 225, 180, 0.28)',
        'rgba(255, 200, 180, 0.24)',
      ],
    },
    ambient: [
      { type: 'pollen', weight: 0.35, color: '#f0d878' },
      { type: 'petal', weight: 0.28, color: '#ffd0e0' },
      { type: 'sparkleIdle', weight: 0.18, color: '#fff8e8' },
      { type: 'sugarDust', weight: 0.12, color: '#fff5e0' },
      { type: 'emberSoft', weight: 0.07, color: '#ffe8a8' },
    ],
    windX: 12,
    windY: 8,
    density: 1.15,
    breathPeriod: 11,
    grainAlpha: 0.04,
    blobKinds: ['slice', 'petal', 'flake'],
    scenery: ['leaf', 'hibiscus', 'citrus', 'abstractMote', 'leaf', 'citrus'],
    overlay: 'mottle',
    particleBudget: 380,
  },
  {
    id: 'bakery',
    name: 'Confeitaria',
    label: 'confeitaria…',
    minY: 500,
    maxY: 1000,
    palette: {
      top: '#f5d6e0',
      mid: '#f8e0d0',
      bottom: '#f0c8b0',
      accent: '#ffb8c8',
      blob: [
        'rgba(255, 210, 220, 0.3)',
        'rgba(255, 230, 200, 0.28)',
        'rgba(240, 200, 180, 0.22)',
      ],
    },
    ambient: [
      { type: 'sugarDust', weight: 0.28, color: '#ffffff' },
      { type: 'steam', weight: 0.22, color: 'rgba(255,245,240,0.55)' },
      { type: 'sprinkle', weight: 0.22, color: '#ff9eb5' },
      { type: 'petal', weight: 0.12, color: '#ffd0e0' },
      { type: 'dripAmbient', weight: 0.08, color: '#e8a878' },
      { type: 'sparkleIdle', weight: 0.08, color: '#ffe8f0' },
    ],
    windX: 18,
    windY: 6,
    density: 1.25,
    breathPeriod: 10,
    grainAlpha: 0.035,
    blobKinds: ['scoop', 'petal', 'flake'],
    scenery: ['cake', 'spoon', 'creamCloud', 'donut', 'creamCloud', 'abstractMote'],
    overlay: 'sugarVeil',
    particleBudget: 400,
  },
  {
    id: 'spa',
    name: 'Spa / sabonete',
    label: 'spa…',
    minY: 1000,
    maxY: 1500,
    palette: {
      top: '#c8e4e8',
      mid: '#d8e0ec',
      bottom: '#e4d8e8',
      accent: '#a8d8e0',
      blob: [
        'rgba(180, 220, 230, 0.3)',
        'rgba(210, 200, 225, 0.26)',
        'rgba(190, 230, 235, 0.22)',
      ],
    },
    ambient: [
      { type: 'bubbleFloat', weight: 0.38, color: '#c8e8f0' },
      { type: 'foamSpeck', weight: 0.22, color: '#ffffff' },
      { type: 'steam', weight: 0.18, color: 'rgba(230,240,245,0.5)' },
      { type: 'sparkleIdle', weight: 0.14, color: '#e0f4ff' },
      { type: 'dripAmbient', weight: 0.08, color: '#b8dce8' },
    ],
    windX: 8,
    windY: 14,
    density: 1.35,
    breathPeriod: 13,
    grainAlpha: 0.03,
    blobKinds: ['bubble', 'orb', 'flake'],
    scenery: ['bottle', 'bigBubble', 'towel', 'stone', 'bigBubble', 'abstractMote'],
    overlay: 'caustics',
    particleBudget: 420,
  },
  {
    id: 'frost',
    name: 'Gelado / cristal',
    label: 'gelo…',
    minY: 1500,
    maxY: 2000,
    palette: {
      top: '#d0e8f4',
      mid: '#e8f2f8',
      bottom: '#f4f8fc',
      accent: '#b8d8f0',
      blob: [
        'rgba(200, 225, 240, 0.32)',
        'rgba(230, 240, 250, 0.28)',
        'rgba(180, 210, 230, 0.22)',
      ],
    },
    ambient: [
      { type: 'frost', weight: 0.32, color: '#d0e8f8' },
      { type: 'snowMote', weight: 0.38, color: '#ffffff' },
      { type: 'sparkleIdle', weight: 0.22, color: '#e8f4ff' },
      { type: 'steam', weight: 0.08, color: 'rgba(220,235,245,0.4)' },
    ],
    windX: 22,
    windY: -6,
    density: 1.4,
    breathPeriod: 12,
    grainAlpha: 0.055,
    blobKinds: ['crystal', 'flake', 'orb'],
    scenery: ['crystal', 'iceBlock', 'snowflake', 'crystal', 'softOrb', 'snowflake'],
    overlay: 'frostEdge',
    particleBudget: 430,
  },
  {
    id: 'ether',
    name: 'Éter ASMR',
    label: 'éter…',
    minY: 2000,
    maxY: 1e9,
    palette: {
      top: '#f0e4dc',
      mid: '#f5ebe0',
      bottom: '#efe0c8',
      accent: '#e8d0a0',
      blob: [
        'rgba(240, 220, 200, 0.3)',
        'rgba(255, 235, 210, 0.26)',
        'rgba(230, 210, 190, 0.2)',
      ],
    },
    ambient: [
      { type: 'lightOrb', weight: 0.35, color: '#ffe8c8' },
      { type: 'emberSoft', weight: 0.22, color: '#ffd8a0' },
      { type: 'sparkleIdle', weight: 0.22, color: '#fff5e0' },
      { type: 'petal', weight: 0.14, color: '#f5d8c8' },
      { type: 'steam', weight: 0.07, color: 'rgba(255,248,240,0.4)' },
    ],
    windX: 6,
    windY: 10,
    density: 1.1,
    breathPeriod: 15,
    grainAlpha: 0.025,
    blobKinds: ['orb', 'petal', 'flake'],
    scenery: ['lightRing', 'softOrb', 'abstractMote', 'lightRing', 'softOrb', 'abstractMote'],
    overlay: 'goldBloom',
    particleBudget: 360,
  },
];

export function zoneIndexAt(height: number): number {
  for (let i = 0; i < ALTITUDE_ZONES.length; i++) {
    if (height < ALTITUDE_ZONES[i].maxY) return i;
  }
  return ALTITUDE_ZONES.length - 1;
}
