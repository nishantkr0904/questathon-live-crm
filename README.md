# Monday Morning CRM

Monday Morning CRM is an evidence-led operating view for the Questathon accounts. It separates verified book value from unbacked upside, maps decision power, ranks next actions, surfaces risk, and makes decision-critical gaps explicit.

## Run locally

### Prerequisites

- Node.js 20 or later
- An `AQ_TOKEN` issued by Questathon

### Setup

```bash
npm install
cp .env.example .env.local
```

Added the token to the newly created `.env.local` file:

```bash
AQ_TOKEN=questathon_token
```

Then started the app:

```bash
npm run dev
```

Opened [http://localhost:3000](http://localhost:3000).

## Token security

`AQ_TOKEN` is strictly server-side.

- Stored it only in `.env.local` for local development, or in Vercel Environment Variables for deployed environments.
- `.env.local` is excluded from Git and must never be committed.
- The browser calls local application routes only. The bearer token is injected by server-side code in `lib/mcp.ts` and is never sent to client-side JavaScript or exposed in the public repository.

## Deployment to Vercel

1. Imported the repository into Vercel.
2. In **Project Settings → Environment Variables**, added `AQ_TOKEN` for the Production and Preview environments.
3. Deployed the project.

## Architecture

The browser reads the dashboard through `app/api/dashboard`. That server route uses `lib/mcp.ts` to call the Questathon MCP API with the server-only bearer token.

The data mapper in `lib/derive.ts` is deliberately evidence-led:

- Values are shown only with an explicit source ID.
- Verified book value is kept separate from qualified or unbacked upside.
- Missing owners, evidence, and approvals are rendered as gaps instead of being inferred.
- Source badges remain visible beside values, risks, actions, and claims.

## Rate limiting and live updates

Questathon permits one MCP call per minute, including writes. The server-side cache coordinates bootstrap reads and protects subsequent refreshes with a 60-second guard. Once foundational account data is cached, refreshes poll live signals without requiring a code change. The note endpoint observes the same guard before calling `write_note`.

The included cache is process-local for a simple deployment. For a horizontally scaled production system, replace it with a shared store such as Vercel KV or Redis so the one-call-per-minute limit is coordinated across instances.
