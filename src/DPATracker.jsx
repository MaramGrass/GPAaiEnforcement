import { useState, useEffect } from "react";

const OUTCOME_COLORS = {
  Fine:      { bg: "#FEF9EC", text: "#92400E", border: "#F59E0B", dot: "#F59E0B" },
  Warning:   { bg: "#EFF6FF", text: "#1E40AF", border: "#3B82F6", dot: "#3B82F6" },
  Order:     { bg: "#F5F3FF", text: "#6B21A8", border: "#A855F7", dot: "#A855F7" },
  Reprimand: { bg: "#FFF0F6", text: "#9D174D", border: "#EC4899", dot: "#EC4899" },
  Other:     { bg: "#F8FAFC", text: "#475569", border: "#94A3B8", dot: "#94A3B8" },
};

const FLAG_EMOJI = (code) => {
  if (!code) return "🌍";
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
  );
};

function formatDate(d) {
  if (!d) return "Unknown";
  const s = String(d).trim();
  if (s.length === 4) return s;
  if (s.length === 7) {
    const [y, m] = s.split("-");
    return new Date(y, m - 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetch("/dpa-data.json")
      .then(r => { if (!r.ok) throw new Error("Could not load data"); return r.json(); })
      .then(data => { setResults(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const outcomes = ["All", ...new Set(results.map(r => r.outcome))];
  const countries = [...new Set(results.map(r => r.country))].sort();

  let filtered = results.filter(r => {
    const matchCountry  = !filter || r.country === filter;
    const matchOutcome  = outcomeFilter === "All" || r.outcome === outcomeFilter;
    const matchSearch   = !searchText ||
      r.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      r.dpa.toLowerCase().includes(searchText.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchText.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchText.toLowerCase()));
    return matchCountry && matchOutcome && matchSearch;
  });

  if (sortBy === "date") {
    filtered = [...filtered].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  } else {
    filtered = [...filtered].sort((a, b) => (b.fineEUR || 0) - (a.fineEUR || 0));
  }

  const totalFines = results.reduce((s, r) => s + (r.fineEUR || 0), 0);

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", minHeight: "100vh", background: "#F7F8FA", color: "#1A1A2E" }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #9CA3AF; }
        input:focus { border-color: #1D3B8A !important; box-shadow: 0 0 0 3px rgba(29,59,138,0.1); }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; transform: translateY(-1px); }
        .card { transition: all 0.15s ease; }
        .filter-btn:hover { background: #EEF2FF !important; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236B7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px !important; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "0 0 auto" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src="/gpa-logo.png"
                alt="GPA Logo"
                style={{ width: 52, height: 52, objectFit: "cover", mixBlendMode: "lighten" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1D3B8A", letterSpacing: "-0.01em", lineHeight: 1.2 }}>Global Privacy Assembly</div>
              <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>DPA Enforcement Tracker</div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }} />

          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search cases, authorities, tags…"
            style={{
              width: 280, background: "#F9FAFB", border: "1.5px solid #E5E7EB",
              borderRadius: 8, padding: "9px 14px", color: "#1A1A2E", fontSize: 14,
              outline: "none", transition: "border-color 0.15s",
            }}
          />
        </div>
      </div>

      {/* Hero banner */}
      <div style={{ background: "linear-gradient(135deg, #1D3B8A 0%, #0A1628 60%, #1D3B8A 100%)", color: "#fff", padding: "48px 24px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#F5C842", marginBottom: 10, fontWeight: 600 }}>Global Privacy Assembly</div>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              AI Enforcement Actions<br />
              <span style={{ color: "#F5C842" }}>Tracked Worldwide</span>
            </h1>
            <p style={{ color: "#A8BDD8", fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 480 }}>
              How Data Protection Authorities enforce against AI systems — from automated decisions to facial recognition, LLMs, and beyond.
            </p>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { value: results.length, label: "Cases" },
              { value: countries.length, label: "Jurisdictions" },
              ...(totalFines > 0 ? [{
                value: "€" + (totalFines >= 1e9 ? (totalFines/1e9).toFixed(1)+"B" : totalFines >= 1e6 ? (totalFines/1e6).toFixed(0)+"M" : (totalFines/1e3).toFixed(0)+"K"),
                label: "Est. Fines"
              }] : [])
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#F5C842", lineHeight: 1, letterSpacing: "-0.03em" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#A8BDD8", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 48px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6B7280" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Loading enforcement database…</div>
          </div>
        )}

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: 16, color: "#DC2626", fontSize: 14, marginBottom: 24 }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <>
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 7, padding: "7px 12px", color: "#374151", fontSize: 13, outline: "none" }}
              >
                <option value="">All Countries</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {outcomes.map(o => {
                  const c = OUTCOME_COLORS[o] || OUTCOME_COLORS.Other;
                  const active = outcomeFilter === o;
                  return (
                    <button key={o} onClick={() => setOutcomeFilter(o)} className="filter-btn" style={{
                      background: active ? c.bg : "transparent",
                      color: active ? c.text : "#6B7280",
                      border: `1.5px solid ${active ? c.border : "#E5E7EB"}`,
                      borderRadius: 6, padding: "5px 12px", cursor: "pointer",
                      fontSize: 12, fontWeight: active ? 600 : 400, transition: "all 0.15s",
                    }}>
                      {active && o !== "All" && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: c.dot, marginRight: 5, verticalAlign: "middle" }} />}
                      {o}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>Sort by:</span>
                {["date", "fine"].map(s => (
                  <button key={s} onClick={() => setSortBy(s)} className="filter-btn" style={{
                    background: sortBy === s ? "#EEF2FF" : "transparent",
                    border: `1.5px solid ${sortBy === s ? "#1D3B8A" : "#E5E7EB"}`,
                    borderRadius: 6, padding: "5px 12px", cursor: "pointer",
                    color: sortBy === s ? "#1D3B8A" : "#6B7280", fontSize: 12,
                    fontWeight: sortBy === s ? 600 : 400, transition: "all 0.15s",
                  }}>{s === "fine" ? "Fine ↓" : "Date ↓"}</button>
                ))}
                {searchText && (
                  <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 8 }}>
                    {filtered.length} of {results.length} results
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((r, i) => {
                const oc = OUTCOME_COLORS[r.outcome] || OUTCOME_COLORS.Other;
                const isOpen = expanded === r.id;
                return (
                  <div
                    key={r.id || i}
                    className="card"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    style={{
                      background: "#fff",
                      border: `1.5px solid ${isOpen ? "#1D3B8A" : "#E5E7EB"}`,
                      borderRadius: 10, padding: "16px 20px", cursor: "pointer",
                      boxShadow: isOpen ? "0 4px 20px rgba(29,59,138,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 22 }}>{FLAG_EMOJI(r.countryCode)}</span>
                      <div style={{ flex: "0 0 140px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1D3B8A" }}>{r.dpa}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{r.country}</div>
                      </div>
                      <div style={{ flex: 3, minWidth: 180 }}>
                        <div style={{ fontSize: 14, color: "#111827", lineHeight: 1.4, fontWeight: 500 }}>{r.subject}</div>
                      </div>
                      <div style={{ minWidth: 110, textAlign: "right" }}>
                        {r.fine
                          ? <div style={{ fontSize: 14, fontWeight: 700, color: "#B45309" }}>{r.fine}</div>
                          : <div style={{ fontSize: 12, color: "#D1D5DB" }}>No fine</div>}
                      </div>
                      <span style={{
                        background: oc.bg, color: oc.text, border: `1.5px solid ${oc.border}`,
                        borderRadius: 20, padding: "3px 11px", fontSize: 11,
                        fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap",
                      }}>{r.outcome}</span>
                      <div style={{ minWidth: 85, textAlign: "right", fontSize: 12, color: "#9CA3AF" }}>{formatDate(r.date)}</div>
                      <span style={{ color: "#D1D5DB", fontSize: 11, display: "inline-block", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>▼</span>
                    </div>

                    {isOpen && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Summary</div>
                          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>{r.summary}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {r.reference && (
                            <div>
                              <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Reference</div>
                              <div style={{ fontSize: 13, color: "#6B7280", wordBreak: "break-all" }}>
                                {r.reference.startsWith("http")
                                  ? <a href={r.reference} target="_blank" rel="noopener noreferrer" style={{ color: "#1D3B8A", textDecoration: "none" }} onMouseEnter={e => e.target.style.textDecoration="underline"} onMouseLeave={e => e.target.style.textDecoration="none"}>{r.reference}</a>
                                  : r.reference}
                              </div>
                            </div>
                          )}
                          {r.tags?.length > 0 && (
                            <div>
                              <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Tags</div>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {r.tags.map(tag => (
                                  <span key={tag} style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 4, padding: "2px 9px", fontSize: 11, color: "#1D3B8A", fontWeight: 500 }}>{tag}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF", fontSize: 14 }}>
                No results match the current filters.
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, borderTop: "1px solid #E5E7EB", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", background: "#0A1628", flexShrink: 0 }}>
              <img src="/gpa-logo.png" alt="" style={{ width: 24, height: 24, objectFit: "cover", mixBlendMode: "lighten" }} />
            </div>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Global Privacy Assembly — DPA Enforcement Tracker | Created by the AI Working Group</span>
          </div>
          <span style={{ fontSize: 12, color: "#D1D5DB" }}>Always verify with primary sources.</span>
        </div>
      </div>
    </div>
  );
}