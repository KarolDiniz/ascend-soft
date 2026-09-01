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

## Performance

- Rede **somente** na tela inicial (fetch + refresh a cada 90 s).
- **1 request** ao cair (submit do score).
- **Zero** requests durante a partida.

## Limites do plano Free Supabase

- 500 MB banco, API generosa para jogos casuais
- Mais que suficiente para este ranking

## Modo local (sem Supabase)

Sem `.env`, scores ficam em `localStorage` do navegador. Útil para dev offline.
