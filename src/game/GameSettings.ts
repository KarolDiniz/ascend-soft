export const LIGHT_MODE_KEY = 'ascend-soft-light-mode';
export const SETTINGS_KEY = 'ascend-soft-settings';

export type BannerMode = 'first' | 'always' | 'never';
export type LandIntensity = 'low' | 'medium' | 'high';

export interface UserSettings {
  lightMode: boolean;
  volume: number;
  muted: boolean;
  voiceEnabled: boolean;
  landIntensity: LandIntensity;
  bannerMode: BannerMode;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  lightMode: false,
  volume: 55,
  muted: false,
  voiceEnabled: true,
  landIntensity: 'medium',
  bannerMode: 'first',
  reduceMotion: false,
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      return { ...DEFAULT_SETTINGS, ...sanitize(parsed) };
    }
    const legacyLight = localStorage.getItem(LIGHT_MODE_KEY) === '1';
    return { ...DEFAULT_SETTINGS, lightMode: legacyLight };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(LIGHT_MODE_KEY, settings.lightMode ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function sanitize(p: Partial<UserSettings>): Partial<UserSettings> {
  const out: Partial<UserSettings> = {};
  if (typeof p.lightMode === 'boolean') out.lightMode = p.lightMode;
  if (typeof p.volume === 'number') out.volume = clamp(Math.round(p.volume), 0, 100);
  if (typeof p.muted === 'boolean') out.muted = p.muted;
  if (typeof p.voiceEnabled === 'boolean') out.voiceEnabled = p.voiceEnabled;
  if (p.landIntensity === 'low' || p.landIntensity === 'medium' || p.landIntensity === 'high') {
    out.landIntensity = p.landIntensity;
  }
  if (p.bannerMode === 'first' || p.bannerMode === 'always' || p.bannerMode === 'never') {
    out.bannerMode = p.bannerMode;
  }
  if (typeof p.reduceMotion === 'boolean') out.reduceMotion = p.reduceMotion;
  return out;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function landIntensityGain(level: LandIntensity): number {
  if (level === 'low') return 0.52;
  if (level === 'high') return 1.42;
  return 1;
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
      ambientScale: 0.88,
      particleScale: 0.88,
      budgetScale: 0.86,
      forceSceneryPerf: false,
      skipBiomeSprites: false,
      maxSceneryDraw: 68,
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

export function loadLightMode(): boolean {
  return loadSettings().lightMode;
}

export function saveLightMode(enabled: boolean): void {
  saveSettings({ ...loadSettings(), lightMode: enabled });
}
