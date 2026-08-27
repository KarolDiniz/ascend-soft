import { AudioBus } from './audio/AudioBus';
import { spriteAtlas } from './assets/platforms/SpriteAtlas';
import { ALL_SPRITE_MATERIALS } from './assets/platforms/spriteConfig';
import { Game } from './game/Game';
import { Hud } from './ui/Hud';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const audio = new AudioBus();
const hud = new Hud();
const game = new Game(canvas, audio, hud);

void spriteAtlas.init().then(() => {
  console.info(
    `[Ascend Soft] sprites: ${spriteAtlas.aiCount()}/${ALL_SPRITE_MATERIALS.length} IA, resto placeholder`,
  );
});

const btnStart = document.getElementById('btn-start')!;
const btnRetry = document.getElementById('btn-retry')!;
const btnMute = document.getElementById('btn-mute')!;
const volume = document.getElementById('volume') as HTMLInputElement;

async function unlockAndPlay(): Promise<void> {
  if (!hud.isTitleVisible() || document.getElementById('title-screen')!.classList.contains('is-leaving')) {
    return;
  }
  await audio.unlock();
  audio.setVolume(Number(volume.value) / 100);
  hud.leaveTitle(() => game.beginPlay());
}

async function unlockAndRetry(): Promise<void> {
  if (!hud.isFallVisible()) return;
  await audio.unlock();
  game.retry();
}

btnStart.addEventListener('click', () => {
  void unlockAndPlay();
});

btnRetry.addEventListener('click', () => {
  void unlockAndRetry();
});

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Enter' && e.code !== 'Space') return;
  if (hud.isTitleVisible()) {
    e.preventDefault();
    void unlockAndPlay();
  } else if (hud.isFallVisible()) {
    e.preventDefault();
    void unlockAndRetry();
  }
});

btnMute.addEventListener('click', () => {
  void audio.unlock().then(() => {
    audio.setMuted(!audio.isMuted);
    hud.setMuteLabel(audio.isMuted);
  });
});

volume.addEventListener('input', () => {
  void audio.unlock().then(() => {
    const v = Number(volume.value) / 100;
    audio.setVolume(v);
    if (v === 0) {
      audio.setMuted(true);
      hud.setMuteLabel(true);
    } else if (audio.isMuted) {
      audio.setMuted(false);
      hud.setMuteLabel(false);
    }
  });
});

hud.setMuteLabel(false);
game.initTitle();
game.start();
