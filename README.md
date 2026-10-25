<div align="right">
  <a href="./README.md"><img src="https://img.shields.io/badge/Lang-🇬🇧_English-blue?style=for-the-badge" alt="English"></a>
  <a href="./README.fr.md"><img src="https://img.shields.io/badge/Lang-🇫🇷_Français-lightgrey?style=for-the-badge" alt="Français"></a>
</div>

# Planifive

Full-stack web platform built with Next.js 16, TypeScript, Prisma, and PostgreSQL to automate weekly 5-a-side football scheduling, balanced team generation, player analytics, and Discord notifications.

Live interactive demo: [https://planifive.vercel.app/](https://planifive.vercel.app/)

![Planifive dashboard](docs/screenshots/dashboardpng.png)

## Context & Problem

Organizing weekly 5-a-side games in chat groups breaks down quickly: scattered polls across threads, last-minute dropouts below the 10-player threshold, and unbalanced teams that ruin matches.

Planifive centralizes slot voting (Monday to Sunday, 18:00 to 22:00), highlights slots reaching 10 players automatically, balances two 5-player squads from player skill and stamina metrics, and syncs match calls and MVP votes directly with a private Discord server.

## Technical Architecture

```mermaid
flowchart LR
    U["Browser Client (Next.js 16 / React 19)"] -->|"HTTPS / NextAuth JWT"| MW{"Demo Sandbox Middleware"}
    MW -->|"demo-login session"| MEM["In-Memory Seed Data (12 players, 7 matches)"]
    MW -->|"Authenticated Guild Member"| API["App Router API (/app/api/*)"]
    API -->|"Parallel queries (Promise.all)"| DB[("PostgreSQL via Prisma ORM")]
    API -->|"Webhooks & Interactions"| DISC["Discord API v10 (Bot & Server)"]
    CRON["Scheduled CRON Endpoints (/api/cron)"] -->|"Authorization: CRON_SECRET"| API
```

## Engineering Choices, Security & Performance

- **Zero-DB Sandbox Demo (`demo-login`)**: Recruiters and visitors can test every route without Discord OAuth or modifying production PostgreSQL rows; an application middleware serves deterministic in-memory state across `/api/dashboard`, `/api/matches`, and `/api/availability`.
- **N+1 elimination & query deduplication**: Replaced sequential `await` chains in dashboard aggregation with `Promise.all` and single-pass in-memory metric computation, reducing average API latency from ~2500 ms to under 300 ms.
- **Guild-gated OAuth & Admin RBAC**: NextAuth checks Discord guild membership during OAuth sign-in to block external users from private group data, while admin flags are resolved server-side from `ADMIN_EMAILS` into JWT sessions so no privileged addresses are bundled client-side.
- **Relational schema & team balancer (`prisma/schema.prisma`)**: Models `User`, `Availability`, `Match`, `Call`, `CallResponse`, `FUTCardRating`, and `Notification`. Team generation splits 10 players by weighted overall rating (60% technical skill, 40% cardio/stamina) with manual override support.

## Quick Start

### Prerequisites

- Node.js >= 18.17 and `npm`
- PostgreSQL database (Supabase, Neon, or local instance)

### Setup & Run Locally

```bash
git clone https://github.com/Git-MohamedB/planifive.git
cd planifive

npm install
```

Create a `.env` file at the repository root:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"
ADMIN_EMAILS="admin@example.com"

DISCORD_CLIENT_ID="your_client_id"
DISCORD_CLIENT_SECRET="your_client_secret"
DISCORD_BOT_TOKEN="your_bot_token"
DISCORD_GUILD_ID="your_guild_id"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
DISCORD_SUMMARY_WEBHOOK_URL="https://discord.com/api/webhooks/..."

CRON_SECRET="your_cron_secret"
```

Push the Prisma schema and launch the dev server:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open `http://localhost:3000` (use the demo login button to explore without setting up Discord credentials).

## Future Improvements

- Add automated end-to-end tests (Playwright) and API route unit tests in GitHub Actions to validate team balancing and auth guards on pull requests.
- Enforce strict runtime schema validation on all API payloads with Zod and add rate limiting on public and CRON routes.
- Decouple Discord webhook delivery into an asynchronous retry queue to handle transient API rate limits cleanly.
