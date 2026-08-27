# Ascend Soft — Design Bible das Plataformas (v2 Pastel)

Direção: **ASMR tátil pastel** — cada pouso é um micro-prazer sensorial.
Paleta: creme, menta, blush, manteiga, caramelo suave, céu pó. Nunca neon, nunca roxo saturado, nunca marrom escuro.

---

## Princípios

1. **Um material = uma personalidade** — silhueta, squash curve, som e morte únicos.
2. **Legível em <200ms** — cor + forma bastam mesmo em 80px.
3. **Animações viciantes** — overshoot elástico, derretimento lento, pop antecipado.
4. **Pastel wash** — sprites fotoreal recebem lavagem pastel no runtime.
5. **Base alinhada** — todos os frames apoiam o “chão” na mesma linha (~y=115 de 160).

---

## Paleta tokens

| Token | Hex | Uso |
|---|---|---|
| cream | `#F7F1EA` | fundo / wash |
| mint / seafoam | `#C9E4DE` / `#B8D9D0` | jelly, slime |
| blush / rose | `#F0D5D8` / `#E8B4BC` | mochi, whipped |
| butter / honey | `#F3E2A8` / `#EBD4A0` | manteiga, mel |
| peach / coral | `#F0C9B0` / `#E8A598` | butter slime |
| caramel | `#E2C4A8` | ganache (nunca dark) |
| citrus soft | `#F2D4A0` | casca |
| sky / powder | `#D2E4F0` / `#C5D8E8` | sabonetes |
| sand | `#E8D5C4` | areia cinética |

---

## Catálogo — função + animação

| ID | Visual | Behavior | Sensação no pouso | Morte / payoff | Curva de squash |
|---|---|---|---|---|---|
| `jelly` | Cubo/dome menta translúcido, bolhas | **elastic** | Wobble úmido infinito | — | Bounce alto, rebound 1.16 |
| `butter` | Bloco amarelo cremoso, marcas de faca | **melt** | Indent cremoso | Derrete ~1.35s → “derreteu!” | Flatten extremo → puddle |
| `mochi` | Bola blush fosca, açúcar | **elastic** | Bounce extremo fofo | — | Squash mais profundo + rebound 1.22 |
| `chocolate` | Ganache caramelo pastel | **melt** (+shatter se impacto alto) | Flex denso | Derrete ~1.75s ou quebra | Flex suave → melt |
| `citrus` | Fatia cítrica (não barra) | **squeeze** | Polpa esmaga | 2 pousos → “espremeu!” | Compress pulp |
| `honeycomb` | Hex âmbar + mel | **melt** | Sticky stretch | Escorre ~1.55s → “escorreu!” | Sticky slow flatten |
| `glycerin` | Barra céu translúcida + glitter | **shatter** | Dent mínimo | 2 lands / impacto → “quebra!” | Quase rígido |
| `whipped` | Picos de chantilly altos | **foamPop** | Picos colapsam | Pop ~0.95s → “pop!” | Collapse → squash4 |
| `kinetic` | Monte areia bege | **crumble** | Pegada de pé | Desmancha ~1.15s | Footprint → settle |
| `iceSoap` | Bloco gelo pó | **shatter** | Micro-crack | 2 lands / impacto leve → “quebra!” | Micro dent |
| `clearSlime` | Poça cristal menta | **foamPop** | Spread + bolhas | Estoura ~1.1s → “estourou!” | Blob spread + snap |
| `butterSlime` | Massa pêssego com dobras | **elastic** | Fold cremoso seguro | — | Dough fold rebound |

---

## Sequência de frames (1536×160)

| # | Nome | Papel geral |
|---|---|---|
| 0 | idle | Respiração / idle |
| 1 | squash1 | Toque inicial |
| 2 | squash2 | Compressão média |
| 3 | squash3 | Compressão forte |
| 4 | squash4 | Pico (melt puddle / foam anticipate / max press) |
| 5 | rebound | Overshoot elástico |

O picker de frames é **behavior-aware** (`SpriteRenderer.pickSpriteFrame`):
- melt/crumble → progressão por `meltProgress` / `integrity`
- foamPop → `squash4` na fase anticipate
- shatter → só squash leve + rachaduras
- elastic → ease cúbico em squash1–4 + breathe no rebound

---

## Pipeline de arte

1. Gerar idle pastel (`{id}-idle-v2.png`) → `src/assets/platforms/source/`
2. `python scripts/build_sprite_sheet.py --all` (curvas únicas por material)
3. Output → `public/assets/platforms/{id}.png`
4. Recarregar jogo — console: `sprites: 12/12 IA`

Prompts: `src/assets/platforms/AI_PROMPTS.md`
