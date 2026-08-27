export const LIGHT_MODE_KEY = 'ascend-soft-light-mode';

export function loadLightMode(): boolean {
  try {
    return localStorage.getItem(LIGHT_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveLightMode(enabled: boolean): void {
  try {
    localStorage.setItem(LIGHT_MODE_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** Perfil de performance — normal vs modo leve */
export interface PerfProfile {
  lightMode: boolean;
  dprCap: number;
  mobileDprCap: number;
  softPassScale: number;
  useSoftPass: boolean;
  ambientScale: number;
  particleScale: number;
  budgetScale: number;
  forceSceneryPerf: boolean;
  skipBiomeSprites: boolean;
  maxSceneryDraw: number;
  simplifyLandAudio: boolean;
  birdAmbience: boolean;
}

export function getPerfProfile(lightMode: boolean): PerfProfile {
  if (!lightMode) {
    return {
      lightMode: false,
      dprCap: 2,
      mobileDprCap: 2,
      softPassScale: 0.38,
      useSoftPass: true,
      ambientScale: 1,
      particleScale: 1,
      budgetScale: 1,
      forceSceneryPerf: false,
      skipBiomeSprites: false,
      maxSceneryDraw: 9999,
      simplifyLandAudio: false,
      birdAmbience: true,
    };
  }
  return {
    lightMode: true,
    dprCap: 1.25,
    mobileDprCap: 1,
    softPassScale: 0.55,
    useSoftPass: true,
    ambientScale: 0.52,
    particleScale: 0.55,
    budgetScale: 0.58,
    forceSceneryPerf: true,
    skipBiomeSprites: true,
    maxSceneryDraw: 44,
    simplifyLandAudio: true,
    birdAmbience: false,
  };
}
