# MoblieApp

This repository is an Expo mobile app starter (Expo + Supabase). It includes a simple login screen, Supabase client wiring, and an Expo Router layout.

## Setup

1) Create a `.env` file in the project root with your Supabase credentials (these should NOT be committed):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

2) Install dependencies (Node 20 recommended):

```
npm install
```

3) Run the app (Expo Go):

```
npx expo start -c
```

## Routes

- `/login` — Login page with buttons:
  - `Ping DB`: checks connectivity to Supabase (`users` table)
  - `เข้าสู่ระบบ`: calls `app_login` RPC and redirects to `/home`

## Key files

- `app/_layout.tsx` — Expo Router layout
- `app/index.tsx` — Redirect to `/login`
- `app/login.tsx` — Login & Ping DB
- `app/home.tsx` — Simple home screen
- `lib/supabaseClient.ts` — Supabase client

## Notes

- `.env` is ignored in `.gitignore`; keep your keys private.
- `node_modules/` and build artifacts are ignored and will not be pushed.

Enjoy!
