# Prompts IA — Sprite sheets Ascend Soft (v2 Pastel)

Use em **Midjourney, Flux, DALL·E, Ideogram** ou **Stable Diffusion**.
Gere **idle** primeiro; monte a faixa com `python scripts/build_sprite_sheet.py`.

Direção completa: `DESIGN_BIBLE.md`

---

## Estilo global (cole no início de TODO prompt)

```
Photorealistic ASMR food/soap texture, soft pastel color palette only,
studio softbox lighting from top-left, macro close-up, shallow depth of field,
satisfying tactile surface, clean white or transparent background,
no text, no watermark, no hands, no utensils, game asset sprite,
centered object, slight 3/4 top-down angle, consistent style series,
ultra detailed surface texture, dreamy cream mint blush butter tones,
never neon, never dark brown, never purple saturated
```

**Negative prompt (SD/Flux):**
```
cartoon, flat, low poly, blurry, text, logo, watermark, hands, fingers,
busy background, dark moody, purple neon, anime, pixel art, low resolution,
harsh contrast, black shadows, saturated orange, deep brown chocolate
```

---

## Template por material (idle → sheet automática)

Peça o **idle** isolado (16:9 ou 1:1). Depois:

```bash
python scripts/build_sprite_sheet.py {id} src/assets/platforms/source/{id}-idle-v2.png
# ou
python scripts/build_sprite_sheet.py --all
```

A sheet 1536×160 usa curva de squash **única por material**.

---

### 1. jelly — Gelatina (elastic / wobble)

```
[ESTILO GLOBAL] Translucent pastel mint seafoam jelly cube, soft ASMR gelatin,
internal bubbles, wet glossy highlight, colors #C9E4DE #B8D9D0 only.
Rounded cube, dreamy soft food photography, white background.
Personality: eternal jiggle — addictive wobble when landed on.
```

---

### 2. butter — Manteiga (melt / derrete)

```
[ESTILO GLOBAL] Soft pastel butter yellow creamy butter pat, gentle knife score marks,
slightly soft edges, oily cream sheen, colors #F3E2A8 #EBD4A0 #F0C9B0.
ASMR cooking macro, white background.
Personality: melts into a puddle when pressed — creamy indent then slow collapse.
```

---

### 3. mochi — Mochi (elastic / bounce extremo)

```
[ESTILO GLOBAL] Soft blush pink-white mochi rice cake ball, powdered sugar dusting,
matte fluffy chewy texture, subtle pink filling peek, colors #F0D5D8 #E8B4BC.
Japanese wagashi ASMR, white background.
Personality: deepest squash + tallest rebound — marshmallow bounce.
```

---

### 4. chocolate — Ganache (melt + shatter opcional)

```
[ESTILO GLOBAL] Soft caramel milk ganache square, glossy pastel surface NOT dark brown,
specular band, colors #E2C4A8 #D4B090 peach. Premium tablet look, white background.
Personality: dense flex; melts slowly or shatters on hard impact.
```

---

### 5. citrus — Casca cítrica (squeeze)

```
[ESTILO GLOBAL] Soft pastel citrus fruit wedge, visible pulp segments,
pale peach pulp #F2D4A0 #F5E0B8, white pith rim, peel pores, WEDGE shape not bar.
Juicy ASMR, white background.
Personality: pulp compresses; juice squeeze; gone on 2nd land.
```

---

### 6. honeycomb — Mel (melt / escorre)

```
[ESTILO GLOBAL] Soft golden pastel honeycomb chunk, hexagonal wax cells,
amber honey glow #EBD4A0 #F3E2A8, viscous sticky shine, white background.
Personality: sticky compress then honey drip melt.
```

---

### 7. glycerin — Sabonete glicerina (shatter)

```
[ESTILO GLOBAL] Translucent soft sky-blue glycerin soap bar, internal glitter,
glass refraction, chamfered edges, colors #D2E4F0 #C5D8E8, white background.
Personality: almost rigid — micro dent then crystal crack shatter.
```

---

### 8. whipped — Sabonete batido (foamPop)

```
[ESTILO GLOBAL] Whipped soap frosting peaks like soft serve mountains,
white + blush pink tips #FFFCF8 #F0D5D8, tall silhouette NOT flat bar, white background.
Personality: peaks collapse underfoot then foam POP.
```

---

### 9. kinetic — Areia cinética (crumble)

```
[ESTILO GLOBAL] Kinetic sand mound, warm beige pastel #E8D5C4 #F0E4D8,
visible grains, soft sculpted pile ASMR, white background.
Personality: footprint compress then grains crumble away.
```

---

### 10. iceSoap — Sabonete gelo (shatter)

```
[ESTILO GLOBAL] Frosty ice soap block, powder blue white #C5D8E8 #E8EEF2,
micro frost crystals, glassy cold surface, white background.
Personality: brittle — hairline cracks then shatter (easier than glycerin).
```

---

### 11. clearSlime — Slime cristal (foamPop)

```
[ESTILO GLOBAL] Clear transparent slime puddle, large soft bubbles,
mint seafoam #C9E4DE, surface tension rim, light caustics, white background.
Personality: spreads wide then bubble burst pop.
```

---

### 12. butterSlime — Butter slime (elastic seguro)

```
[ESTILO GLOBAL] Opaque butter slime clay, peachy #F0C9B0 coral soft folds,
matte creamy kneaded dough swirls, white background.
Personality: safe elastic dough fold — soft forever platform.
```

---

## Montagem (se gerar frames separados)

1. Canvas **1536 × 160**, fundo transparente
2. 6 frames **256 × 160**, base alinhada ~y=115
3. Preferir o script Python (curvas únicas) em vez de squash manual genérico
4. Salvar em `public/assets/platforms/{id}.png`

## Checklist

- [ ] Idle pastel coerente com a família
- [ ] Sheet 1536×160
- [ ] Fundo transparente
- [ ] Base alinhada
- [ ] Nome = `{materialId}.png`
- [ ] Console: `sprites: 12/12 IA`
