export type Source = { id: string; label: string; path?: string };
export type Move = { rank: number; action: string; owner: string; due: string; deal: string; source: Source };
export type Risk = { title: string; detail: string; due?: string; source: Source };
export type Gap = { question: string; why: string; ask: string; source: Source };
export type Stakeholder = { name: string; role: "Decider" | "Payer" | "User" | "Blocker"; stance: string; source: Source };
export type Deal = { name: string; value?: number; valueStatus: "backed" | "unbacked"; source: Source; people: Stakeholder[] };
export type AccountView = { id: string; name: string; currency: string; book?: { amount: number; source: Source }; backed: Deal[]; unbacked: Deal[]; people: Stakeholder[]; moves: Move[]; risks: Risk[]; gaps: Gap[] };
export type Dashboard = { generatedAt: string; accounts: AccountView[]; signals: unknown[] };
