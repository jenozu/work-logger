# Work Logger

A tiny private daily work log built for fast text entry from a phone or desktop.

## MVP
- PIN-protected access
- Submit a text entry
- Automatic timestamp
- Today's entries
- Edit/delete entries
- History grouped by day
- Neon Postgres storage
- Vercel-ready

## Environment variables
Create these in Vercel:

```text
DATABASE_URL=your Neon pooled connection string
WORK_LOGGER_PIN=your private PIN
SESSION_SECRET=a long random secret
SHORTCUT_API_KEY=a separate long random secret for iPhone Shortcuts
```

The app creates the work_logs table automatically on first database access.

## Deploy
1. Import this repository into Vercel.
2. Add the three environment variables above.
3. Deploy.
4. Open the production URL and sign in with your PIN.

## iPhone Shortcut

The shortcut endpoint is:

```text
POST /api/shortcut/log
```

Send JSON:

```json
{
  "entry": "Finished receiving the Deutz shipment"
}
```

with this header:

```text
Authorization: Bearer YOUR_SHORTCUT_API_KEY
```

Keep `SHORTCUT_API_KEY` in Vercel only; do not commit the real value to GitHub.

## Intentionally excluded from V1
- iPhone voice/Siri Shortcut submission
- AI summaries
- tags/categories
- reminders
- weekly/monthly reporting
- CSV/Markdown export
