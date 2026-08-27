import type { MaterialId } from '../../audio/materials';
import {
  buildThemedZones,
  cyclicHeight,
  PHASE_BLEND,
  PHASE_COUNT,
  type AmbientPreset,
  type AmbientType,
  type BlobKind,
  type DecorKind,
  type OverlayKind,
  type ThemedPhaseZone,
  type ZonePalette,
} from '../ThemedPhases';

/** Each themed phase zone id = its platform material. */
export type ZoneId = MaterialId;

export type { AmbientPreset, AmbientType, BlobKind, DecorKind, OverlayKind, ZonePalette };

export type AltitudeZone = ThemedPhaseZone;

/** Smooth blend at each phase boundary (240 units total). */
export const ZONE_BLEND = PHASE_BLEND;

/** 20 themed phases — one material per ~700 altitude units, cycling. */
export const ALTITUDE_ZONES: AltitudeZone[] = buildThemedZones();

export function zoneIndexAt(height: number): number {
  const ch = cyclicHeight(height);
  for (let i = 0; i < PHASE_COUNT; i++) {
    if (ch < ALTITUDE_ZONES[i].maxY) return i;
  }
  return PHASE_COUNT - 1;
}
