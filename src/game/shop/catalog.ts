export type ShopItemId = 'jetpack' | 'lightPotion' | 'propHat';

export interface ShopItemDef {
  id: ShopItemId;
  name: string;
  hint: string;
  price: number;
  kind: 'consumable';
}

export const SHOP_ITEMS: readonly ShopItemDef[] = [
  {
    id: 'jetpack',
    name: 'mochila a jato',
    hint: 'no 2º pulo, segura · sobe até o céu · 1 tanque',
    price: 210,
    kind: 'consumable',
  },
  {
    id: 'lightPotion',
    name: 'peso leve',
    hint: 'beba na subida · pulo bem maior e nada quebra · 1 min',
    price: 170,
    kind: 'consumable',
  },
  {
    id: 'propHat',
    name: 'chapéu-hélice',
    hint: 'ponha na subida · queda bem lenta · 1 min',
    price: 50,
    kind: 'consumable',
  },
];

export const SHOP_BY_ID: Record<ShopItemId, ShopItemDef> = Object.fromEntries(
  SHOP_ITEMS.map((item) => [item.id, item]),
) as Record<ShopItemId, ShopItemDef>;
