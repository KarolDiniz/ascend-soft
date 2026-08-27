import { AudioBus } from './audio/AudioBus';
import { Game } from './game/Game';
import { Hud } from './ui/Hud';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const audio = new AudioBus();
const hud = new Hud();
const game = new Game(canvas, audio, hud);

const btnStart = document.getElementById('btn-start')!;
const btnRetry = document.getElementById('btn-retry')!;
const btnMute = document.getElementById('btn-mute')!;
const volume = document.getElementById('volume') as HTMLInputElement;

async function unlockAndPlay(): Promise<void> {
  await audio.unlock();
  audio.setVolume(Number(volume.value) / 100);
  game.beginPlay();
}

btnStart.addEventListener('click', () => {
  void unlockAndPlay();
});

btnRetry.addEventListener('click', () => {
  void audio.unlock().then(() => game.retry());
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
