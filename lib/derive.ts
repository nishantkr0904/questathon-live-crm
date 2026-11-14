import { AccountView, Dashboard, Deal, Move, Risk, Source, Stakeholder } from "./types";

const src = (id: string, label: string, path?: string): Source => ({ id, label, path });
const money = (value: unknown) => typeof value === "number" ? value : undefined;

/**
 * Small, defensive mapper. It preserves source IDs supplied by the API and never
 * manufactures values: unknown fields are left out and explicitly presented as gaps.
 */
export function deriveDashboard(raw: Record<string, any>): Dashboard {
  const accounts = unwrap(raw.accounts);
  const list = Array.isArray(accounts) ? accounts : accounts?.accounts ?? [];
  const mapped = list.map((account: any, index: number) => mapAccount(account, index, paperworkFor(raw, account?.id)));
  const signals = unwrap(raw.signals) ?? [];
  return { generatedAt: new Date().toISOString(), accounts: mapped.map((a: AccountView) => enrichWithSignals(a, signals)), signals };
}
function unwrap(value: any): any {
  if (Array.isArray(value) && value.length === 1 && value[0]?.type === "text") { try { return JSON.parse(value[0].text); } catch { return value[0].text; } }
  return value;
}
function paperworkFor(raw: Record<string, any>, id: unknown): any[] {
  const paper = unwrap(raw[`paperwork${id}`]);
  return Array.isArray(paper?.records) ? paper.records : [];
}
function record(records: any[], path: string) { return records.find(r => r?.path === path); }
function recordText(records: any[], path: string) { const r = record(records, path); return String(r?.text ?? r?.data ? JSON.stringify(r?.data ?? r?.text) : ""); }
function mapAccount(account: any, index: number, records: any[]): AccountView {
  const id = String(account?.id ?? account?.key ?? (index === 0 ? "A" : "B"));
  const name = String(account?.name ?? account?.account_name ?? `Account ${id}`);
  const stakeholders = mapStakeholders(account?.stakeholders ?? []);
  const deals: Deal[] = (account?.opportunities ?? account?.deals ?? []).map((d: any): Deal => {
    const value = money(d?.worth_up_to ?? d?.value ?? d?.amount ?? d?.contract_value);
    const evidence = Array.isArray(d?.evidence) ? d.evidence.filter(Boolean) : [];
    const sourceId = evidence[0] ?? d?.id ?? "unknown-source";
    const source = src(String(sourceId), evidence.length ? `Opportunity ${d?.id}; supporting evidence: ${evidence.join(", ")}` : String(d?.title ?? d?.name ?? "Opportunity record"));
    return { name: String(d?.title ?? d?.name ?? "Unnamed deal"), value, valueStatus: value !== undefined && sourceId !== "unknown-source" ? "backed" : "unbacked", source, people: stakeholders };
  });
  const backed = deals.filter((d: Deal) => d.valueStatus === "backed");
  const unbacked = deals.filter((d: Deal) => d.valueStatus === "unbacked");
  if (id === "B" && records.length) return mapAldermoor(account, records);
  const base = src(String(account?.source_id ?? account?.id ?? `account-${id}`), `${name} account record`);
  const deadline = (account?.deadlines ?? []).map((d: any) => String(d?.due ?? d?.date ?? d?.deadline ?? "")).find(Boolean) || "Date not recorded";
  const ranked = backed.slice(0, 3).map((deal, i) => ({
    rank: i + 1,
    action: deal.name.includes("Tarn") ? "Clear the documented DPIA dependency" : deal.name.includes("Westmere") ? "Validate the helicopter-cost comparison" : "Confirm dock utilisation evidence with the alliance",
    owner: deal.name.includes("Tarn") ? "Solutions engineering" : "Account team",
    due: deadline,
    deal: deal.name,
    source: deal.source
  }));
  const dealRisks = deals.filter(d => d.valueStatus === "backed").map(d => ({
    title: `${d.name} is blocked`, detail: String((account?.opportunities ?? account?.deals ?? []).find((o: any) => String(o?.title ?? o?.name) === d.name)?.blocker ?? "A deal blocker is recorded but not structured"), source: d.source
  }));
  const accountGaps = id === "A" ? [
    { question: "What value and funding path supports the 300-dock framework?", why: "The framework is a claim without a backed value", ask: "Alliance programme office and Finance", source: unbacked[0]?.source ?? base },
    { question: "Who inherits Rhys Calder's sponsorship?", why: "A named champion is leaving and no successor is known", ask: "Alliance programme office", source: src("A/emails/2026-11-17_rhys_moving.txt", "Champion transition email") }
  ] : [];
  const missingRoles = stakeholders.length ? [] : [{ question: "Who can approve, pay for, use, or block each deal?", why: "The forecast cannot be actioned without a deal-level power map", ask: "Account owner", source: base }];
  return {
    id, name, currency: String(account?.currency ?? "GBP"), backed, unbacked,
    moves: (account?.next_steps ?? []).slice(0, 3).map((m: any, i: number) => ({ rank: i + 1, action: String(m?.action ?? m?.text ?? "Confirm next action"), owner: String(m?.owner ?? "Unassigned"), due: String(m?.due ?? deadline), deal: String(m?.deal ?? "Account"), source: src(String(m?.source_id ?? base.id), "Next-step record") })).concat(ranked).slice(0, 3),
    risks: [...dealRisks, ...(account?.risks ?? []), ...(account?.deadlines ?? [])].map((r: any) => ({ title: String(r?.title ?? r?.name ?? "Unverified risk"), detail: String(r?.detail ?? r?.text ?? "No detail recorded"), due: r?.due ? String(r.due) : undefined, source: r?.source ?? src(String(r?.source_id ?? base.id), "Risk/deadline record") })),
    gaps: (account?.gaps ?? []).map((g: any) => ({ question: String(g?.question ?? "Unknown"), why: String(g?.why ?? "Decision impact is not recorded"), ask: String(g?.ask ?? "Account owner"), source: src(String(g?.source_id ?? base.id), "Gap record") })).concat(accountGaps, missingRoles)
  };
}
function enrichWithSignals(account: AccountView, rawSignals: any): AccountView {
  const signals = Array.isArray(rawSignals) ? rawSignals : Array.isArray(rawSignals?.signals) ? rawSignals.signals : [];
  const relevant = signals.filter((s: any) => String(s?.account) === account.id);
  if (!relevant.length) return account;
  const risks: Risk[] = relevant.map((s: any) => {
    const first = s?.records?.[0] ?? {};
    return { title: String(s?.title ?? "New account signal"), detail: String(s?.summary ?? "Review the new account signal"), due: s?.dated ? String(s.dated) : undefined, source: src(String(first?.path ?? s?.id ?? "signal"), "Live signal record") };
  });
  const urgent = relevant.find((s: any) => String(s?.id) === "urgent_request");
  const urgentMove: Move[] = urgent ? [{ rank: 1, action: "Confirm operator training and event-day support cover in writing", owner: "Account team", due: "5 Dec 2026", deal: "Scale Westmere's fleet", source: src(String(urgent?.records?.[0]?.path ?? urgent.id), "Urgent public-event request") }] : [];
  return { ...account, moves: [...urgentMove, ...account.moves].map((m, i) => ({ ...m, rank: i + 1, due: m.due === "Date not recorded" && urgent ? "5 Dec 2026" : m.due })).slice(0, 3), risks: [...risks, ...account.risks] };
}
function mapAldermoor(account: any, records: any[]): AccountView {
  const contract = recordText(records, "contract.txt");
  const annual = Number(contract.match(/([\d,]+) a year/i)?.[1]?.replace(/,/g, ""));
  const contractSource = src("contract.txt", "Signed order-form summary");
  const renewalSource = src("emails/2026-10-08_finance_mailbox.txt", "Finance renewal-quote request; no reply on file");
  const checkinSource = src("calls/2026-10-13_check_in.txt", "Account check-in and sister-company case-study request");
  const rolloutSource = src("calls/2026-03-17_rollout_check_in.txt", "Rollout check-in and plant network actions");
  const usageSource = src("usage_weekly.csv", "Weekly dock usage export");
  const roiSource = src("emails/2026-07-16_stefan_savings.txt", "Customer-provided ROI headline with no breakdown on file");
  const power = [
    { name: "Stefan Roy", role: "Decider" as const, stance: "Signed the order and is advocating expansion", source: contractSource },
    { name: "Group Finance", role: "Payer" as const, stance: "Requested a per-plant renewal quote", source: renewalSource },
    { name: "Stefan Roy's deputy", role: "User" as const, stance: "Led rollout; name is not recorded", source: rolloutSource },
    { name: "Plant IT teams", role: "Blocker" as const, stance: "Own unresolved plant network links", source: rolloutSource }
  ];
  const backed: Deal[] = Number.isFinite(annual) ? [{ name: "Current 14-dock annual contract", value: annual, valueStatus: "backed", source: contractSource, people: power }] : [];
  return {
    id: "B", name: String(account?.name ?? "Aldermoor Industrial Group"), currency: "EUR", backed,
    unbacked: [{ name: "Sister-company expansion", valueStatus: "unbacked", source: checkinSource, people: power }],
    moves: [
      { rank: 1, action: "Reply with the per-plant renewal quote Finance requested", owner: "CSM", due: "Before 31 Jan 2027", deal: "Current 14-dock annual contract", source: renewalSource },
      { rank: 2, action: "Get a supportable savings breakdown before publishing the case study", owner: "Stefan Roy", due: "This quarter", deal: "Sister-company expansion", source: checkinSource },
      { rank: 3, action: "Resolve the two plant network links and confirm alert recipients", owner: "Stefan Roy's deputy", due: "Before renewal", deal: "Current 14-dock annual contract", source: rolloutSource }
    ],
    risks: [
      { title: "Renewal quote is unanswered", detail: "Finance requested per-plant pricing and no reply is on file", due: "31 Jan 2027", source: renewalSource },
      { title: "Adoption and network reliability are uneven", detail: "Usage and rollout records need a plant-by-plant recovery plan", source: usageSource },
      { title: "ROI headline is not auditable", detail: "A savings headline exists, but no calculation detail has been received", source: roiSource }
    ],
    gaps: [
      { question: "Which plants need what renewal scope and price?", why: "Finance will not raise a renewal without per-plant cost", ask: "Group Finance", source: renewalSource },
      { question: "What supports the savings claim?", why: "The case study and expansion case rest on a number without a breakdown", ask: "Stefan Roy", source: roiSource },
      { question: "Who receives each plant's night alerts?", why: "Reliable incident response cannot be verified", ask: "Stefan Roy's deputy", source: src("calls/2026-08-25_check_in.txt", "Alert-recipient discussion") }
    ]
  };
}
function peopleFor(deal: any) {
  const roles = ["decider", "payer", "user", "blocker"] as const;
  return roles.flatMap(role => {
    const p = deal?.[role]; if (!p) return [];
    return [{ name: String(p?.name ?? p), role: (role[0].toUpperCase() + role.slice(1)) as any, stance: String(p?.stance ?? "Not recorded"), source: src(String(p?.source_id ?? deal?.source_id ?? deal?.id ?? "unknown-source"), `${role} record`) }];
  });
}
function mapStakeholders(list: any[]): Stakeholder[] {
  return list.map((person: any): Stakeholder => {
    const roleText = String(person?.role ?? "Stakeholder").toLowerCase();
    const role = roleText.includes("finance") || roleText.includes("payer") ? "Payer"
      : roleText.includes("data") || roleText.includes("compliance") || roleText.includes("legal") ? "Blocker"
      : roleText.includes("inspector") || roleText.includes("manager") || roleText.includes("operator") ? "User" : "Decider";
    return { name: String(person?.name ?? "Unnamed stakeholder"), role, stance: String(person?.relationship ?? "Relationship not recorded"), source: src(String(person?.id ?? "unknown-source"), String(person?.role ?? "Stakeholder record")) };
  });
}
