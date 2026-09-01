import { AudioBus } from './audio/AudioBus';
import { spriteAtlas } from './assets/platforms/SpriteAtlas';
import { ALL_SPRITE_MATERIALS } from './assets/platforms/spriteConfig';
import { Game } from './game/Game';
import { isTextEntryTarget } from './game/Input';
import { nameRejectMessage } from './leaderboard/namePolicy';
import { leaderboardService } from './leaderboard/LeaderboardService';
import { GlobalLeaderboard } from './ui/GlobalLeaderboard';
import { Hud } from './ui/Hud';
import { TitleCatalog } from './ui/TitleCatalog';
import { TitleCharacter } from './ui/TitleCharacter';
import { TitleSettings } from './ui/TitleSettings';
import { ControlsCoach } from './ui/ControlsCoach';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const audio = new AudioBus();
const hud = new Hud(audio);
const game = new Game(canvas, audio, hud);
const titleSettings = new TitleSettings(game, audio, hud);
const titleCatalog = new TitleCatalog((open) => game.setTitleOverlayOpen(open));
const titleCharacter = new TitleCharacter(game, audio);
const globalLeaderboard = new GlobalLeaderboard();
const controlsCoach = new ControlsCoach();
game.onCatalogRefresh = () => titleCatalog.refresh();
globalLeaderboard.onPlayingRankToggle = (show) => titleSettings.setShowPlayingRank(show);

hud.onTitleShow = () => {
  globalLeaderboard.setLocalBest(game.best);
  globalLeaderboard.onTitleShow();
};
hud.onPlayingShow = () => {
  globalLeaderboard.setLocalBest(game.best);
  globalLeaderboard.onPlayingShow();
  controlsCoach.showIfNeeded();
};
game.onLiveBest = (best) => globalLeaderboard.setLiveBest(best);
hud.onFallShow = () => {
  controlsCoach.hide();
  globalLeaderboard.onFallShow();
};

const nameInput = document.getElementById('player-name') as HTMLInputElement;
const nameHint = document.getElementById('player-name-hint') as HTMLSpanElement;
const NAME_HINT_DEFAULT = 'letras com acento · único';
nameInput.value = leaderboardService.getDisplayName();

function setNameHint(message?: string, isError = true): void {
  const error = Boolean(message) && isError;
  nameHint.textContent = message || NAME_HINT_DEFAULT;
  nameHint.classList.toggle('is-error', error);
  nameInput.classList.toggle('player-name-input--invalid', error);
  nameInput.setAttribute('aria-invalid', error ? 'true' : 'false');
}

let nameCheckTimer = 0;
nameInput.addEventListener('input', () => {
  setNameHint();
  window.clearTimeout(nameCheckTimer);
  const typed = nameInput.value;
  nameCheckTimer = window.setTimeout(() => {
    void leaderboardService.evaluateName(typed).then((result) => {
      if (nameInput.value !== typed) return;
      if (!result.ok) setNameHint(nameRejectMessage(result.reason));
      else if (result.unverified) setNameHint('sem conexão — unicidade na hora de enviar', false);
    });
  }, 380);
});
nameInput.addEventListener('change', () => {
  void leaderboardService.assertPlayableName(nameInput.value).then((result) => {
    if (result.ok) nameInput.value = result.name;
    else setNameHint(nameRejectMessage(result.reason));
  });
});

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

  const result = await leaderboardService.assertPlayableName(nameInput.value);
  if (!result.ok) {
    setNameHint(nameRejectMessage(result.reason));
    nameInput.focus();
    return;
  }
  nameInput.value = result.name;
  setNameHint();

  await audio.unlock();
  audio.setVolume(titleSettings.getVolume() / 100);
  await game.prepareMobileInput();
  hud.leaveTitle(() => game.beginIntro());
}

async function unlockAndRetry(): Promise<void> {
  if (!hud.isFallVisible()) return;
  await audio.unlock();
  await game.prepareMobileInput();
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
  if (isTextEntryTarget(e.target)) {
    if (e.code === 'Enter' && hud.isTitleVisible()) {
      e.preventDefault();
      void unlockAndPlay();
    }
    return;
  }
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
  if (!game.shouldWarnBeforeLeave()) return;
  e.preventDefault();
  e.returnValue = '';
});
