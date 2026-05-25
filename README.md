# country_starts

Projeto em Python para coletar diariamente playlists de radio country e gerar analytics com interface web moderna.

## O que este projeto faz

- Consulta diariamente duas URLs de playlist:
  - `CKDKFM_pl_YYYY-MM-DD.js`
  - `CKRYFM_pl_.YYYY-MM-DD.js`
- Considera sempre o dia anterior no job automatico.
- Extrai dados no formato `plCallback({...})`.
- Salva em PostgreSQL/Supabase com apenas uma tabela contendo:
  - artista
  - musica
  - data e hora da execucao
- Exibe pagina web para consultar:
  - artistas mais tocados
  - musicas dos artistas mais tocados
  - artista que mais tocou em uma data
  - musica que mais tocou em uma data
  - total de execucoes de um artista em uma data e top musicas dele nessa data

## Arquitetura

- Framework web: FastAPI
- Banco: PostgreSQL (Supabase)
- Deploy: Vercel (Python runtime)
- Agendamento: Vercel Cron (`/api/cron/fetch`)

## Estrutura

- `api/index.py`: entrypoint para Vercel
- `app/main.py`: rotas API + pagina web
- `app/ingest.py`: coleta e parse das playlists
- `app/db.py`: schema, indices e operacoes SQL
- `app/queries.py`: consultas analiticas otimizadas
- `app/templates/index.html`: dashboard
- `app/static/styles.css`: visual moderno
- `app/static/app.js`: chamadas de API e renderizacao

## Tabela unica e indices de performance

Tabela criada automaticamente no startup:

- `country_starts_plays(artist TEXT, song TEXT, played_at TIMESTAMPTZ)`
- chave primaria composta: `(artist, song, played_at)`

Indices criados automaticamente para otimizar filtros por data e agregacoes por artista/musica:

- `played_at DESC`
- `(artist, played_at DESC)`
- `(song, played_at DESC)`
- `((played_at::date), artist)`
- `((played_at::date), song)`

## Variaveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`.

Minimo necessario:

- `POSTGRES_URL`
- `CRON_SECRET` (recomendado para proteger o endpoint de cron)
- `APP_TIMEZONE` (opcional)

Voce pode usar as credenciais do Supabase que ja possui no painel da Vercel (Environment Variables).

## Rodando localmente

1. Criar e ativar ambiente virtual:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Instalar dependencias:

```bash
pip install -r requirements.txt
```

3. Configurar `.env`.

4. Subir a aplicacao:

```bash
uvicorn app.main:app --reload
```

5. Acessar:

- Web: `http://127.0.0.1:8000`
- Health: `http://127.0.0.1:8000/api/health`

## Rotas principais

- `POST /api/ingest/yesterday`
- `POST /api/ingest/date/{YYYY-MM-DD}`
- `GET /api/stats/top-artists?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=10`
- `GET /api/stats/top-songs-by-top-artists?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&artist_limit=5&song_limit=20`
- `GET /api/stats/top-artist-on-date?ref_date=YYYY-MM-DD`
- `GET /api/stats/top-song-on-date?ref_date=YYYY-MM-DD`
- `GET /api/stats/artist-on-date?artist=Nome&ref_date=YYYY-MM-DD`
- `GET /api/cron/fetch` (uso interno do cron)

## Deploy na Vercel

1. Importar o diretorio `country_starts` como projeto.
2. Configurar Environment Variables com os valores do Supabase/Postgres.
3. Garantir que `POSTGRES_URL` e `CRON_SECRET` estejam definidos.
4. Deploy.

O arquivo `vercel.json` ja inclui:

- Runtime Python para `api/index.py`
- Cron diario (`0 6 * * *`) chamando `/api/cron/fetch`

## Observacoes

- O horario retornado nas playlists e salvo com a data do arquivo consultado.
- O campo de hora da playlist e convertido para timestamp UTC.
- Caso queira fuso horario especifico de estacao, pode-se ajustar em `app/ingest.py`.
