export const LIGHT_MODE_KEY = 'ascend-soft-light-mode';
export const SETTINGS_KEY = 'ascend-soft-settings';

export type BannerMode = 'first' | 'always' | 'never';
export type LandIntensity = 'low' | 'medium' | 'high';
export type MobileControlMode = 'zones' | 'pad' | 'tilt';

export interface UserSettings {
  lightMode: boolean;
  volume: number;
  muted: boolean;
  voiceEnabled: boolean;
  landIntensity: LandIntensity;
  bannerMode: BannerMode;
  reduceMotion: boolean;
  showPlayingRank: boolean;
  mobileControls: MobileControlMode;
}

export const DEFAULT_SETTINGS: UserSettings = {
  lightMode: false,
  volume: 55,
  muted: false,
  voiceEnabled: true,
  landIntensity: 'medium',
  bannerMode: 'first',
  reduceMotion: false,
  showPlayingRank: true,
  mobileControls: 'pad',
};

function osPrefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      return { ...DEFAULT_SETTINGS, ...sanitize(parsed) };
    }
    const legacyLight = localStorage.getItem(LIGHT_MODE_KEY) === '1';
    return {
      ...DEFAULT_SETTINGS,
      lightMode: legacyLight,
      reduceMotion: osPrefersReducedMotion(),
    };
  } catch {
    return { ...DEFAULT_SETTINGS, reduceMotion: osPrefersReducedMotion() };
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
  if (typeof p.showPlayingRank === 'boolean') out.showPlayingRank = p.showPlayingRank;
  if (p.mobileControls === 'zones' || p.mobileControls === 'pad' || p.mobileControls === 'tilt') {
    out.mobileControls = p.mobileControls;
  }
  return out;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function landIntensityGain(level: LandIntensity): number {
  if (level === 'low') return 0.72;
  if (level === 'high') return 1.18;
  return 1;
}

/** Perfil de performance — normal vs modo leve */
export interface PerfProfile {
  lightMode: boolean;
  dprCap: number;
  mobileDprCap: number;
  /** 0 = sem teto. Limita pixels do backing store (fill-rate em celular alto). */
  maxBackingPixels: number;
  softPassScale: number;
  useSoftPass: boolean;
  ambientScale: number;
  particleScale: number;
  budgetScale: number;
  forceSceneryPerf: boolean;
  skipBiomeSprites: boolean;
  maxSceneryDraw: number;
  birdAmbience: boolean;
  /** Overlay de luz, grain, gradiente multiply, véu de bioma. */
  skipLightFx: boolean;
  /** Idle contínuo + emissão a partir do cenário. */
  skipIdleAmbient: boolean;
  skipPlatformDecor: boolean;
}

export function getPerfProfile(lightMode: boolean): PerfProfile {
  if (!lightMode) {
    return {
      lightMode: false,
      dprCap: 2,
      mobileDprCap: 2,
      maxBackingPixels: 0,
      softPassScale: 0.38,
      useSoftPass: true,
      ambientScale: 0.88,
      particleScale: 0.88,
      budgetScale: 0.86,
      forceSceneryPerf: false,
      skipBiomeSprites: false,
      maxSceneryDraw: 68,
      birdAmbience: true,
      skipLightFx: false,
      skipIdleAmbient: false,
      skipPlatformDecor: false,
    };
  }
  return {
    lightMode: true,
    dprCap: 1,
    mobileDprCap: 1,
    maxBackingPixels: 921600,
    softPassScale: 0.5,
    useSoftPass: false,
    ambientScale: 0.18,
    particleScale: 0.22,
    budgetScale: 0.2,
    forceSceneryPerf: true,
    skipBiomeSprites: true,
    maxSceneryDraw: 10,
    birdAmbience: false,
    skipLightFx: true,
    skipIdleAmbient: true,
    skipPlatformDecor: true,
  };
}

export function loadLightMode(): boolean {
  return loadSettings().lightMode;
}

export function saveLightMode(enabled: boolean): void {
  saveSettings({ ...loadSettings(), lightMode: enabled });
}
