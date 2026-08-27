# Platform sprite sheets (IA)

Coloque aqui os PNGs gerados por IA. O jogo carrega automaticamente.

## Formato obrigatório

| Propriedade | Valor |
|---|---|
| Arquivo | `{materialId}.png` |
| Tamanho total | **1536 × 160 px** |
| Frames | **6** em faixa horizontal |
| Frame unitário | **256 × 160 px** |
| Fundo | **transparente** |

### Nomes dos arquivos

```
jelly.png
butter.png
mochi.png
chocolate.png
citrus.png
honeycomb.png
glycerin.png
whipped.png
kinetic.png
iceSoap.png
clearSlime.png
butterSlime.png
```

### Sequência dos frames (esquerda → direita)

1. **Idle** — repouso
2. **Squash 1** — toque inicial
3. **Squash 2** — compressão máxima
4. **Squash 3** — ainda comprimido
5. **Squash 4** — começando a voltar
6. **Rebound** — leve overshoot elástico

## Já incluídos (IA — pack completo 12/12)

- `jelly.png` — gelatina
- `butter.png` — manteiga
- `mochi.png` — mochi
- `chocolate.png` — chocolate
- `citrus.png` — casca cítrica
- `honeycomb.png` — mel / honeycomb
- `glycerin.png` — sabonete glicerina
- `whipped.png` — sabonete batido
- `kinetic.png` — areia cinética
- `iceSoap.png` — sabonete gelo
- `clearSlime.png` — slime cristal
- `butterSlime.png` — butter slime

Fontes raw: `src/assets/platforms/source/`  
Montar faixa: `python scripts/build_sprite_sheet.py <id> <idle.png>`

## Como funciona no jogo

1. Ao iniciar, o jogo gera **placeholders** procedurais (6 frames).
2. Tenta carregar `/assets/platforms/{id}.png`.
3. Se existir, **substitui** o placeholder pelo sprite IA.
4. Animação de pouso usa os frames 1–5; idle oscila entre 0 e 6.

## Dicas para IA

- Vista **3/4 top-down** (como ASMR cutting board)
- Objeto **centralizado** no frame, base alinhada ~72% da altura
- **Mesmo estilo** em todos os 12 (luz de estúdio, soft box, fundo transparente)
- Exportar frames numa **única imagem** horizontal (sprite strip)
- WebP também funciona se renomear extensão para `.png` ou ajustar loader

Prompts prontos: `src/assets/platforms/AI_PROMPTS.md`
