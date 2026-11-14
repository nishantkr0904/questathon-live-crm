import "server-only";

const MCP = "https://questathon.aihackerscollective.com/api/public/mcp";
const MINUTE = 60_000;
type Cache = { lastCall: number; values: Record<string, unknown>; updatedAt: string; bootstrapStep: number };
const globalCache = globalThis as unknown as { crmCache?: Cache; crmPending?: Promise<Record<string, unknown>> };
const cache = () => (globalCache.crmCache ??= { lastCall: 0, values: {}, updatedAt: "", bootstrapStep: 0 });

async function rpc(name: string, args: Record<string, unknown> = {}) {
  const token = process.env.AQ_TOKEN;
  if (!token) throw new Error("AQ_TOKEN is missing. Add it to .env.local on the server.");
  const response = await fetch(MCP, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method: "tools/call", params: { name, arguments: args } }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`MCP ${name} failed (${response.status})`);
  const json = await response.json();
  if (json.error) throw new Error(json.error.message ?? "MCP returned an error");
  return json.result?.content ?? json.result;
}

/** One upstream call per 60 seconds across all requests in this server process. */
export async function getMcpData(forceSignals = false): Promise<Record<string, unknown>> {
  const state = cache();
  const age = Date.now() - state.lastCall;
  if (age < MINUTE) return state.values;
  if (globalCache.crmPending) return globalCache.crmPending;
  globalCache.crmPending = (async () => {
    // Bootstrap is intentionally spread over permitted windows. This is more
    // conservative than the API's stated limit and prevents concurrent page loads
    // from burning the player's token allowance.
    if (state.bootstrapStep === 0) {
      state.values.accounts = await rpc("get_my_accounts");
      state.bootstrapStep = 1;
    } else if (state.bootstrapStep === 1) {
      state.values.paperworkA = await rpc("get_all_paperwork", { account: "A" });
      state.bootstrapStep = 2;
    } else if (state.bootstrapStep === 2) {
      state.values.paperworkB = await rpc("get_all_paperwork", { account: "B" });
      state.bootstrapStep = 3;
    } else if (state.bootstrapStep === 3) {
      state.values.newAccountK = await rpc("get_new_account", { account: "K" });
      state.bootstrapStep = 4;
    } else if (state.bootstrapStep === 4) {
      state.values.newAccountH = await rpc("get_new_account", { account: "H" });
      state.bootstrapStep = 5;
    } else if (age >= MINUTE) {
      state.values.signals = await rpc("get_signals");
    }
    state.lastCall = Date.now();
    state.updatedAt = new Date().toISOString();
    return state.values;
  })();
  try { return await globalCache.crmPending; } finally { globalCache.crmPending = undefined; }
}

export async function writeCrmNote(text: string, account?: string, kind = "next_step", title?: string) {
  const state = cache();
  if (Date.now() - state.lastCall < MINUTE) throw new Error("Rate limit guard: wait until 60 seconds since the last MCP call.");
  const result = await rpc("write_note", { text, account, kind, title });
  state.lastCall = Date.now();
  return result;
}
