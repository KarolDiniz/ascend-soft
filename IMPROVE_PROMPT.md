# Prompt de polish — Ascend Soft (v2 sensorial)

Use o bloco abaixo numa nova conversa do Cursor **nesta pasta** (`asmr-game`), com o jogo já existente. O objetivo é transformar o protótipo atual num produto **viciante, tátil e visualmente memorável**.

---

## Copiar e colar

```text
Melhore o jogo Ascend Soft já existente nesta pasta. NÃO reescreva do zero — evolua o código atual (Vite + TypeScript + Canvas). Foque em: (1) consertar plataformas inalcançáveis, (2) identidade visual forte e memorável, (3) texturas ASMR icônicas (comidas, sabonetes, slime), (4) áudio mais prazeroso, (5) feedback que vicia e prende atenção.

============================================================
PRIORIDADE 0 — BUG CRÍTICO: PLATAFORMAS IMPOSSÍVEIS
============================================================

Problema real no código atual (`PlatformSpawner.ts` + `Player.ts`):
- jumpVel ≈ 420, gravity ≈ 980 → altura máxima de pulo ≈ 90 unidades.
- gapY atual sobe até ~120+ em dificuldade alta → INALCANÇÁVEL.
- maxGapX cresce demais; ao clamp nas bordas o X pode “teleportar” longe da plataforma anterior.
- Plataformas móveis (moveAmp alto) + fading podem tornar o salto injusto.

Corrija com regras rígidas de reachability:
1. Calcule e use constantes derivadas da física real do Player:
   - maxJumpHeight = jumpVel² / (2 * gravity) * 0.85 (margem de segurança)
   - maxAirTime / alcance horizontal realista com maxSpeed
2. gapY SEMPRE ≤ maxJumpHeight (com margem). Dificuldade altera ritmo/variedade, NÃO torna impossível.
3. Distância horizontal entre centros (ou entre bordas internas) SEMPRE alcançável no mesmo salto, considerando larguras.
4. Ao bater no limite do mundo, NÃO jogue a plataforma para o outro extremo: reflita/reescolha direção, ou aproxime da última.
5. Plataformas móveis: amp menor; garanta que no pior ponto da oscilação ainda seja alcançável a partir da anterior (ou spawne um “degrau” intermediário).
6. Fading: só começa a sumir DEPOIS do primeiro pouso OU dá tempo generoso (≥ 2.5s visível antes de fade) e nunca em sequência consecutiva unfair.
7. Sempre mantenha um caminho contínuo: cada plataforma N deve ser alcançável a partir de N-1 (e idealmente N-2 como backup).
8. Adicione um modo debug opcional (query ?debug=1) desenhando hitboxes / reach arcs para validar.

Teste mental: com controles médios, o jogador nunca deve ficar “preso” olhando uma plataforma que não dá para alcançar.

============================================================
PRIORIDADE 1 — IDENTIDADE VISUAL (parar de parecer genérico)
============================================================

Direção de marca: **"Ascend Soft — torre sensorial"**
Sensação: ASMR de cutting boards / soap carving / jelly / kinetic sand — mas jogável.
Evitar: roxo-neon, dark mode clichê, UI de dashboard, Inter/Roboto/Arial, cards genéricos.

Title / brand:
- Nome "Ascend Soft" como herói visual (grande, expressivo).
- Tipografia com personalidade (ex.: Something soft rounded / display amigável via Google Fonts — NÃO system default).
- Fundo da title com as mesmas texturas do jogo (preview animado de plataformas wobbling).
- CTA único: "Subir" — grande, com micro-interação (afunda como sabonete ao hover/press).

Mundo:
- Gradiente vivo e quente-frio (menta → creme manteiga → blush pêssego), com “respiração” lenta.
- Parallax de formas orgânicas que parecem fatias / bolhas / flocos — não geometria fria.
- Vinheta suave + grain bem leve (canvas noise overlay ~3–5% opacity) para sensação de vídeo ASMR.
- Câmera spring mais “cara” (overshoot mínimo no pouso perfeito).
- Personagem mais charmoso: blob com personalidade, blush, squash mais exagerado no land, trail com cor do último material pisado.

HUD mínimo, elegante, sem poluir: altura + best. Perfect-land flash em âmbar/coral suave.

============================================================
PRIORIDADE 2 — TEXTURAS FAMOSAS (COMIDA / SABONETE / ASMR)
============================================================

Substitua/expanda os materiais atuais por texturas imediatamente reconhecíveis e “deliciosas de pisar”. Cada material precisa de:
- Visual único (fill, stroke, detalhes procedurais no Canvas — veios, brilho, bolhas, glitter, fatias)
- Squash próprio (macio vs firme)
- Partículas próprias (migalhas, espuma, gotas, glitter, areia cinética)
- Som próprio (melhorar síntese Web Audio; layer ataque + corpo + cauda)

Catálogo sugerido (implementar pelo menos 8; pode mapear/renomear os IDs atuais):

COMIDAS / DOCES
1. jelly / gelatina translúcida (wobble forte, highlight úmido)
2. butter / manteiga (amarelo cremoso, marcas de faca suaves)
3. mochi / marshmallow (fosco fofo, bounce extremo)
4. chocolate / ganache (marrom brilhante, ripples)
5. citrus peel / casca cítrica (poros, zest particles)
6. honeycomb / mel (âmbar, células hex leves)

SABONETES / SELF-CARE ASMR
7. glycerin soap (translúcido colorido, glitter interno)
8. whipped soap / sabonete batido (picos de chantilly, foam particles)
9. kinetic sand (fosco granuloso, desintegra levemente no pouso)
10. ice soap / sabonete gelo (frio, cristalino, micro-crack visual)

SLIME / TÁTIL
11. clear slime (bolhas internas, stretch visual)
12. butter slime (opaco, dobras cremosas)

Desbloqueie materiais gradualmente com a altura (novidade = retenção).
Mostre o nome do material em fade curto no primeiro pouso daquele tipo (“manteiga”, “sabonete batido”) — reforça ASMR e identidade.

Render: detalhe procedural no `Platform.draw` — não sprites obrigatórios. Cada material deve ser identificável em <200ms.

============================================================
PRIORIDADE 3 — SATISFAÇÃO E VICIO (game feel)
============================================================

Cada pouso deve ser um mini-orgasmo sensorial:
1. Squash da plataforma mais pronunciado + recovery elástico (overshoot).
2. Personagem squash sincronizado (mais intenso em high impact).
3. Burst de partículas do material (8–16, lentas, com drag).
4. Som layered (transient + body + soft tail).
5. Perfect land (centro ±15%): ring de luz, chime harmônico, score popup “+”, screen punch sutil (scale 1.01 → 1).
6. Combo de perfects: streak visual/sonoro crescente (sem stress — recompensa, não punição).
7. Coletar “respiros” com magnetismo leve quando perto + som de inhale gostoso.
8. Haptic opcional: `navigator.vibrate` curto no land (mobile).

Retention loops leves (sem dark patterns agressivos):
- Best height com celebração ao quebrar recorde (confetti soft + som especial).
- “Quase…” na queda com altura alcançada em destaque + 1-tap restart.
- Progressão de novidade: novos materiais / cores de fundo a cada marco (250, 500, 1000…).
- Streak de perfects mostrado discretamente (não HUD barulhento).

Controles: manter teclado + touch. Considere auto-run horizontal opcional NÃO; foque em responsividade. Ajuste friction/air control se necessário para “sentir justeza” após corrigir gaps.

============================================================
PRIORIDADE 4 — ÁUDIO MAIS PRAZEROSO
============================================================

Melhore `AudioBus.ts` (síntese ok, sem assets externos obrigatórios):
- Ambient: pad mais quente, menos “orgão MIDI”; talvez noise rosa filtrado + 2 sines detunadas bem baixas.
- Jump: whoosh aéreo curto com noise + filtro (não beep).
- Land por material: cada um deve ser instantaneamente distinto e “ASMR-mic close”.
  - jelly: ploop úmido grave
  - butter: soft thup cremoso
  - soap: squish + micro-foam noise
  - kinetic sand: shush granular
  - crystal/ice soap: ting abafado glass
  - slime: wet stretch blorp
- Perfect: harmônico doce, nunca agudo agressivo.
- Fall: exhale + low whoosh, confortável.
- Volumes: master confortável; sidechain leve do ambient quando land (ducking 80–120ms) para o pouso “brilhar”.
- Mute/volume UI claros; unlock no primeiro gesto.

============================================================
PRIORIDADE 5 — POLISH DE PRODUTO
============================================================

- 60fps estável; particles pooled; não alocar à toa no hot path.
- Mobile-first: touch zones claras, safe-area, botões grandes na title.
- Preload/font; sem layout shift feio.
- README atualizado se necessário.
- Textos de UI em português (Brasil); código em inglês.
- Não adicione ads, paywall, nem sistemas complexos de inventário.

============================================================
ORDEM DE EXECUÇÃO
============================================================

1. Corrigir reachability no spawner (e validar com debug).
2. Expandir materials + draw + particles + sons.
3. Refinar brand/title/background/personagem.
4. Perfect/combo/recorde + juice de pouso.
5. Pass final de áudio + mobile + perf.

Ao terminar, rode `npm run dev` e confirme:
- Nenhuma sequência comum de plataformas é impossível.
- Pousar em manteiga/sabonete/gelatina é visível e audivelmente diferente.
- Title tem identidade forte.
- Quero “só mais uma subida” — sensação de flow viciante.

Entregue mudanças reais no código, não só ideias.
```

---

## Notas rápidas (para você)

| Problema | Causa no código atual | O que o prompt pede |
|---|---|---|
| Plataformas impossíveis | `gapY` pode passar ~90 (teto do pulo) | Cap de gap pela física do player |
| Visual genérico | 6 materiais abstratos pastel | Comidas + sabonetes ASMR icônicos |
| Pouco vício | Feedback ok, mas sem streak/marcos | Perfect combo + novidade por altura |
| Som “synth básico” | Osciladores simples sem ducking | Layers ASMR + ducking do ambient |

Arquivos que a IA deve tocar com mais frequência: `PlatformSpawner.ts`, `Player.ts`, `Platform.ts`, `materials.ts`, `AudioBus.ts`, `Background.ts`, `Game.ts`, `styles.css`, title/UI.
