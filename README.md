# GlobalMarketSuite

Full-stack blog and AI publishing platform for `globalmarketsuite.com`: Vite React frontend, Express TypeScript backend, PostgreSQL, Redis, JWT auth, refresh-token sessions, CSRF protection, admin publishing, OpenRouter generation, and Docker dev/prod environments.

## Stack

- Frontend: Vite, React, TypeScript, SCSS, client-side routing, admin panel inside the app.
- Backend: Node.js, Express, TypeScript, PostgreSQL, Redis-ready runtime, bcrypt password hashing, JWT access tokens, secure refresh-token cookies, CSRF checks, audit log, rate limiting, HTML sanitization, structured errors.
- AI: OpenRouter, default model `meta-llama/llama-3.1-8b-instruct`.
- Ports: frontend `3000`, backend `4000`.

## Project Structure

- `frontend/` public blog, article pages, about page, and admin UI.
- `backend/` API, database schema initialization, auth, admin routes, OpenRouter service, scheduler.
- `scripts/setup-dev-env.mjs` creates `.env`, `backend/.env`, and `frontend/.env`.
- `scripts/setup-prod-env.mjs` creates production env templates with generated secrets.
- `docker-compose.yml` runs dev containers.
- `docker-compose.prod.yml` is the production-oriented compose file.

## Dev Start

```bash
npm run dev:docker
```

This runs `npm run setup:dev-env` first, then starts Postgres, Redis, backend, frontend, and `admin-seed`.

Equivalent direct Docker command:

```bash
npm run setup:dev-env
docker compose up --build -d
```

Frontend: `http://localhost:3000`

Backend health: `http://localhost:4000/api/health`

Admin: `http://localhost:3000/admin`

## Superadmin

The `admin-seed` service creates or updates the local superadmin.

Default local login:

- Email: `admin@globalmarketsuite.local`
- Password: `MySecretPassword123!`

Override before running Docker:

```bash
LOCAL_SUPERADMIN_EMAIL=admin@example.com LOCAL_SUPERADMIN_PASSWORD='replace-me' npm run dev:docker
```

The password is stored as a bcrypt hash in PostgreSQL, never as plain text.

## Environment Setup

Real env files are ignored by git:

- `.env`
- `backend/.env`
- `frontend/.env`
- `.env.production`
- `backend/.env.production`

Example files are committed:

- `.env.example`
- `.env.production.example`
- `backend/.env.example`
- `backend/.env.production.example`
- `frontend/.env.example`

`scripts/setup-dev-env.mjs` generates `JWT_SECRET` and `REFRESH_TOKEN_SECRET` automatically. Put `OPENROUTER_API_KEY` once in root `.env`; the setup script propagates it into `backend/.env`.

## OpenRouter

Root `.env`:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
```

If the key is missing, the backend stays up. AI generation returns a clear configuration error instead of crashing the app.

Do not run real generation unless you intend to call OpenRouter.

## Master Prompt

The default GlobalMarketSuite prompt is in `backend/src/data/masterPrompt.ts`.

At runtime, settings are read from PostgreSQL table `admin_settings`. The admin panel has a master prompt textarea. OpenRouter generation uses `settings.masterPrompt` from the database, not a hardcoded prompt.

To change it:

1. Open `/admin`.
2. Sign in as superadmin.
3. Edit the AI generation master prompt.
4. Click `Save settings`.

## Admin Features

- Login/logout superadmin.
- List articles.
- Create/edit/delete articles.
- Draft/published status.
- Local cover image path saved with each article.
- AI generation settings.
- Save master prompt.
- Auto-generation toggle.
- Daily/weekly frequency.
- Generation count.
- Generation time list.
- Weekday selection.
- `Generate now` button.

Generated articles receive a local cover path stored in `generated_posts.cover_image`. Existing articles keep their saved cover image.

## Auth And Security

- Access token: short-lived JWT returned to the frontend.
- Refresh token: random token stored as an HTTP-only cookie and hashed in PostgreSQL.
- CSRF token: generated with refresh token and required for refresh, logout, admin mutations, and generation.
- Logout deletes the refresh token from PostgreSQL and clears the cookie.
- Production cookies use `secure: true`; cookies are `httpOnly` and `sameSite: strict`.
- Admin routes require bearer access token.
- CORS is controlled by `CORS_ORIGIN`.
- Article HTML is sanitized before storage.
- Audit events are written for admin actions.
- Secrets are not logged or committed.

## Production Setup

Create production env files:

```bash
npm run setup:prod-env
```

Review and edit:

- `.env.production`
- `backend/.env.production`

Important production values:

- `POSTGRES_PASSWORD`
- `VITE_API_URL`
- `CORS_ORIGIN`
- `SITE_URL`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `OPENROUTER_API_KEY`

Run production compose:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

## Docker Rebuild

Dev rebuild:

```bash
npm run docker:rebuild
```

Plain compose rebuild:

```bash
docker compose up --build -d
```

Check services:

```bash
docker compose ps
docker compose logs backend
docker compose logs admin-seed
```

## Useful Checks

```bash
docker compose config --quiet
curl http://localhost:4000/api/health
curl http://localhost:3000
```

## Troubleshooting

If port `3000` or `4000` is busy, stop the process using it or change the compose port mapping and matching env URLs.

If login fails, check:

```bash
docker compose logs admin-seed
docker compose exec postgres psql -U globalmarketsuite -d globalmarketsuite -c "select email, role from users;"
```

If AI generation fails with `OPENROUTER_API_KEY is not configured`, add the key to root `.env`, run `npm run setup:dev-env`, and restart backend.

If Docker volumes contain old data, remove the project volume only when you are comfortable deleting local database data:

```bash
docker compose down
docker volume rm globalmarketsuite_globalmarketsuite_postgres_data
```

## Backups

```bash
docker compose exec postgres pg_dump -U globalmarketsuite -d globalmarketsuite > globalmarketsuite-backup.sql
```

Restore:

```bash
docker compose exec -T postgres psql -U globalmarketsuite -d globalmarketsuite < globalmarketsuite-backup.sql
```
