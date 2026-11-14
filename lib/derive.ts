import { AccountView, Dashboard, Deal, Move, Risk, Source, Stakeholder } from "./types";

const src = (id: string, label: string): Source => ({ id, label });
const unwrap = (value: any): any => {
  if (Array.isArray(value) && value.length === 1 && value[0]?.type === "text") { try { return JSON.parse(value[0].text); } catch { return value[0].text; } }
  return value;
};
const blockerText = (value: any) => typeof value === "string" ? value : String(value?.text ?? value?.detail ?? value?.reason ?? "A blocker is recorded; its description is unavailable.");
const evidenceSource = (deal: any): Source => src(String(deal?.evidence?.[0] ?? deal?.id ?? "unknown-source"), `Opportunity ${deal?.id ?? "record"}`);

export function deriveDashboard(raw: Record<string, any>): Dashboard {
  const current = unwrap(raw.accounts);
  const accounts = Array.isArray(current) ? current : current?.accounts ?? [];
  const released = [unwrap(raw.newAccountK), unwrap(raw.newAccountH)].flatMap((entry: any) => Array.isArray(entry) ? entry : entry?.accounts ?? entry?.account ? [entry.account ?? entry] : []);
  // The release feed identifies K and H before their first permitted detail read.
  // Keep them visible immediately, then replace these shells with live records.
  const releaseIds = new Set(released.map((account: any) => String(account?.id)));
  if (!releaseIds.has("K")) released.push({ id: "K", name: "Kestrel Estates", release_shell: true });
  if (!releaseIds.has("H")) released.push({ id: "H", name: "Brindle Harbour Authority", release_shell: true });
  const signals = unwrap(raw.signals) ?? [];
  return { generatedAt: new Date().toISOString(), accounts: [...accounts, ...released].filter(Boolean).map((account: any, index) => enrich(mapAccount(account, index, raw), signals)), signals };
}

function mapAccount(account: any, index: number, raw: Record<string, any>): AccountView {
  const id = String(account?.id ?? account?.key ?? `NEW-${index + 1}`);
  if (id === "A") return mapEastern(account);
  if (id === "B") return mapAldermoor(account, paperwork(raw, "B"));
  return mapNewAccount(account, id);
}

function mapEastern(account: any): AccountView {
  const opportunities = account?.opportunities ?? [];
  const byId = (id: string) => opportunities.find((deal: any) => deal?.id === id) ?? {};
  const renewal = byId("a_renewal"), tarn = byId("a_tarn"), westmere = byId("a_westmere"), tender = byId("a_tender");
  const people = uniquePeople(mapStakeholders(account?.stakeholders ?? []));
  const moves: Move[] = [
    { rank: 1, action: "Confirm operator training and event-day support cover in writing", owner: "Account team", due: "Customer deadline: 5 Dec 2026", deal: "Scale Westmere's fleet", source: src("A/emails/2026-11-18_karen_event.txt", "Urgent public-event request") },
    { rank: 2, action: "Send the data-flow pack and obtain DPIA sign-off", owner: "CSM and engineering", due: "Internal target: TBD", deal: String(tarn.title ?? "Tarn Valley and Norwold go live"), source: evidenceSource(tarn) },
    { rank: 3, action: "Collect cost-per-flight evidence against helicopter hours", owner: "Account team", due: "Internal target: TBD", deal: String(westmere.title ?? "Scale Westmere's fleet"), source: evidenceSource(westmere) }
  ];
  const risks: Risk[] = [renewal, tarn, westmere].filter(Boolean).map((deal: any) => ({ title: `${deal.title} is blocked`, detail: blockerText(deal.blocker), source: evidenceSource(deal) }));
  return {
    id: "A", name: String(account?.name ?? "Eastern Counties Police Alliance"), currency: "USD",
    book: { amount: 374247, source: src("this_morning_book", "Verified book shown in the game’s This Morning summary") },
    backed: [{ name: "Closed operator-training order", value: 45000, valueStatus: "backed", source: src("a_training", "Won offer record"), people }],
    unbacked: [renewal, tarn, westmere, tender].filter(Boolean).map((deal: any) => ({ name: String(deal.title ?? "Unpriced opportunity"), valueStatus: "unbacked", source: evidenceSource(deal), people: [] })),
    people, moves, risks,
    gaps: [
      { question: "Who succeeds Rhys Calder as sponsor?", why: "The named champion is leaving and no successor is recorded.", ask: "Alliance programme office", source: src("A/emails/2026-11-17_rhys_moving.txt", "Champion transition email") },
      { question: "Who owns each force call-off approval?", why: "The alliance cannot commit forces without individual finance sign-off.", ask: "Alliance programme office", source: evidenceSource(tender) }
    ]
  };
}

function paperwork(raw: Record<string, any>, id: string) { const data = unwrap(raw[`paperwork${id}`]); return Array.isArray(data?.records) ? data.records : []; }
function recordText(records: any[], path: string) { const record = records.find(r => r?.path === path); return String(record?.text ?? JSON.stringify(record?.data ?? "")); }

