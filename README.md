# INTEL-X — Event Portal

> 🚧 **Working README.** This is a temporary version for use during development. A polished final README (with screenshots, live links, and credits) will replace this once the portal is complete.

Live event portal for **Taskaree: The Smuggler's Web (Operation Black Route)** — an intelligence-investigation event organized by **LEAD Society**.

The portal is the live game engine for **Round 2 (Field Operations)** — team credit balance, the Airport Marketplace, Special Intelligence Operations, the Blind Auction, and synchronized HQ broadcasts. Round 1 and Round 3 use it only for small supporting tasks (score entry, etc.).

---

## Tech stack

- **Frontend:** React (Vite) + Tailwind CSS v4
- **Backend / DB:** Supabase (Postgres + Auth + Realtime)
- **Deployment:** Vercel (frontend) + Supabase (hosted DB)

---

## Getting started

```bash
git clone <repository-url>
cd intel-x-portal
npm install
```

Create a `.env.local` file in the project root (never commit this file):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Contact the project lead for the Supabase project URL and anon key.

Run the dev server:

```bash
npm run dev
```

---

## Folder structure

- **`public/`** — Static assets served as-is (favicon, etc.)
- **`src/`**
  - **`assets/`** — Images, fonts, icons imported into components
  - **`components/`** — Reusable UI pieces used across multiple pages
  - **`contexts/`** — React Context providers (e.g. AuthContext)
  - **`hooks/`** — Custom hooks, especially Realtime subscriptions
  - **`layouts/`** — Shared page wrappers (e.g. nav bar + credit balance)
  - **`lib/`** — `supabaseClient.js` (the single configured Supabase client)
  - **`pages/`** — One file per full screen/route
  - **`utils/`** — Plain helper functions, no React
  - `App.jsx` — Route definitions
  - `main.jsx` — App entry point
- `.env.local` — Supabase URL/key (gitignored, never commit)
- `package.json` — Project dependencies and scripts
- `vite.config.js` — Vite configuration

---

## Naming conventions

| What | Convention | Example |
|---|---|---|
| Components / pages | PascalCase | `NavBar.jsx`, `TeamDashboard.jsx` |
| Hooks | camelCase, `use` prefix | `useTeamCredits.js` |
| Utils | camelCase | `formatCountdown.js` |
| Folders | plural (except `lib/`) | `components/`, `hooks/`, `lib/` |

---

## Working on this repo

- Placeholder folders contain a `.gitkeep` file — delete it in the same commit as your first real file in that folder.
- Keep `.env.local` out of every commit — it's already in `.gitignore`.
- If you're unsure where a piece of code belongs, raise it with the team before creating a new top-level folder — keeping the structure consistent matters more than getting it perfect on the first try.

---

## Status

Currently in setup/early build. This README will be rewritten with full usage docs, screenshots, and credits once the portal is feature-complete.