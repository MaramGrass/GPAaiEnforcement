import { useState, useEffect, useMemo } from "react";

/* Outcome accent tokens (keys map to CSS custom properties in index.css) */
const OUTCOMES = {
  Fine:      { bg: "var(--fine-bg)",  fg: "var(--fine-fg)",  dot: "var(--fine-dot)",  hero: "var(--fine-h)" },
  Order:     { bg: "var(--order-bg)", fg: "var(--order-fg)", dot: "var(--order-dot)", hero: "var(--order-h)" },
  Warning:   { bg: "var(--warn-bg)",  fg: "var(--warn-fg)",  dot: "var(--warn-dot)",  hero: "var(--warn-h)" },
  Reprimand: { bg: "var(--repr-bg)",  fg: "var(--repr-fg)",  dot: "var(--repr-dot)",  hero: "var(--repr-h)" },
  Other:     { bg: "var(--other-bg)", fg: "var(--other-fg)", dot: "var(--other-dot)", hero: "var(--other-h)" },
};
const ORDER = ["Fine", "Order", "Warning", "Reprimand", "Other"];

/* Support both the current data (fineEUR) and the converter's field (fineUSD). */
const fineValue = (r) => r.fineEUR ?? r.fineUSD ?? 0;

function formatDate(d) {
  if (!d) return "—";
  const s = String(d).trim();
  if (s.length === 4) return s;
  if (s.length === 7) {
    const [y, m] = s.split("-");
    return new Date(y, m - 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function compactMoney(n, sym) {
  if (!n) return null;
  const v = n >= 1e9 ? (n / 1e9).toFixed(1) + "B"
          : n >= 1e6 ? (n / 1e6).toFixed(0) + "M"
          : n >= 1e3 ? (n / 1e3).toFixed(0) + "K" : String(n);
  return sym + v;
}

const Chevron = () => (
  <svg className="chev" width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CURRENCIES = [
  { code: "EUR", sym: "€" },
  { code: "USD", sym: "$" },
  { code: "GBP", sym: "£" },
];

/* Hero "Est. Fines" figure that cycles smoothly through EUR / USD / GBP.
   Cross-dissolves on a fixed interval; holds still under reduced motion. */
function FinesStat({ totals }) {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const cycle = setInterval(() => {
      setVisible(false);                                   // fade current out
      setTimeout(() => {
        setI((n) => (n + 1) % CURRENCIES.length);          // swap while hidden
        setVisible(true);                                  // fade next in
      }, 500);
    }, 3400);
    return () => clearInterval(cycle);
  }, []);

  const cur = CURRENCIES[i];
  return (
    <div className="stat stat--fines">
      <div className="stat__n">
        <span className="fines-val" style={{ opacity: visible ? 1 : 0 }}>
          {compactMoney(totals[cur.code], cur.sym)}
        </span>
      </div>
      <div className="stat__l">Est. Fines</div>
    </div>
  );
}

export default function DPATracker() {
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [country, setCountry] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleRow = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/dpa-data.json")
      .then((r) => { if (!r.ok) throw new Error("The enforcement data could not be loaded."); return r.json(); })
      .then((data) => {
        const cases = Array.isArray(data) ? data : (data.cases || []);
        setResults(cases);
        setMeta(Array.isArray(data) ? null : (data.meta || null));
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const outcomes = useMemo(
    () => ["All", ...ORDER.filter((o) => results.some((r) => r.outcome === o))],
    [results]
  );
  const countries = useMemo(
    () => [...new Set(results.map((r) => r.country).filter(Boolean))].sort(),
    [results]
  );

  const totalFines = useMemo(() => results.reduce((s, r) => s + fineValue(r), 0), [results]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    let list = results.filter((r) => {
      const okC = !country || r.country === country;
      const okO = outcomeFilter === "All" || r.outcome === outcomeFilter;
      const okQ = !needle ||
        [r.subject, r.dpa, r.summary, r.country].some((f) => (f || "").toLowerCase().includes(needle)) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(needle));
      return okC && okO && okQ;
    });
    list = [...list].sort(sortBy === "fine"
      ? (a, b) => fineValue(b) - fineValue(a)
      : (a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    return list;
  }, [results, country, outcomeFilter, sortBy, q]);

  /* Three totals for the animated hero figure. Prefer the values baked in by
     convert.py (meta.totals); fall back to computing from the cases. */
  const fineTotals = meta?.totals || {
    EUR: totalFines,
    USD: Math.round(totalFines * 1.08),
    GBP: Math.round(totalFines * 0.86),
  };
  const hasFines = (fineTotals.EUR || 0) > 0;

  return (
    <>
      {/* Top bar */}
      <header className="topbar">
        <div className="wrap topbar__inner">
          <div className="brand">
            <div className="brand__mark"><img src="/gpa-logo.png" alt="" /></div>
            <div>
              <div className="brand__name">Global Privacy Assembly</div>
              <div className="brand__sub">DPA Enforcement Tracker</div>
            </div>
          </div>
          <div className="spacer" />
          <input
            className="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cases, authorities, tags…"
            aria-label="Search cases"
          />
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="wrap hero__inner">
          <div className="hero__lead">
            <p className="hero__eyebrow">Global Privacy Assembly</p>
            <h1>AI Enforcement Actions<br /><span>Tracked Worldwide</span></h1>
            <p className="hero__sub">
              How data protection authorities enforce against AI systems, from automated
              decisions to facial recognition, LLMs, and beyond.
            </p>
          </div>
          {!loading && !error && results.length > 0 && (
            <div className="hero__stats">
              <div className="stat">
                <div className="stat__n">{results.length}</div>
                <div className="stat__l">Cases</div>
              </div>
              <div className="stat">
                <div className="stat__n">{countries.length}</div>
                <div className="stat__l">Jurisdictions</div>
              </div>
              {hasFines && <FinesStat totals={fineTotals} />}
            </div>
          )}
        </div>
      </section>

      {/* Board */}
      <main className="wrap board">
        {error && <div className="err">{error}</div>}

        {!error && (
          <>
            {/* Toolbar */}
            <div className="toolbar">
              <select className="select" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Filter by jurisdiction">
                <option value="">All jurisdictions</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="pills">
                {outcomes.map((o) => {
                  const active = outcomeFilter === o;
                  const c = OUTCOMES[o];
                  return (
                    <button key={o} className="pill" data-active={active}
                      onClick={() => setOutcomeFilter(o)}
                      style={active ? {
                        background: o === "All" ? "#EEF1F9" : c.bg,
                        borderColor: o === "All" ? "#C9D3EC" : c.dot,
                        color: o === "All" ? "var(--navy)" : c.fg,
                      } : undefined}>
                      {active && o !== "All" && <span className="dot" style={{ background: c.dot }} />}
                      {o}
                    </button>
                  );
                })}
              </div>

              <div className="toolbar__right">
                <span className="sortlabel">Sort</span>
                {[["date", "Date"], ["fine", "Fine"]].map(([k, lbl]) => (
                  <button key={k} className="pill" data-active={sortBy === k}
                    onClick={() => setSortBy(k)}
                    style={sortBy === k ? { background: "#EEF1F9", borderColor: "#C9D3EC", color: "var(--navy)" } : undefined}>
                    {lbl} ↓
                  </button>
                ))}
                <span className="count">{filtered.length}/{results.length}</span>
              </div>
            </div>

            {/* Register */}
            <div className="ledger">
              <div className="ledger__head">
                <div>Date</div><div>Authority</div><div>Case</div>
                <div>Outcome</div><div className="r">Fine</div>
              </div>

              {loading && (
                <div className="skeleton" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, i) => <div className="sk-row" key={i} style={{ width: `${88 - i * 6}%` }} />)}
                </div>
              )}

              {!loading && filtered.map((r, i) => {
                const c = OUTCOMES[r.outcome] || OUTCOMES.Other;
                const open = expanded.has(r.id || i);
                return (
                  <article className="entry" data-open={open} key={r.id || i}>
                    <div className="entry__row" onClick={() => toggleRow(r.id || i)}>
                      <div className="e-date">{formatDate(r.date)}</div>
                      <div className="e-auth">
                        {r.countryCode && <span className="cc">{r.countryCode.toUpperCase()}</span>}
                        <div className="e-auth__t">
                          <div className="e-dpa">{r.dpa}</div>
                          <div className="e-country">{r.country}</div>
                        </div>
                      </div>
                      <div className="e-subj">{r.subject}</div>
                      <span className="tag-badge" style={{ background: c.bg, color: c.fg }}>
                        <span className="dot" style={{ background: c.dot }} />{r.outcome}
                      </span>
                      <div className="e-fine">
                        {r.fine
                          ? <span className="e-fine__v">{r.fine}</span>
                          : <span className="e-fine__none">—</span>}
                        <Chevron />
                      </div>
                    </div>

                    <div className="detail">
                      <div>
                        <div className="detail__inner">
                          <div>
                            <p className="d-label">Summary</p>
                            <p className="d-summary">{r.summary}</p>
                          </div>
                          <div>
                            {r.reference && (
                              <div className="d-block">
                                <p className="d-label">Reference</p>
                                <div className="d-ref">
                                  {String(r.reference).startsWith("http")
                                    ? <a href={r.reference} target="_blank" rel="noopener noreferrer">{r.reference}</a>
                                    : r.reference}
                                </div>
                              </div>
                            )}
                            {r.tags?.length > 0 && (
                              <div className="d-block">
                                <p className="d-label">Tags</p>
                                <div className="tagrow">{r.tags.map((t) => <span key={t}>{t}</span>)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!loading && filtered.length === 0 && (
                <div className="empty">
                  <h3>No entries match these filters</h3>
                  <p>Clear the search or choose a different jurisdiction or outcome.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="foot">
              <div className="foot__l">
                <div className="brand__mark"><img src="/gpa-logo.png" alt="" /></div>
                Global Privacy Assembly · DPA Enforcement Tracker · Created by the AI Working Group
              </div>
              <div className="foot__r">Always verify with primary sources.</div>
            </footer>
          </>
        )}
      </main>
    </>
  );
}
