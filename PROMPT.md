# Ascend Soft — Jogo ASMR de plataformas no browser

## Conceito refinado (o que é o jogo)

**Ascend Soft** é um endless climber minimalista e sensualmente calmo: um personagem leve sobe plataformas que **parecem e soam** deliciosas de pisar. O prazer vem menos da dificuldade e mais do **feedback sensorial** — squash suave, partículas lentas, câmera flutuante e sons ASMR de toque.

Não é um platformer de reflexo agressivo. É um **ritual de fluxo**: pular, pousar, ouvir, subir. Cada aterrissagem deve dar um pequeno “ahh”.

### Fantasia central
Você sobe um vazio bonito, feito de plataformas macias, luminosas e táteis. O objetivo não é “vencer” — é **entrar no ritmo** e ficar o máximo possível no flow, coletando “respiros” (pontos) e desbloqueando texturas sonoras/visuais.

### Loop principal
1. Personagem começa embaixo, câmera acompanha suavemente para cima.
2. Pula entre plataformas geradas proceduralmente.
3. Cada pouso = animação squash + partículas + som ASMR único daquele material.
4. Quanto mais alto, mais plataformas raras e sons mais ricos aparecem (sem punir o jogador com stress).
5. Queda = fade suave, som de exalação, restart instantâneo sem tela pesada de game over.

### Diferencial
- **Satisfação tátil digital**: o jogo é “ASMR jogável”.
- Plataformas com **personalidade material** (gelatina, madeira úmida, cristal fosco, nuvem de algodão, pedra polida, bolha d’água).
- Áudio em primeiro plano: mixagem cuidadosa, volumes baixos, texturas próximas do microfone (toques, clicks suaves, whooshes).
- Visual limpo, glow suave, motion blur sutil, interpolação elástica — nunca “arcade barulhento”.

---

## Direção de arte

### Paleta (evitar roxo genérico / dark mode clichê)
- Fundo: gradiente animado lento — azul-acinzentado pálido → menta suave → creme rosado muito leve.
- Plataformas: tons pastel com material legível (translúcido, fosco, brilhante).
- Personagem: silhueta simples, arredondada, 1 cor principal + highlight branco suave.
- Acentos: coral suave ou âmbar quente só em momentos de “pouso perfeito”.

### Estilo visual
- Formas orgânicas, cantos arredondados, poucas linhas.
- Partículas: pólen, bolhas, fagulhas de luz — sempre lentas e poucas.
- Squash & stretch elástico no personagem e nas plataformas ao pousar.
- Câmera com spring/damping (nunca travada; nunca com shake violento).
- Parallax de 2–3 camadas de fundo abstrato (formas flutuantes, não cenário realista).

### Motion (obrigatório, 2–3 intenções claras)
1. **Pouso elástico** da plataforma (afunda e volta com ease-out bounce suave).
2. **Trail / afterimage** leve do personagem no ar.
3. **Respiração do fundo** (gradiente e shapes oscilando em loop longo ~8–12s).

---

## Direção de áudio (ASMR)

### Princípios
- Sons curtos, próximos, “mic intimacy”.
- Sem música agressiva; preferir **drone ambient** muito baixo + one-shots de pouso.
- Cada material = família sonora própria.
- Layering: (1) ataque tátil + (2) corpo/resíduo + (3) ar/ambiente opcional.
- UI e falhas também suaves (nunca buzzer).

### Materiais sugeridos
| Material | Visual | Som |
|---|---|---|
| Gelatina | translúcida, wobble | *ploop* úmido suave |
| Madeira úmida | fosca, veios leves | toque de dedo em madeira |
| Cristal fosco | semi-opaco, brilho interno | *ting* abafado + reso curto |
| Algodão/nuvem | fluff, bordas difusas | *puff* de ar + tecido |
| Pedra polida | lisa, reflexo suave | click de unha em pedra |
| Bolha | iridescente, leve | *pop* molhado delicado |

### Eventos sonoros
- Jump: whoosh curto e aéreo
- Land: som do material + variação aleatória leve (±pitch)
- Perfect land (centro da plataforma): harmônico extra + partículas especiais
- Queda: fade + exhalação / vento distante
- Ambient loop: pad lento, quase imperceptível

Usar Web Audio API; assets leves (ogg/mp3/wav curtos). Permitir mute e slider de volume.

---

## Gameplay detalhado

### Controles (desktop + mobile)
- Desktop: setas / A-D mover, espaço / W / ↑ pular (ou auto-jump ao tocar borda, se preferir 1-botão)
- Mobile: toque esquerdo/direito da tela, ou tilt leve (opcional); botão de pulo grande
- Preferência recomendada para v1: **movimento horizontal + pulo no toque/espaço**, responsivo e imediato

### Física
- Gravidade suave, pulo com arco legível.
- Coyote time curto + jump buffer (sensação “justa” e fluida).
- Plataformas com colisão “doce”: personagem afunda 2–6px visualmente.
- Sem knockback agressivo.

### Geração de plataformas
- Spawn acima da câmera, destruir abaixo.
- Gap horizontal/vertical aumenta muito lentamente com a altura.
- Mistura de larguras e materiais.
- Ocasionalmente: plataforma móvel lenta, plataforma que some com fade (nunca unfair).
- Garantir sempre um caminho possível (seed / regras de reachability).

### Progressão / meta (leve)
- Altura máxima (best score) salva em `localStorage`.
- “Respiros” coletáveis (orbs suaves) = score secundário / cosmético.
- Desbloqueio cosmético: skins de personagem, packs de material, cores de fundo (após X altura).
- Sem ads, sem pressure de energia.

