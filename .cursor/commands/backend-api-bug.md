# backend-api-bug

You are working on the CodeAnalyst backend (Node 22 + Express, ES modules) in /backend.

I want to debug or fix a BACKEND API issue.

Rules:
1. Start with the route file in backend/src/routes/** that handles the endpoint I specify.
2. Then inspect backend/src/services/** used by that route.
3. Only open middleware, database, or workers if clearly related.
4. Do NOT modify backend/src/middleware/auth.js or backend/src/routes/auth.js unless I explicitly say you may; you can read them but treat them as fragile.
5. Keep changes minimal and focused.
6. Summarize all changes and files touched at the end.
7. Any shell commands must be PowerShell-compatible.

Now ask me for:
- HTTP method + path (e.g. POST /api/analyzeWebsite)
- Observed problem (e.g. 502, timeout, wrong data)
- Any known related files.
