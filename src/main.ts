import { AudioBus } from './audio/AudioBus';
import { spriteAtlas } from './assets/platforms/SpriteAtlas';
import { ALL_SPRITE_MATERIALS } from './assets/platforms/spriteConfig';
import { Game } from './game/Game';
import { Hud } from './ui/Hud';
import { LeaveGuard } from './ui/LeaveGuard';
import { TitleCatalog } from './ui/TitleCatalog';
import { TitleCharacter } from './ui/TitleCharacter';
import { TitleSettings } from './ui/TitleSettings';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const audio = new AudioBus();
const hud = new Hud(audio);
const game = new Game(canvas, audio, hud);
const titleSettings = new TitleSettings(game, audio, hud);
const titleCatalog = new TitleCatalog((open) => game.setTitleOverlayOpen(open));
const titleCharacter = new TitleCharacter(game, audio);
const leaveGuard = new LeaveGuard(audio);
game.onCatalogRefresh = () => titleCatalog.refresh();

void spriteAtlas.init().then(() => {
  console.info(
    `[Ascend Soft] sprites: ${spriteAtlas.aiCount()}/${ALL_SPRITE_MATERIALS.length} IA, resto placeholder`,
  );
});

const btnStart = document.getElementById('btn-start')!;
const btnRetry = document.getElementById('btn-retry')!;
const btnHome = document.getElementById('btn-home')!;

async function unlockAndPlay(): Promise<void> {
  if (titleSettings.isOpen() || titleCatalog.isOpen() || titleCharacter.isOpen()) return;
  if (!hud.isTitleVisible() || document.getElementById('title-screen')!.classList.contains('is-leaving')) {
    return;
  }
  await audio.unlock();
  audio.setVolume(titleSettings.getVolume() / 100);
  hud.leaveTitle(() => game.beginIntro());
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

btnHome.addEventListener('click', () => {
  game.goToTitle();
});

window.addEventListener('keydown', (e) => {
  if (titleSettings.isOpen() || titleCatalog.isOpen() || titleCharacter.isOpen()) return;
  if (e.code === 'Escape' && hud.isFallVisible()) {
    e.preventDefault();
    game.goToTitle();
    return;
  }
  if (e.code !== 'Enter' && e.code !== 'Space') return;
  if (hud.isTitleVisible()) {
    e.preventDefault();
    void unlockAndPlay();
  } else if (hud.isFallVisible()) {
    e.preventDefault();
    void unlockAndRetry();
  }
});

game.initTitle();
game.start();

window.addEventListener('beforeunload', (e) => {
  leaveGuard.promptLeave();
  e.preventDefault();
  e.returnValue = '';
});