### Estados de tela
1. **Boot / Title**: marca + CTA “Subir” + toggle de som (autoplay policies: iniciar áudio no primeiro gesto).
2. **Play**: HUD mínimo (altura, best).
3. **Fall**: overlay translúcido “quase…”, botão “de novo”, sem fricção.

---

## Stack técnica recomendada

- **Vite + TypeScript + HTML Canvas** (ou PixiJS se quiser sprites/filtros fáceis)
- Ou **Phaser 3** se preferir engine pronta de física/input
- Áudio: Web Audio API (ou Howler.js)
- Deploy estático (qualquer host)
- Mobile-first, 60fps alvo, delta-time em tudo
- Sem backend na v1

Estrutura sugerida:
```
asmr-game/
  index.html
  package.json
  src/
    main.ts
    game/
      Game.ts
      Player.ts
      Platform.ts
      PlatformSpawner.ts
      Camera.ts
      Particles.ts
    audio/
      AudioBus.ts
      materials.ts
    ui/
      Hud.ts
      TitleScreen.ts
    assets/
      sfx/
      (placeholders ok)
    styles.css
  PROMPT.md
  README.md
```

---

## Critérios de qualidade (definição de “pronto”)

1. Abrir no browser e jogar em < 3s após load.
2. Cada pouso “sente” bom (visual + áudio sincronizados ≤ 1 frame de atraso perceptível).
3. 60fps estável em notebook médio e mobile moderno.
4. Controles fluidos; morte nunca frustrante.
5. Visual distintivo: se remover o nome, ainda parece o mesmo jogo (identidade própria).
6. Som é o co-protagonista — jogar mutado ainda é bonito, mas com som é viciante/calmante.
7. Mobile touch funcional + desktop teclado.
8. Best score persistente.

---

# PROMPT PARA A IA DESENVOLVER DO ZERO

Copie e cole o bloco abaixo em uma nova conversa de coding agent (Cursor / Claude / etc.):

```text
Você vai criar do zero, nesta pasta do projeto, um jogo web chamado "Ascend Soft".

## Visão
Endless climber ASMR: personagem sobe plataformas extremamente satisfatórias de pisar. O foco é prazer sensorial (visual + som), fluidez e beleza — não dificuldade hardcore. Cada aterrissagem deve gerar squash elástico, partículas suaves e um som ASMR tátil do material da plataforma. Queda = restart suave, sem game over pesado.

## Estética
- Visual limpo, orgânico, pastel (evitar tema roxo genérico, dark neon e UI de dashboard).
- Fundo com gradiente animado lento (azul-acinzentado → menta → creme rosado leve) + formas abstratas em parallax respirando em loop longo.
- Personagem silhueta arredondada simples com squash & stretch.
- Plataformas com materiais distintos: gelatina, madeira úmida, cristal fosco, algodão/nuvem, pedra polida, bolha.
- Motion obrigatório: (1) plataforma afunda e volta no pouso, (2) trail leve do personagem no ar, (3) respiração do fundo.
- Tipografia expressiva (não Inter/Roboto/Arial). Marca "Ascend Soft" forte na title screen.

## Áudio
- Ambient drone muito baixo + SFX ASMR por material (ploop, toque em madeira, ting abafado, puff, click suave, pop delicado).
- Web Audio API (ou Howler). Mute + volume.
- Iniciar áudio só após primeiro gesto do usuário.
- Variação leve de pitch nos pousos. Perfect land (centro) tem harmônico extra.
- Se assets reais não existirem, gerar placeholders programáticos (osciladores/noise envelopado) que já soem prazerosos, e estruturar o código para trocar por arquivos depois.

## Gameplay
- Controles: teclado (A/D ou setas + espaço) e touch (esquerda/direita + tap para pular).
- Física suave com coyote time e jump buffer.
- Plataformas geradas proceduralmente para cima, com caminho sempre alcançável; dificuldade sobe bem devagar.
- Score = altura máxima; salvar best em localStorage.
- Coletáveis opcionais "respiros" (orbs) para feedback extra.
- HUD mínimo. Title screen com CTA "Subir".

## Técnica
- Vite + TypeScript + Canvas 2D (preferencial) OU PixiJS/Phaser se justificar.
- Arquitetura limpa: Game loop, Player, Platform, Spawner, Camera (spring), Particles, AudioBus, UI.
- Delta-time, 60fps, mobile-first, responsivo (letterbox/safe area ok).
- Sem backend. README com como rodar (`npm i && npm run dev`).
- Código em inglês; textos de UI em português (Brasil).
- Commits não são necessários a menos que eu peça.

## Entrega (faça nesta ordem)
1. Scaffold Vite+TS e estrutura de pastas.
2. Loop do jogo + personagem + plataformas estáticas jogáveis.
3. Spawner procedural + câmera spring + score/best.
4. Feedback de pouso (squash, partículas, materiais).
5. Áudio ASMR (placeholders sintéticos ok) + title/UI + mute.
6. Polish mobile, perf, e README.
7. Ao final, abra/rode o dev server e confirme que o jogo inicia.

Construa um protótipo jogável e bonito de ponta a ponta, não um esqueleto vazio. Priorize a sensação de “pousar é gostoso”.
```

---

## Variações futuras (não fazer na v1, só roadmap)

- Modo “Zen” sem falha (plataformas sobem com você).
- Microfones binaurais / stems separados L/R.
- Editor de packs de material da comunidade.
- Daily seed compartilhado (mesma torre do dia).
- Skins cosméticas desbloqueáveis.
- Versão PWA instalável.
