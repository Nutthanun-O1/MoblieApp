# Expo + Supabase Starter

## Setup
1) Create `.env` in project root:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

2) Install deps (Node 20 recommended):
```
npm install
```

3) Run on device (Expo Go):
```
npx expo start -c
```

## Routes
- `/login` — Login page with buttons:
  - **Ping DB**: checks connectivity to Supabase (`users` table)
  - **เข้าสู่ระบบ**: calls `app_login` RPC and redirects to `/home`

## Files
- `app/_layout.tsx` — Expo Router layout
- `app/index.tsx` — Redirect to `/login`
- `app/login.tsx` — Login & Ping DB
- `app/home.tsx` — Simple home screen
- `lib/supabaseClient.ts` — Supabase client
- `.env` — Supabase URL & anon key (prefix: EXPO_PUBLIC_)
