# Dòng Tiền

Ứng dụng Android theo dõi thu chi, tài sản và khoản nợ cá nhân; dữ liệu mặc định được lưu cục bộ trên thiết bị.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- Finance records remain local by default. Keep the existing AsyncStorage key stable; version the schema and migrate rather than clearing user data.
- Before each local-data write, retain a last-known-good snapshot. If data is unreadable or from a newer schema, do not overwrite it automatically.
- Keep `android.package` stable, increment `android.versionCode` for each Android release, and sign updates with the same key. Users must install updates over the existing app rather than uninstall it.
- Gemini is opt-in and receives only monthly totals/category aggregates after confirmation; keep `GEMINI_API_KEY` on the API server, never in the mobile bundle.
- Google Calendar, Drive, and OneDrive must use each app user's own OAuth account, not a shared workspace integration token.

## Product

- Tracks income, expenses, assets, debts, net worth, and monthly spending categories on device.
- Supports JSON backup/restore and optional on-device due-date notifications.
- Offers optional Gemini analysis; it requires a server-side API key. Google Calendar/cloud sync and AdMob still require their own provider setup.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do not increment or change the finance storage key when evolving local records; add a migration and bump `FINANCE_SCHEMA_VERSION`.
- Replit Expo publishing currently targets iOS; this workspace has no Android SDK or Gradle, so an APK cannot be produced here.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
