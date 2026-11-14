# Monday Morning CRM: thinking document

## What it does, and for whom

This is a working account-control view for a sales manager and account team. For Eastern Counties and Aldermoor it answers: backed book value, power map, ranked work, risks, and unknowns. It is designed for Monday-morning decisions, not a generic contact list.

## How it decides

1. A value is counted only when the API record supplies both a numeric value and a source ID. Claims with either missing are held apart.
2. Where an opportunity supplies a power role, the CRM uses it. Otherwise it presents a clearly sourced working role based on the customer's recorded title or contract responsibility; missing deal-specific ownership remains an explicit gap.
3. First moves are ranked from explicit blockers, deadlines, requests, and live signals. Each shows an accountable owner, a recorded deadline or working due point, the affected deal, and its evidence.
4. Risks are source blockers, deadlines, and incoming MCP signals. Missing risk data is displayed as a monitoring gap, not as green.
5. Unknowns combine explicit API gaps with missing evidence that would materially change a renewal, expansion, or forecast decision.

## What it does not do yet

It does not predict close probability, silently infer stakeholder sentiment, or fabricate a forecast. It uses a process-local cache; a multi-instance deployment should use shared Redis/KV to enforce rate limits globally.

## How AI was used

AI accelerated component scaffolding, defensive data-mapping design, source-integrity checks, and this documentation. The app's facts, values, stakeholder roles, and sources come from the MCP data only. AI is not treated as a source of account facts.
