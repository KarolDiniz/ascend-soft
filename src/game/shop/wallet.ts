import { SHOP_BY_ID, type ShopItemId } from './catalog';

const KEY = 'ascend-soft-wallet';
const STOCK_CAP = 9;
/** Moedas com que o bolso começa. Troque 0 por 500 (por exemplo) para testar a loja. */
export const STARTING_COINS = 0;

export type ShopStock = Record<ShopItemId, number>;

export interface WalletState {
  coins: number;
  stock: ShopStock;
}

const EMPTY_STOCK: ShopStock = { jetpack: 0, lightPotion: 0, propHat: 0 };

function emptyWallet(): WalletState {
  return { coins: STARTING_COINS, stock: { ...EMPTY_STOCK } };
}

function clampStock(n: unknown): number {
  return Math.max(0, Math.min(STOCK_CAP, Math.floor(Number(n) || 0)));
}

function sanitize(raw: unknown): WalletState {
  if (!raw || typeof raw !== 'object') return emptyWallet();
  const o = raw as Record<string, unknown>;
  const coins = Math.max(0, Math.floor(Number(o.coins) || 0));
  const stockRaw =
    o.stock && typeof o.stock === 'object' ? (o.stock as Record<string, unknown>) : {};
  return {
    coins,
    stock: {
      jetpack: clampStock(stockRaw.jetpack),
      lightPotion: clampStock(stockRaw.lightPotion),
      propHat: clampStock(stockRaw.propHat),
    },
  };
}

let cache: WalletState | null = null;

export function loadWallet(): WalletState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? sanitize(JSON.parse(raw)) : emptyWallet();
  } catch {
    cache = emptyWallet();
  }
  if (STARTING_COINS > 0 && cache.coins < STARTING_COINS) {
    return persist({ ...cache, coins: STARTING_COINS });
  }
  return cache;
}

function persist(next: WalletState): WalletState {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

export function addCoins(amount: number): WalletState {
  if (amount <= 0) return loadWallet();
  const w = loadWallet();
  return persist({ ...w, coins: w.coins + Math.floor(amount) });
}

export function stockOf(id: ShopItemId): number {
  return loadWallet().stock[id];
}

export type BuyResult = 'ok' | 'poor' | 'full';

export function tryBuy(id: ShopItemId): BuyResult {
  const def = SHOP_BY_ID[id];
  const w = loadWallet();
  if (w.coins < def.price) return 'poor';
  if (w.stock[id] >= STOCK_CAP) return 'full';
  persist({
    coins: w.coins - def.price,
    stock: { ...w.stock, [id]: w.stock[id] + 1 },
  });
  return 'ok';
}

export function consumeCharge(id: ShopItemId): boolean {
  const w = loadWallet();
  if (w.stock[id] <= 0) return false;
  persist({
    ...w,
    stock: { ...w.stock, [id]: w.stock[id] - 1 },
  });
  return true;
}
