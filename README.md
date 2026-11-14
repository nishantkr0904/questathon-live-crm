# Monday Morning CRM

An evidence-led CRM for the Questathon accounts. It presents backed deal values separately from claims, stakeholder power, ranked work, risks, and gaps for both accounts.

## Run locally

```bash
npm install
cp .env.example .env.local
# add AQ_TOKEN to .env.local
npm run dev
```

Open `http://localhost:3000`. The token is read only on server routes and is never sent to the browser.

## Deploy

Deploy this repository to Vercel, then set `AQ_TOKEN` in the project Environment Variables for Production and Preview. Redeploy. Do not commit `.env.local`.

## Architecture and rate limiting

`app/api/dashboard` is the only browser data route. It calls `lib/mcp.ts`, which adds the bearer token on the server. Foundational data is cached in memory after bootstrap; subsequent refreshes poll only `get_signals` after a 60-second guard. `app/api/notes` also observes the same guard before `write_note`.

For production multi-instance deployments, replace the in-memory cache with Redis/Vercel KV to coordinate the one-call-per-minute limit across instances.

## Source integrity

The UI never invents source IDs. It renders IDs returned by the MCP source fields and separates unknown or unbacked values from backed value. The mapper is deliberately defensive: missing data becomes an explicit gap.

## Submission assets

- [Thinking document](THINKING.md)
- [Walkthrough script](WALKTHROUGH.md)
