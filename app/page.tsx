"use client";
import { useEffect, useState } from "react";
import { AccountView, Dashboard, Source } from "@/lib/types";

function Cite({ source }: { source: Source }) { return <span className="cite" title={source.label}>Source: {source.id}</span>; }
function Money({ amount, source, currency = "GBP" }: { amount?: number; source: Source; currency?: string }) { return <>{amount === undefined ? "Not backed" : new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)} <Cite source={source} /></>; }
function Account({ account }: { account: AccountView }) {
  const total = account.backed.reduce((sum, deal) => sum + (deal.value ?? 0), 0);
  return <article className="account">
    <header><p className="eyebrow">ACCOUNT {account.id}</p><h2>{account.name}</h2></header>
    <section><h3>1. What is the book worth?</h3><p className="total">{new Intl.NumberFormat("en-GB", { style: "currency", currency: account.currency, maximumFractionDigits: 0 }).format(total)} {account.backed.map(d => <Cite key={d.name} source={d.source} />)}</p>
      <h4>Backed value</h4>{account.backed.length ? account.backed.map(d => <div className="item" key={d.name}><strong>{d.name}</strong><span><Money amount={d.value} source={d.source} currency={account.currency} /></span></div>) : <Empty text="No deal value is backed by a source record yet." />}
      {account.unbacked.length > 0 && <><h4>Claims held apart</h4>{account.unbacked.map(d => <div className="item" key={d.name}><strong>{d.name}</strong><span>Unbacked claim <Cite source={d.source} /></span></div>)}</>}
    </section>
    <section><h3>2. Who holds the power?</h3>{[...account.backed, ...account.unbacked].flatMap(d => d.people.map(p => <div className="item" key={`${d.name}-${p.role}`}><strong>{p.name} · {p.role}</strong><span>{p.stance} <Cite source={p.source} /></span></div>)).length ? [...account.backed, ...account.unbacked].flatMap(d => d.people.map(p => <div className="item" key={`${d.name}-${p.role}`}><strong>{p.name} · {p.role}</strong><span>{p.stance} <Cite source={p.source} /></span></div>)) : <Empty text="Stakeholder roles are not structured in the source data. Review the cited account records before acting." />}</section>
    <section><h3>3. What do you do first?</h3>{account.moves.length ? account.moves.map(m => <div className="move" key={m.rank}><b>{m.rank}</b><div><strong>{m.action}</strong><span>Owner: {m.owner} · Due: {m.due} · Advances: {m.deal} <Cite source={m.source} /></span></div></div>) : <Empty text="No ranked, dated next steps are in the source data. This is a planning gap, not a green status." />}</section>
    <section><h3>4. What is about to go wrong?</h3>{account.risks.length ? account.risks.map(r => <div className="risk" key={r.title}><strong>{r.title}</strong><span>{r.detail}{r.due ? ` · Due: ${r.due}` : ""} <Cite source={r.source} /></span></div>) : <Empty text="No risk is structured in the current account extract. Monitor live signals rather than assuming there is no risk." />}</section>
    <section><h3>5. What do you still not know?</h3>{account.gaps.length ? account.gaps.map(g => <div className="gap" key={g.question}><strong>{g.question}</strong><span>Why it matters: {g.why} · Ask: {g.ask} <Cite source={g.source} /></span></div>) : <Empty text="The source has not supplied explicit gaps. Validate decision, payer, and user roles before forecasting." />}</section>
  </article>;
}
function Empty({ text }: { text: string }) { return <p className="empty">{text}</p>; }
export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  async function load(refresh = false) { setLoading(true); setError(""); try { const r = await fetch(refresh ? "/api/refresh" : "/api/dashboard", { method: refresh ? "POST" : "GET" }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setData(j); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load CRM"); } finally { setLoading(false); } }
  useEffect(() => { load(); const id = setInterval(() => load(true), 61_000); return () => clearInterval(id); }, []);
  return <main><header className="hero"><div><p className="eyebrow">LIVE ACCOUNT OPERATING SYSTEM</p><h1>Monday Morning CRM</h1><p>Evidence-led deal control. Values and claims remain traceable to their source.</p></div><button onClick={() => load(true)} disabled={loading}>{loading ? "Loading…" : "Refresh live signals"}</button></header>
    {error && <p className="error">{error}</p>}{data && <><div className="status"><span>Updated {new Date(data.generatedAt).toLocaleString()}</span><span>Live signals are checked once per minute</span></div><div className="grid">{data.accounts.map(a => <Account key={a.id} account={a} />)}</div></>}
  </main>;
}
