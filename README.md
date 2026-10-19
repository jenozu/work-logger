# Work Logger

A private work logger for quick task capture and manager-ready daily timesheets.

## Features

- PIN-protected access
- Quick text logging with automatic timestamps
- iPhone Shortcut submission endpoint
- Daily log sheet with fixed workday time blocks from 7:00 AM to 4:30 PM
- Retroactive weekday entry by selected date
- Date-range CSV export for management
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

The app creates its database tables automatically on first access.

## Main routes

```text
/          Quick logger
/history   Quick-log history
/daily     Daily manager log sheet
```

## Daily sheet

The daily sheet provides these fixed blocks:

- 7:00 AM - 8:00 AM
- 8:00 AM - 9:00 AM
- 9:00 AM - 10:00 AM
- 10:00 AM - 11:00 AM
- 11:00 AM - 12:00 PM
- 12:00 PM - 1:00 PM
- 1:00 PM - 2:00 PM
- 2:00 PM - 3:00 PM
- 3:00 PM - 4:00 PM
- 4:00 PM - 4:30 PM

Choose any Monday-Friday date to enter or update that day's record.

CSV export is available from the same page using From and To dates. The export includes every weekday and every time block in the range so it can be used as a consistent submission sheet.

## iPhone Shortcut

Endpoint:

```text
POST /api/shortcut/log
```

JSON body:

```json
{
  "entry": "Finished receiving the Deutz shipment"
}
```

Header:

```text
Authorization: Bearer YOUR_SHORTCUT_API_KEY
```

Keep `SHORTCUT_API_KEY` in Vercel only; do not commit the real value to GitHub.
