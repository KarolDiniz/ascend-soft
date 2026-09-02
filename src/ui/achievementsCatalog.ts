import {
  ACHIEVEMENTS,
  type AchievementCategory,
  type AchievementDef,
  type AchievementIcon,
} from '../game/achievements/definitions';
import { achievementTracker } from '../game/achievements/tracker';
import { paintAchievementIcon } from './AchievementIcon';

const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  queda: 'Quedas',
  altura: 'Altura',
  perfeito: 'Perfeito',
  fiscal: 'Fiscal',
  moedas: 'Moedas',
  equip: 'Equipamento',
  ranking: 'Ranking',
  diario: 'Diário',
  secreta: 'Secretas',
};

const CATEGORY_ICON: Record<AchievementCategory, AchievementIcon> = {
  queda: 'skull',
  altura: 'height_peak',
  perfeito: 'target',
  fiscal: 'fiscal',
  moedas: 'coin',
  equip: 'backpack',
  ranking: 'rank_crown',
  diario: 'daily',
  secreta: 'secret_idle',
};

function createCategoryIconCanvas(icon: AchievementIcon): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  canvas.className = 'achievements-category-canvas';
  paintAchievementIcon(canvas, icon);
  return canvas;
}

function createCategoryHeader(cat: AchievementCategory): HTMLElement {
  const head = document.createElement('h3');
  head.className = 'achievements-category';

  const iconWrap = document.createElement('span');
  iconWrap.className = 'achievements-category-icon';
  iconWrap.appendChild(createCategoryIconCanvas(CATEGORY_ICON[cat]));

  const label = document.createElement('span');
  label.className = 'achievements-category-label';
  label.textContent = CATEGORY_LABEL[cat];

  head.append(iconWrap, label);
  return head;
}

function createAchievementCard(def: AchievementDef, owned: boolean): HTMLElement {
  const card = document.createElement('article');
  card.className = 'achievement-card';
  if (owned) card.classList.add('is-unlocked');
  if (def.secret && !owned) card.classList.add('is-secret');

  const iconWrap = document.createElement('div');
  iconWrap.className = 'achievement-card-icon';
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  canvas.className = 'achievement-card-canvas';
  if (owned) paintAchievementIcon(canvas, def.icon);
  iconWrap.appendChild(canvas);

  const title = document.createElement('h4');
  title.className = 'achievement-card-title';
  title.textContent = owned ? def.title : def.secret ? '???' : def.title;

  const hint = document.createElement('p');
  hint.className = 'achievement-card-hint';
  hint.textContent = owned ? def.hint : def.secret ? 'conquista secreta' : def.hint;

  card.append(iconWrap, title, hint);
  return card;
}

export function renderAchievementsInto(grid: HTMLElement, progressEl: HTMLElement): void {
  achievementTracker.reload();
  const unlocked = new Set(achievementTracker.getState().unlocked);
  const byCategory = new Map<AchievementCategory, AchievementDef[]>();
  for (const def of ACHIEVEMENTS) {
    const list = byCategory.get(def.category) ?? [];
    list.push(def);
    byCategory.set(def.category, list);
  }

  grid.className = 'catalog-grid catalog-grid--achievements';
  grid.replaceChildren();
  const frag = document.createDocumentFragment();

  for (const [cat, items] of byCategory) {
    const block = document.createElement('section');
    block.className = 'achievements-category-block';

    const head = createCategoryHeader(cat);
    block.appendChild(head);

    const section = document.createElement('div');
    section.className = 'achievements-grid-section';
    for (const def of items) {
      section.appendChild(createAchievementCard(def, unlocked.has(def.id)));
    }
    block.appendChild(section);
    frag.appendChild(block);
  }

  grid.appendChild(frag);
  progressEl.textContent = `${unlocked.size} / ${ACHIEVEMENTS.length} desbloqueadas`;
}
