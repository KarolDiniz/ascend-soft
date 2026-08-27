# Platform sprite sheets (IA) — v2 Pastel

Coloque aqui os PNGs. O jogo carrega automaticamente.

## Formato

| Propriedade | Valor |
|---|---|
| Arquivo | `{materialId}.png` |
| Tamanho total | **1536 × 160 px** |
| Frames | **6** em faixa horizontal |
| Frame unitário | **256 × 160 px** |
| Fundo | **transparente** |

### Pack v2 (12/12)

```
jelly.png       — gelatina (elastic wobble)
butter.png      — manteiga (melt)
mochi.png       — mochi (elastic bounce)
chocolate.png   — ganache (melt / shatter)
citrus.png      — casca cítrica (squeeze)
honeycomb.png   — mel (melt sticky)
glycerin.png    — sabonete glicerina (shatter)
whipped.png     — sabonete batido (foamPop)
kinetic.png     — areia cinética (crumble)
iceSoap.png     — sabonete gelo (shatter)
clearSlime.png  — slime cristal (foamPop)
butterSlime.png — butter slime (elastic)
```

### Frames (esquerda → direita)

1. **Idle** — respiração
2. **Squash 1** — toque
3. **Squash 2** — compressão
4. **Squash 3** — compressão forte
5. **Squash 4** — pico (melt/foam/max press) — usado no jogo
6. **Rebound** — overshoot

Cada material tem curva de squash própria no `scripts/build_sprite_sheet.py`.

## Rebuild

```bash
# fontes: src/assets/platforms/source/{id}-idle-v2.png
python scripts/build_sprite_sheet.py --all
```

Design: `src/assets/platforms/DESIGN_BIBLE.md`  
Prompts: `src/assets/platforms/AI_PROMPTS.md`
