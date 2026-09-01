# Ranking global — Ascend Soft

O jogo usa **Supabase (plano Free)** para o ranking global. Sem configurar o `.env`, o jogo funciona em **modo local** (ranking só no seu navegador).

## Setup gratuito (~5 min)

### 1. Criar projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (grátis).
2. **New project** → escolha nome, senha do banco e região.
3. Aguarde o projeto ficar pronto.

### 2. Criar tabelas

1. No painel: **SQL Editor** → **New query**.
2. Copie todo o conteúdo de `supabase/schema.sql`.
3. Clique **Run**.

### 3. Pegar credenciais

1. **Settings** → **API**.
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 4. Configurar o jogo

Na raiz do projeto:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais.

Depois rode de novo o `supabase/schema.sql` no SQL Editor (dá para executar o arquivo inteiro). Ele agora também trava **nomes ofensivos** e **nomes repetidos** no ranking.

### 5. Rodar

```bash
npm run dev
```

Na tela inicial, o painel **Ranking** deve mostrar `global` (não `local`).

## Deploy (Vite / Netlify / Vercel)

Adicione as mesmas variáveis de ambiente no painel do host (**obrigatório no build** — o Vite embute no JS):

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- ou `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Rebuild / Redeploy depois de salvar. Sem essas vars, o ranking cai para modo **local** (só neste navegador).

O `schema.sql` também rejeita scores implausíveis (altura vs tempo, breaths/colecionáveis vs altura) e exige `height >= 3`. Rode o arquivo de novo no SQL Editor após puxar esta versão.

## Performance

- Tela inicial: 1 fetch da lista + **Realtime** (INSERT em `scores`) + refresh de segurança a cada 90 s.
- Partida: **zero polling**. A janela (você + 3 rivais) usa a altura ao vivo contra o snapshot; rivais novos entram pelo mesmo Realtime.
- **1 request** ao cair (submit do score).

Se o selo do ranking na capa não virar **ao vivo**, rode de novo o `schema.sql` (ele registra `scores` na publication `supabase_realtime`). No painel: **Database → Publications** e confirme que `scores` está habilitada.

## Limites do plano Free Supabase

- 500 MB banco, API generosa para jogos casuais
- Mais que suficiente para este ranking

## Modo local (sem Supabase)

Sem `.env`, scores ficam em `localStorage` do navegador. Útil para dev offline.