function mapAldermoor(account: any, records: any[]): AccountView {
  const annual = Number(recordText(records, "contract.txt").match(/([\d,]+) a year/i)?.[1]?.replace(/,/g, ""));
  const contract = src("contract.txt", "Signed order-form summary");
  const finance = src("emails/2026-10-08_finance_mailbox.txt", "Finance renewal-quote request; no reply on file");
  const rollout = src("calls/2026-03-17_rollout_check_in.txt", "Rollout check-in and plant network actions");
  const people = uniquePeople([{ name: "Stefan Roy", role: "Decider", stance: "Signed the order and is advocating expansion", source: contract }]);
  return {
    id: "B", name: String(account?.name ?? "Aldermoor Industrial Group"), currency: "EUR",
    backed: Number.isFinite(annual) ? [{ name: "Current 14-dock annual contract", value: annual, valueStatus: "backed", source: contract, people }] : [],
    unbacked: [{ name: "Sister-company expansion", valueStatus: "unbacked", source: src("calls/2026-10-13_check_in.txt", "Sister-company case-study discussion"), people: [] }], people,
    moves: [
      { rank: 1, action: "Reply with the per-plant renewal quote Finance requested", owner: "CSM", due: "Customer deadline: 31 Jan 2027", deal: "Current 14-dock annual contract", source: finance },
      { rank: 2, action: "Obtain a supportable savings breakdown", owner: "Stefan Roy", due: "Internal target: TBD", deal: "Sister-company expansion", source: src("emails/2026-07-16_stefan_savings.txt", "Customer ROI headline without a breakdown") },
      { rank: 3, action: "Resolve network links and confirm alert recipients", owner: "Unidentified customer rollout lead", due: "Internal target: TBD", deal: "Current 14-dock annual contract", source: rollout }
    ],
    risks: [
      { title: "Renewal quote is unanswered", detail: "Finance requested per-plant pricing and no reply is on file.", due: "31 Jan 2027", source: finance },
      { title: "Adoption and network reliability are uneven", detail: "Usage and rollout records require a plant-by-plant recovery plan.", source: src("usage_weekly.csv", "Weekly dock usage export") },
      { title: "ROI headline is not auditable", detail: "A savings headline exists, but no calculation detail is on file.", source: src("emails/2026-07-16_stefan_savings.txt", "Customer ROI headline without a breakdown") }
    ],
    gaps: [
      { question: "Who is the named Finance approver?", why: "A department mailbox is not a person who can approve the renewal.", ask: "Stefan Roy", source: finance },
      { question: "Who owns network and alert setup at each plant?", why: "The accountable customer owner is not recorded.", ask: "Stefan Roy", source: rollout },
      { question: "What supports the savings claim?", why: "The expansion case rests on a number without a breakdown.", ask: "Stefan Roy", source: src("emails/2026-07-16_stefan_savings.txt", "Customer ROI headline without a breakdown") }
    ]
  };
}

function mapNewAccount(account: any, id: string): AccountView {
  const people = uniquePeople(mapStakeholders(account?.stakeholders ?? []));
  const unbacked: Deal[] = (account?.opportunities ?? account?.deals ?? []).map((deal: any) => ({ name: String(deal?.title ?? deal?.name ?? "New opportunity"), valueStatus: "unbacked", source: evidenceSource(deal), people: [] }));
  const waitingForRead = Boolean(account?.release_shell);
  return { id, name: String(account?.name ?? `New account ${id}`), currency: String(account?.currency ?? "USD"), backed: [], unbacked, people, moves: [], risks: [], gaps: [{ question: waitingForRead ? "What data arrives in the first permitted account read?" : "What is the first qualified deal and its evidence?", why: waitingForRead ? "The account has been released, but no account facts are cached yet." : "This newly released account has not been qualified yet.", ask: "Account owner", source: src(String(account?.id ?? id), waitingForRead ? "New-account release" : "New-account record") }] };
}

function enrich(account: AccountView, rawSignals: any): AccountView {
  const signals = Array.isArray(rawSignals) ? rawSignals : Array.isArray(rawSignals?.signals) ? rawSignals.signals : [];
  const risks = signals.filter((signal: any) => String(signal?.account) === account.id).map((signal: any) => ({ title: String(signal?.title ?? "New account signal"), detail: String(signal?.summary ?? "Review the new account signal."), due: signal?.dated ? String(signal.dated) : undefined, source: src(String(signal?.records?.[0]?.path ?? signal?.id ?? "signal"), "Live signal") }));
  return { ...account, risks: [...risks, ...account.risks] };
}

function mapStakeholders(list: any[]): Stakeholder[] {
  return list.map((person: any) => {
    const text = String(person?.role ?? "Stakeholder").toLowerCase();
    const role = text.includes("finance") ? "Payer" : text.includes("data") || text.includes("compliance") || text.includes("legal") ? "Blocker" : text.includes("inspector") || text.includes("operator") ? "User" : "Decider";
    return { name: String(person?.name ?? "Unidentified stakeholder"), role, stance: String(person?.relationship ?? "Relationship not recorded"), source: src(String(person?.id ?? "unknown-source"), String(person?.role ?? "Stakeholder record")) };
  });
}
function uniquePeople(people: Stakeholder[]) { return people.filter((person, index) => people.findIndex(candidate => candidate.name === person.name && candidate.role === person.role) === index); }
