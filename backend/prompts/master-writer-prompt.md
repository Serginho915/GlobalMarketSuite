# GlobalMarketSuite Master Prompt

The runtime default master prompt lives in `backend/src/data/masterPrompt.ts` and is stored in PostgreSQL under `admin_settings` after the first settings save/read.

Use the admin panel at `/admin` to edit the active prompt. OpenRouter generation always reads `settings.masterPrompt` from PostgreSQL and does not use a hardcoded prompt after settings are stored.
