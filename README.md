<div align="center">

<img src="public/android-chrome-192x192.png" alt="Syncbase Logo" width="80" height="80" />

# Syncbase

**The collaborative workspace where your team posts, ships, and stays in sync, all in one place.**

[![GitHub Stars](https://img.shields.io/github/stars/spacesdrive/syncbase?style=flat-square&color=FFD700&label=Stars)](https://github.com/spacesdrive/syncbase/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/spacesdrive/syncbase?style=flat-square&color=818cf8)](https://github.com/spacesdrive/syncbase/commits/main)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)

<br />

[Live Demo](#) · [Report a Bug](https://github.com/spacesdrive/syncbase/issues/new?template=bug_report.md) · [Request a Feature](https://github.com/spacesdrive/syncbase/issues/new?template=feature_request.md) · [Contribute](#contributing)

</div>

---

## What is Syncbase?

Modern teams run across too many disconnected tools. Content gets drafted in Notion, tasks live in Jira, social posts go through Buffer, chats happen in Slack, and nobody agrees on where the API keys are stored. Context is constantly lost in the gaps.

**Syncbase collapses all of that into a single, real-time workspace.** Your team manages social content, ships tasks, tracks projects, chats, and builds a shared knowledge base without switching apps.

It is a fully open-source, self-hostable SPA built on React 19, TypeScript, Vite, Tailwind CSS v4, and Supabase. Installable as a PWA. Ships with dark mode, drag-and-drop task boards, role-based permissions, and live presence out of the box.

---

## Features

| Module | What it does |
|---|---|
| **Posts** | Draft, schedule, and track social content across LinkedIn, Instagram, X/Twitter, Facebook, Reddit, YouTube, and Threads. Attach images via Cloudinary, collect emoji reactions, and run a review workflow from draft → approved → posted. |
| **Work** | Full task management with four views: Kanban, Table, Calendar, and Pods (by assignee). Drag-and-drop reordering, multi-assignee support, priority levels, role-based status transitions, comments, and reactions. |
| **Projects** | Group tasks under projects. Track progress with a goal checklist. Link tasks directly to project goals. |
| **Chat** | Real-time team channel and one-to-one direct messages. Edit and delete messages, react with emoji, attach files, and see unread DM counts per member. |
| **Info Board** | Structured team knowledge store. Eight item types: text notes, API keys, numbers, AI prompts, Claude skills, photos, videos, and documents. Pin, react, reorder, and search. |
| **Wiki** | Free-form team wiki for documentation, SOPs, and institutional knowledge. |
| **Settings** | Profile management with Cloudinary avatar upload, team rename, invite code sharing, member role management, and theme toggle. |
| **Auth** | Email/password and Google OAuth sign-in. Auto-provisioned profiles. Invite-code based team joining. |

### Platform support

| LinkedIn | Instagram | X / Twitter | Facebook | Reddit | YouTube | Threads |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 8 + Tailwind CSS v4 |
| Backend / Auth | Supabase (PostgreSQL + Realtime + Storage) |
| UI Primitives | Radix UI (shadcn pattern) |
| Animation | Framer Motion + Aceternity UI |
| Drag & Drop | dnd-kit |
| Forms | react-hook-form + Zod |
| File Uploads | Cloudinary |
| Routing | React Router v7 |
| Notifications | react-hot-toast + Sonner |
| PWA | Web App Manifest + Service Worker |

</div>

---

## Quick Start

Get Syncbase running locally in under two minutes.

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Cloudinary](https://cloudinary.com) account (free tier works)
- A Google OAuth client ID (optional, only needed for Google sign-in)

### 1. Clone and install

```bash
git clone https://github.com/spacesdrive/syncbase.git
cd syncbase
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

VITE_GOOGLE_CLIENT_ID=your_google_client_id   # optional
```

> **Where to find these:** Supabase → Project Settings → API. Cloudinary → Dashboard → Account Details. Google Client ID → [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.

### 3. Set up the Supabase database

Run the SQL migrations in your Supabase SQL editor. The schema creates the following tables:

`profiles` · `teams` · `team_members` · `posts` · `post_images` · `post_reactions` · `comments` · `tasks` · `task_assignees` · `task_comments` · `task_reactions` · `projects` · `project_goals` · `info_items` · `info_reactions` · `team_messages` · `direct_messages` · `message_reactions` · `notifications` · `activity_events`

The following stored procedures are required:

`create_post` · `create_task` · `create_project` · `update_project` · `set_task_assignees` · `update_task_assignee_status` · `reorder_tasks` · `create_task_comment`

Enable **Row Level Security** on all tables and **Realtime** on `posts`, `tasks`, `team_messages`, `direct_messages`, `notifications`, and `task_comments`.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5174](http://localhost:5174). Sign up, create a team, and you are in.

---

## Project Structure

```
syncbase/
├── public/                     # PWA manifest, favicon set, app icons
│   └── manifest.json
├── src/
│   ├── App.tsx                 # Router, route guards, error boundary
│   ├── main.tsx                # React root, service worker registration
│   ├── index.css               # Global styles, component utility classes
│   ├── styles/
│   │   └── theme.css           # CSS custom properties, dark/light tokens
│   ├── lib/
│   │   ├── api.ts              # All Supabase API calls (teams, posts, tasks, chat...)
│   │   ├── supabase.ts         # Supabase client initialisation
│   │   ├── cloudinary.ts       # Image/file upload helpers
│   │   ├── constants.ts        # Platforms, statuses, priorities, info types
│   │   ├── taskStatusRules.ts  # Role-based task status transition logic
│   │   └── utils.ts            # cn() and shared utilities
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Auth state, session, profile management
│   │   └── TeamContext.tsx     # Active team, members, presence, switching
│   ├── hooks/
│   │   ├── useRealtime.ts      # Supabase Realtime subscription wrapper
│   │   ├── useTheme.ts         # Dark/light mode with localStorage persistence
│   │   └── useIsMobile.ts      # Responsive breakpoint hook
│   ├── components/
│   │   ├── ui/                 # shadcn/Radix UI primitives + custom app components
│   │   ├── layout/             # Layout shell, Sidebar, TopBar
│   │   ├── aceternity/         # Framer Motion animation components
│   │   └── icons/              # Platform SVG icons
│   └── pages/
│       ├── auth/               # Login, Signup
│       ├── team/               # TeamSetup (create/join)
│       ├── posts/              # Posts list, PostCard, NewPostModal
│       ├── work/               # Work hub, Kanban, Table, Calendar, Pods, TaskCard
│       ├── projects/           # Project list, detail, goals
│       ├── chat/               # Team chat + direct messages
│       ├── info/               # Team info board
│       ├── wiki/               # Team wiki
│       └── settings/           # Profile, team, members, appearance
├── .env.example
├── vite.config.ts
├── tsconfig.app.json
└── package.json
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         React SPA (Vite)                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ AuthContext  │  │ TeamContext  │  │    React Router v7    │  │
│  │  (session,  │  │  (team,     │  │  (lazy-loaded pages,  │  │
│  │   profile)  │  │  members,   │  │   route guards)       │  │
│  └──────────────┘  │  presence)  │  └───────────────────────┘  │
│                     └──────────────┘                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                        lib/api.ts                          │  │
│  │   Teams · Posts · Tasks · Projects · Chat · Info · Goals   │  │
│  └───────────────────────────┬────────────────────────────────┘  │
└──────────────────────────────│──────────────────────────────────┘
                               │
              ┌────────────────▼──────────────────┐
              │              Supabase              │
              │                                   │
              │  PostgreSQL   Realtime   Auth      │
              │  (RLS + RPC)  (channels) (OAuth)   │
              └───────────────────────────────────┘
                               │
              ┌────────────────▼──────────────────┐
              │            Cloudinary              │
              │   Image uploads · File storage     │
              └───────────────────────────────────┘
```

**Data flow:**
1. `AuthContext` resolves the Supabase session on mount and auto-provisions a profile row for new users.
2. `TeamContext` reads the active team from `localStorage`, loads members, and opens a Supabase Realtime presence channel to track online status.
3. All data operations go through `lib/api.ts`, which wraps Supabase queries and RPCs with typed helpers.
4. Pages subscribe to live updates using the `useRealtime` hook, which channels `postgres_changes` events back through the same data helpers.

---

## Available Scripts

```bash
npm run dev       # Start development server at http://localhost:5174
npm run build     # Production build to dist/
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

---

## Deployment

Syncbase is a static SPA. Deploy the `dist/` folder anywhere that can serve static files.

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Set your five environment variables in the Vercel dashboard under Project → Settings → Environment Variables.

### Netlify

```bash
npm run build
# Drag and drop the dist/ folder at app.netlify.com/drop
# Or connect the GitHub repo and set build command: npm run build, publish dir: dist
```

### Self-hosted (Nginx)

```nginx
server {
    listen 80;
    root /var/www/syncbase/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> **Important:** Because Syncbase is a client-side SPA, your server must redirect all routes to `index.html`. The `try_files` directive above handles this for Nginx.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key |
| `VITE_CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name for uploads |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Yes | Unsigned upload preset name |
| `VITE_GOOGLE_CLIENT_ID` | No | Enables Google OAuth sign-in |

---

## Troubleshooting

<details>
<summary><strong>Blank page after login - "Missing Supabase env vars" in console</strong></summary>

Your `.env` file is either missing or the variable names are wrong. Double-check that the file is at the project root (same level as `package.json`) and that you restarted the dev server after editing it. Variable names must match exactly. Vite only exposes variables prefixed with `VITE_`.

</details>

<details>
<summary><strong>Stuck on the TeamSetup screen after logging in</strong></summary>

This means the user has no team membership. Either create a new team or join one with an invite code. If you're testing with the same account repeatedly, check that the `team_members` row was not accidentally deleted in Supabase.

</details>

<details>
<summary><strong>Image uploads fail silently</strong></summary>

Check that `VITE_CLOUDINARY_UPLOAD_PRESET` is an **unsigned** preset (not signed). In your Cloudinary dashboard: Settings → Upload → Upload presets → ensure the preset mode is set to "Unsigned".

</details>

<details>
<summary><strong>Real-time updates not working</strong></summary>

Supabase Realtime must be enabled per-table. Go to Supabase → Database → Replication and enable the tables: `posts`, `tasks`, `team_messages`, `direct_messages`, `notifications`, `task_comments`.

</details>

<details>
<summary><strong>Google OAuth redirects to wrong URL</strong></summary>

In your Google Cloud Console → OAuth 2.0 Client, add your full origin (e.g. `http://localhost:5174` for local, `https://your-domain.com` for production) to **Authorised JavaScript origins** and **Authorised redirect URIs**. Also add the same URL in Supabase → Authentication → URL Configuration → Redirect URLs.

</details>

---

## Roadmap

- [ ] Email notifications for task assignments and mentions
- [ ] Calendar sync (Google Calendar export)
- [ ] Post analytics dashboard
- [ ] Notion-style wiki editor (block-based rich text)
- [ ] Mobile app (React Native)
- [ ] Webhooks for external integrations (Zapier, Make)
- [ ] AI writing assistant for post captions
- [ ] Granular notification preferences per channel

Have an idea? [Open a feature request](https://github.com/spacesdrive/syncbase/issues/new?template=feature_request.md)

---

## Contributing

Contributions are genuinely welcome: bug fixes, new features, better docs, design improvements. Here is how to get started:

1. **Fork** the repository and clone your fork
2. **Create a branch**: `git checkout -b feat/your-feature-name`
3. **Make your changes** and commit with a clear message following [Conventional Commits](https://www.conventionalcommits.org)
4. **Push** your branch and open a Pull Request against `main`

For larger changes, open an issue first so we can align on approach before you invest time building it.

Look for issues labelled [`good first issue`](https://github.com/spacesdrive/syncbase/labels/good%20first%20issue) if you are new to the codebase.

```bash
# Fork, clone, and install
git clone https://github.com/YOUR_USERNAME/syncbase.git
cd syncbase && npm install

# Create a feature branch
git checkout -b feat/your-feature

# Run locally
npm run dev

# Lint before committing
npm run lint
```

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for the full text.

You are free to use, modify, and distribute Syncbase, including in commercial products. Attribution is appreciated but not required.

---

## Acknowledgements

Syncbase is built on the shoulders of excellent open-source work:

- [Supabase](https://supabase.com) - backend, auth, and real-time infrastructure
- [Radix UI](https://www.radix-ui.com) - accessible, unstyled UI primitives
- [shadcn/ui](https://ui.shadcn.com) - component patterns and composition model
- [Tailwind CSS](https://tailwindcss.com) - utility-first styling
- [Framer Motion](https://www.framer.com/motion/) - animation primitives
- [Aceternity UI](https://ui.aceternity.com) - visual effect components
- [dnd-kit](https://dndkit.com) - drag-and-drop toolkit
- [Lucide](https://lucide.dev) - icon set
- [Cloudinary](https://cloudinary.com) - media management

---

<div align="center">

**If Syncbase saves your team time, a star helps others find it.**

[![Star on GitHub](https://img.shields.io/github/stars/spacesdrive/syncbase?style=for-the-badge&color=FFD700&label=Star%20on%20GitHub)](https://github.com/spacesdrive/syncbase/stargazers)

<br />

Made with care · [Open an issue](https://github.com/spacesdrive/syncbase/issues) · [Start contributing](https://github.com/spacesdrive/syncbase/blob/main/CONTRIBUTING.md)

</div>
