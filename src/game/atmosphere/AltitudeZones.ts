import type { MaterialId } from '../../audio/materials';
import { getPhaseRun } from '../PhaseRunOrder';
import {
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

/** Zonas da partida atual — ordem embaralhada por run */
export function getAltitudeZones(): readonly AltitudeZone[] {
  return getPhaseRun().zones;
}

export function zoneIndexAt(height: number): number {
  return getPhaseRun().phaseIndexAt(height);
}

export { cyclicHeight, PHASE_COUNT };
