# auth-investigation

We are investigating an AUTH-related issue in CodeAnalyst.

Important:
- Auth logic lives in backend/src/middleware/auth.js and backend/src/routes/auth.js.
- These files are fragile and should NOT be modified unless I explicitly confirm.

Your job:
1. Read the relevant auth files and any immediate callers to understand the flow.
2. Explain to me how the current auth flow works (GitHub OAuth + Supabase).
3. Suggest potential fixes or improvements in SAFER places first:
   - Frontend flows (login, callbacks, token handling).
   - Non-auth routes/services.
   - Logging, using the existing logger.
4. If you believe modifying auth.js or auth routes is necessary, clearly:
   - Explain why.
   - Show the smallest possible diff.
   - Wait for my explicit confirmation before applying it.
5. Follow Windows + PowerShell rules for any suggested commands.
