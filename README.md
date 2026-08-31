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

```
intel-x-portal/
├── database/                     # Supabase SQL scripts (run in order)
│   ├── schema.sql                #   Table definitions, enums, RLS policies
│   ├── seed.sql                  #   Airport dossiers, auction items, test teams
│   └── rpc.sql                   #   SECURITY DEFINER RPCs (game logic)
├── public/                       # Static assets served as-is
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                   # Images imported into components
│   ├── components/               # Reusable UI pieces
│   │   ├── admin/                #   Admin-only components
│   │   │   ├── AuctionResolver.jsx
│   │   │   ├── PhaseAdvancer.jsx
│   │   │   ├── Round1ScoreEntry.jsx
│   │   │   ├── SpecialOpsQueue.jsx
│   │   │   └── TeamOverview.jsx
│   │   ├── AirportCard.jsx
│   │   ├── AuctionCard.jsx
│   │   ├── InformerStall.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── SpecialOpsCard.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx       # Dual auth (team session + admin Supabase Auth)
│   ├── hooks/
│   │   ├── useGameState.js       # Realtime subscription to game_state
│   │   └── useTeamData.js        # Realtime subscription to team row + relations
│   ├── layouts/
│   │   ├── AdminLayout.jsx       # Sidebar nav for Game Master console
│   │   └── TeamLayout.jsx        # Top bar with credits & phase indicator
│   ├── lib/
│   │   └── supabaseClient.js     # Singleton Supabase client
│   ├── pages/
│   │   ├── AdminAuction.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── AdminOps.jsx
│   │   ├── AdminRound3.jsx
│   │   ├── AdminScores.jsx
│   │   ├── AdminTeams.jsx
│   │   ├── Auction.jsx
│   │   ├── Broadcast.jsx         # Full-screen projector display
│   │   ├── DossierViewer.jsx
│   │   ├── TeamDashboard.jsx
│   │   └── TeamLogin.jsx
│   ├── utils/                    # Plain helper functions (no React)
│   ├── App.jsx                   # Route definitions
│   ├── index.css                 # Tailwind v4 theme & global styles
│   └── main.jsx                  # App entry point
├── .env.example                  # Template for required env vars
├── .gitignore
├── index.html                    # HTML shell with fonts & meta
├── package.json
├── vercel.json                   # SPA rewrites for Vercel deployment
└── vite.config.js
```

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