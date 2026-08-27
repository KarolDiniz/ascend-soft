# Prompts IA — Sprite sheets Ascend Soft

Use estes prompts em **Midjourney, Flux, DALL·E, Ideogram** ou **Stable Diffusion**.
Gere **6 frames** numa faixa horizontal (1536×160) ou gere 6 imagens e monte no Photopea/Figma.

---

## Estilo global (cole no início de TODO prompt)

```
Photorealistic ASMR food/soap texture, studio softbox lighting from top-left,
macro close-up, shallow depth of field, satisfying tactile surface,
clean transparent background, no text, no watermark, no hands, no utensils,
game asset sprite, centered object, slight 3/4 top-down angle,
consistent style series, ultra detailed surface texture, 8k quality
```

**Negative prompt (SD/Flux):**
```
cartoon, flat, low poly, blurry, text, logo, watermark, hands, fingers,
busy background, dark moody, purple neon, anime, pixel art, low resolution
```

---

## Template por material (6 frames)

Peça explicitamente:

> Sprite sheet horizontal, 6 frames, 1536x160 pixels total, each frame 256x160,
> transparent background, same object sequence: frame1 idle, frames 2-5 progressive squash when pressed, frame6 slight rebound bounce

---

### 1. jelly.png — Gelatina

```
[ESTILO GLOBAL] Translucent green jelly cube on clear surface, wobbly gelatin dessert,
internal bubbles, wet glossy highlight, soft jiggle ASMR texture.
6-frame sprite strip: resting → pressed down → max squash → recovering → slight overshoot bounce.
```

Variante rosa:
```
Translucent strawberry jelly dome, pink-red, bouncy wobble, wet shine
```

---

### 2. butter.png — Manteiga

```
[ESTILO GLOBAL] Yellow butter pat with knife score marks, creamy oily sheen,
European butter block slightly melted edges, ASMR cooking aesthetic.
6-frame strip: intact pat → finger press indent → flattened spread → rebound.
```

---

### 3. mochi.png — Mochi

```
[ESTILO GLOBAL] Soft white mochi rice cake ball, powdered sugar dusting,
subtle pink filling peek, matte fluffy texture, Japanese wagashi.
6-frame: round mochi → squished flat ellipse → bounce back.
```

---

### 4. chocolate.png — Ganache

```
[ESTILO GLOBAL] Dark chocolate bar segment with glossy ganache surface,
sharp specular band, segmented squares like premium tablet chocolate.
6-frame: rigid bar → slight flex indent → spring back minimal (dense).
```

---

### 5. citrus.png — Fatia cítrica

```
[ESTILO GLOBAL] Fresh orange fruit wedge slice, visible pulp segments,
bright orange pulp, white pith rim, citrus pores on peel, juicy ASMR.
6-frame: wedge → compressed pulp → juice squeeze → rebound. Wedge shape NOT rectangle.
```

---

### 6. honeycomb.png — Mel

```
[ESTILO GLOBAL] Golden honeycomb chunk with hexagonal cells, amber honey glow,
viscous sticky shine, translucent wax cells.
6-frame: hex block → sticky compress → slow rebound with honey stretch hint.
```

---

### 7. glycerin.png — Sabonete glicerina

```
[ESTILO GLOBAL] Translucent glycerin soap bar, soft pink or aqua, internal glitter particles,
glass-like refraction, soap cutting ASMR aesthetic, chamfered edges.
6-frame: soap bar → pressed dent → elastic recovery.
```

---

### 8. whipped.png — Sabonete batido

```
[ESTILO GLOBAL] Whipped soap frosting peaks like soft serve, dense foam mountains,
white-pastel pink, shadowed valleys between peaks, fluffy ASMR soap whip.
6-frame: tall peaks → peaks flatten → foam squish → partial rise back.
Tall silhouette, NOT flat bar.
```

---

### 9. kinetic.png — Areia cinética

```
[ESTILO GLOBAL] Kinetic sand mound, granular compressed sand texture,
warm beige, moldable sand ASMR, visible grains, soft sculpted pile.
6-frame: sand mound → footprint compress → grains scatter slightly → settle.
```

---

### 10. iceSoap.png — Sabonete gelo

```
[ESTILO GLOBAL] Frozen soap ice block, frosty blue-white, micro frost crystals,
hairline cracks, cold glassy surface, ice soap ASMR carving aesthetic.
6-frame: ice block → crack on impact → minimal bounce (rigid).
```

---

### 11. clearSlime.png — Slime cristal

```
[ESTILO GLOBAL] Clear transparent slime puddle, large internal bubbles,
high transparency, surface tension rim, light caustics, wet ASMR slime.
6-frame: blob puddle → spread wider → drip edge → elastic pull back.
```

---

### 12. butterSlime.png — Butter slime

```
[ESTILO GLOBAL] Opaque butter slime clay, peachy yellow, smooth fold swirls,
matte creamy texture, spreadable clay ASMR, soft folds like kneaded dough.
6-frame: folded blob → flattened → swirl reform.
```

---

## Montagem manual (se a IA gerar frames separados)

1. Abra **Photopea** (grátis) ou Figma
2. Canvas **1536 × 160 px**, fundo transparente
3. Coloque 6 frames de **256 × 160** lado a lado
4. Alinhe a **base** de todos os objetos na mesma linha (~y = 115)
5. Exporte PNG → salve em `public/assets/platforms/{id}.png`
6. Recarregue o jogo — console mostra `sprites: X/12 IA`

---

## Fluxo recomendado (Midjourney)

1. Gere **frame idle** primeiro até ficar perfeito
2. Use `--sref` / character reference para manter estilo
3. Gere variações "pressed", "squashed", "rebound" com mesmo seed
4. Monte a strip manualmente (MJ ainda não faz 6 frames consistentes numa imagem)

## Fluxo recomendado (Stable Diffusion + ControlNet)

1. Modelo fotorealista (RealVisXL, Juggernaut)
2. ControlNet depth ou canny para manter silhueta entre frames
3. Batch de 6 prompts com squash factor crescente
4. Automatize montagem com script Python (PIL)

---

## Checklist antes de usar no jogo

- [ ] 1536×160 px exatos
- [ ] Fundo 100% transparente
- [ ] Objeto legível em 256px de largura
- [ ] Mesma escala entre os 6 frames
- [ ] Base do objeto alinhada
- [ ] Nome do arquivo = `{materialId}.png`
