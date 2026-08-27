import { AMBIENT_PASTEL, BIOME_PASTEL } from '../../theme/pastelPalette';

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
  particleBudget: number;
}

export const ZONE_BLEND = 120;

function biomePalette(id: ZoneId): ZonePalette {
  const b = BIOME_PASTEL[id];
  return { top: b.top, mid: b.mid, bottom: b.bottom, accent: b.accent, blob: [...b.blob] };
}

export const ALTITUDE_ZONES: AltitudeZone[] = [
  {
    id: 'garden',
    name: 'Jardim creme',
    label: 'jardim…',
    minY: 0,
    maxY: 500,
    palette: biomePalette('garden'),
    ambient: [
      { type: 'pollen', weight: 0.35, color: AMBIENT_PASTEL.pollen },
      { type: 'petal', weight: 0.28, color: AMBIENT_PASTEL.petal },
      { type: 'sparkleIdle', weight: 0.18, color: AMBIENT_PASTEL.sparkle },
      { type: 'sugarDust', weight: 0.12, color: AMBIENT_PASTEL.sugar },
      { type: 'emberSoft', weight: 0.07, color: AMBIENT_PASTEL.ember },
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
    palette: biomePalette('bakery'),
    ambient: [
      { type: 'sugarDust', weight: 0.28, color: AMBIENT_PASTEL.sugar },
      { type: 'steam', weight: 0.22, color: AMBIENT_PASTEL.steam },
      { type: 'sprinkle', weight: 0.22, color: AMBIENT_PASTEL.sprinkle[0] },
      { type: 'petal', weight: 0.12, color: AMBIENT_PASTEL.petal },
      { type: 'dripAmbient', weight: 0.08, color: AMBIENT_PASTEL.dripBakery },
      { type: 'sparkleIdle', weight: 0.08, color: AMBIENT_PASTEL.sparkle },
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
    palette: biomePalette('spa'),
    ambient: [
      { type: 'bubbleFloat', weight: 0.38, color: AMBIENT_PASTEL.bubble },
      { type: 'foamSpeck', weight: 0.22, color: AMBIENT_PASTEL.foam },
      { type: 'steam', weight: 0.18, color: AMBIENT_PASTEL.steam },
      { type: 'sparkleIdle', weight: 0.14, color: AMBIENT_PASTEL.sparkle },
      { type: 'dripAmbient', weight: 0.08, color: AMBIENT_PASTEL.dripSpa },
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
    palette: biomePalette('frost'),
    ambient: [
      { type: 'frost', weight: 0.32, color: AMBIENT_PASTEL.frost },
      { type: 'snowMote', weight: 0.38, color: AMBIENT_PASTEL.snow },
      { type: 'sparkleIdle', weight: 0.22, color: AMBIENT_PASTEL.sparkle },
      { type: 'steam', weight: 0.08, color: AMBIENT_PASTEL.steam },
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
    palette: biomePalette('ether'),
    ambient: [
      { type: 'lightOrb', weight: 0.35, color: AMBIENT_PASTEL.orb },
      { type: 'emberSoft', weight: 0.22, color: AMBIENT_PASTEL.ember },
      { type: 'sparkleIdle', weight: 0.22, color: AMBIENT_PASTEL.sparkle },
      { type: 'petal', weight: 0.14, color: AMBIENT_PASTEL.petal },
      { type: 'steam', weight: 0.07, color: AMBIENT_PASTEL.steam },
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
