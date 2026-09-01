export type NameRejectReason = 'too_short' | 'invalid_chars' | 'blocked' | 'taken';

export interface NameCheck {
  ok: boolean;
  name: string;
  reason?: NameRejectReason;
}

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  $: 's',
  '!': 'i',
  '|': 'i',
};

/** Palavras-chave normalizadas. Itens curtos só batem no nome inteiro / token. */
const BLOCK_EXACT = new Set([
  'cu',
  'pp',
  'kkk',
  'nazi',
  'puta',
  'puto',
  'bicha',
  'viado',
  'veado',
  'macaco',
  'nigga',
  'dick',
  'cock',
  'sexo',
]);

const BLOCK_CONTAINS = [
  'porra',
  'caralho',
  'merda',
  'bosta',
  'buceta',
  'xoxota',
  'punheta',
  'siririca',
  'foder',
  'fodase',
  'putinha',
  'putaria',
  'vadia',
  'vagabunda',
  'arrombado',
  'filhadaputa',
  'vaisefuder',
  'cuzao',
  'boiola',
  'traveco',
  'crioulo',
  'criolo',
  'nazista',
  'hitler',
  'nigger',
  'faggot',
  'retardado',
  'retardada',
  'mongoloide',
  'fuck',
  'fucking',
  'bitch',
  'asshole',
  'whore',
  'slut',
  'pussy',
];

export function normalizeName(raw: string): string {
  const stripped = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  let out = '';
  for (const ch of stripped) {
    out += LEET[ch] ?? ch;
  }
  out = out.replace(/[^a-z0-9]+/g, '');
  return out.replace(/(.)\1{2,}/g, '$1$1');
}

function tokens(raw: string): string[] {
  return raw
    .split(/[^A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç0-9]+/)
    .map((t) => normalizeName(t))
    .filter(Boolean);
}

export function isNameBlocked(raw: string): boolean {
  const key = normalizeName(raw);
  if (!key) return true;
  if (BLOCK_EXACT.has(key)) return true;
  if (tokens(raw).some((t) => BLOCK_EXACT.has(t))) return true;
  return BLOCK_CONTAINS.some((stem) => key.includes(stem));
}

/** Alfabeto brasileiro + números e espaço. Acentos ficam no nome exibido. */
const BR_NAME = /^[A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç0-9 ]+$/;
const BR_LETTER = /[A-Za-zÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç]/;

export function sanitizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 16);
}

export function checkDisplayName(raw: string): NameCheck {
  const name = sanitizeDisplayName(raw);
  if (name.length < 2) return { ok: false, name, reason: 'too_short' };
  if (!BR_NAME.test(name) || !BR_LETTER.test(name)) {
    return { ok: false, name, reason: 'invalid_chars' };
  }
  if (isNameBlocked(name)) return { ok: false, name, reason: 'blocked' };
  return { ok: true, name };
}

export function namesCollide(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  return na.length >= 2 && na === nb;
}

export function nameRejectMessage(reason: NameRejectReason | undefined): string {
  if (reason === 'blocked') return 'esse nome não é permitido';
  if (reason === 'taken') return 'esse nome já está em uso';
  if (reason === 'invalid_chars') return 'use letras (com acento) e números';
  if (reason === 'too_short') return 'use pelo menos 2 letras';
  return '';
}
