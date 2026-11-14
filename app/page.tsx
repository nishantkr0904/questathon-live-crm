"use client";
import { useEffect, useState } from "react";
import { AccountView, Dashboard, Source } from "@/lib/types";

function Cite({ source }: { source: Source }) {
  return <details className="cite"><summary>Source: {source.id}</summary><span className="source-detail">{source.label}</span></details>;
}
function Money({ amount, source, currency = "GBP" }: { amount?: number; source: Source; currency?: string }) { return <>{amount === undefined ? "Not backed" : new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)} <Cite source={source} /></>; }
function Account({ account }: { account: AccountView }) {
  const total = account.backed.reduce((sum, deal) => sum + (deal.value ?? 0), 0);
  const book = account.book?.amount ?? total;
  const bookSource = account.book?.source;
  return <article className="account">
    <header><p className="eyebrow">ACCOUNT {account.id}</p><h2>{account.name}</h2></header>
    <section><h3>1. What is the book worth?</h3><p className="total">{new Intl.NumberFormat("en-GB", { style: "currency", currency: account.currency, maximumFractionDigits: 0 }).format(book)} {bookSource ? <Cite source={bookSource} /> : account.backed.map(d => <Cite key={d.name} source={d.source} />)}</p>
      <h4>Backed value</h4>{account.backed.length ? account.backed.map(d => <div className="item" key={d.name}><strong>{d.name}</strong><span><Money amount={d.value} source={d.source} currency={account.currency} /></span></div>) : <Empty text="No deal value is backed by a source record yet." />}
      {account.unbacked.length > 0 && <><h4>Claims held apart</h4>{account.unbacked.map(d => <div className="item" key={d.name}><strong>{d.name}</strong><span>Unbacked claim <Cite source={d.source} /></span></div>)}</>}
    </section>
    <section><h3>2. Who holds the power?</h3>{account.people.length ? account.people.map(p => <div className="item" key={`${p.name}-${p.role}`}><strong>{p.name} · {p.role}</strong><span>{p.stance} <Cite source={p.source} /></span></div>) : <Empty text="No named stakeholder is recorded. Decision and payer ownership remain explicit gaps." />}</section>
    <section><h3>3. What do you do first?</h3>{account.moves.length ? account.moves.map(m => <div className="move" key={m.rank}><b>{m.rank}</b><div><strong>{m.action}</strong><span>Owner: {m.owner} · Due: {m.due} · Advances: {m.deal} <Cite source={m.source} /></span></div></div>) : <Empty text="No ranked, dated next steps are in the source data. This is a planning gap, not a green status." />}</section>
    <section><h3>4. What is about to go wrong?</h3>{account.risks.length ? account.risks.map(r => <div className="risk" key={r.title}><strong>{r.title}</strong><span>{r.detail}{r.due ? ` · Due: ${r.due}` : ""} <Cite source={r.source} /></span></div>) : <Empty text="No risk is structured in the current account extract. Monitor live signals rather than assuming there is no risk." />}</section>
    <section><h3>5. What do you still not know?</h3>{account.gaps.length ? account.gaps.map(g => <div className="gap" key={g.question}><strong>{g.question}</strong><span>Why it matters: {g.why} · Ask: {g.ask} <Cite source={g.source} /></span></div>) : <Empty text="The source has not supplied explicit gaps. Validate decision, payer, and user roles before forecasting." />}</section>
  </article>;
}
function Empty({ text }: { text: string }) { return <p className="empty">{text}</p>; }
function NoteComposer({ accounts, onSaved }: { accounts: AccountView[]; onSaved: () => void }) {
  const [account, setAccount] = useState(accounts[0]?.id ?? ""); const [text, setText] = useState(""); const [status, setStatus] = useState("");
  async function save() { if (!text.trim()) return; setStatus("Saving…"); const r = await fetch("/api/notes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ account, text, kind: "next_step", title: "CRM note" }) }); const data = await r.json(); if (!r.ok) { setStatus(data.error ?? "Unable to save note"); return; } setText(""); setStatus("Note saved"); onSaved(); }
  return <section className="note"><h2>Write a sourced account note</h2><select value={account} onChange={e => setAccount(e.target.value)}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select><input value={text} onChange={e => setText(e.target.value)} placeholder="Record a next step, risk, or decision" /><button onClick={save}>Submit note</button>{status && <span>{status}</span>}</section>;
}
export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  async function load(refresh = false) { setLoading(true); setError(""); try { const r = await fetch(refresh ? "/api/refresh" : "/api/dashboard", { method: refresh ? "POST" : "GET" }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setData(j); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load CRM"); } finally { setLoading(false); } }
  useEffect(() => { load(); const id = setInterval(() => load(true), 61_000); return () => clearInterval(id); }, []);
  return <main><header className="hero"><div><p className="eyebrow">LIVE ACCOUNT OPERATING SYSTEM</p><h1>Monday Morning CRM</h1><p>Evidence-led deal control. Values and claims remain traceable to their source.</p></div><button onClick={() => load(true)} disabled={loading}>{loading ? "Loading…" : "Refresh live signals"}</button></header>
    {error && <p className="error">{error}</p>}{data && <><div className="status"><span>Updated {new Date(data.generatedAt).toLocaleString()}</span><span>Live signals are checked once per minute</span></div><NoteComposer accounts={data.accounts} onSaved={() => load(true)} /><div className="grid">{data.accounts.map(a => <Account key={a.id} account={a} />)}</div></>}
  </main>;
}
