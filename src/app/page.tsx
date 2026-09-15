"use client";
import { useEffect, useMemo, useState } from "react";
import { analyze, classify, DailyLog, Mood, todayISO } from "@/lib/wellness";

const DEMO_LOGS: DailyLog[] = [
  { date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0,10), sleepHours: 6.5, activityMinutes: 20, waterLiters: 1.6, mood: "okay", wellnessScore: 56, wellnessLevel: "Needs Attention", suggestions: [] },
  { date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0,10), sleepHours: 7.2, activityMinutes: 35, waterLiters: 2.1, mood: "good", wellnessScore: 78, wellnessLevel: "Balanced", suggestions: [] },
  { date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0,10), sleepHours: 5.8, activityMinutes: 10, waterLiters: 1.2, mood: "low", wellnessScore: 31, wellnessLevel: "Action Needed", suggestions: [] },
  { date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0,10), sleepHours: 8.0, activityMinutes: 45, waterLiters: 2.4, mood: "great", wellnessScore: 91, wellnessLevel: "Thriving", suggestions: [] },
  { date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0,10), sleepHours: 7.5, activityMinutes: 30, waterLiters: 2.0, mood: "good", wellnessScore: 82, wellnessLevel: "Thriving", suggestions: [] },
  { date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0,10), sleepHours: 6.0, activityMinutes: 25, waterLiters: 1.8, mood: "okay", wellnessScore: 62, wellnessLevel: "Balanced", suggestions: [] },
];

type Tab = "today" | "insights" | "journal";

const SUN = { orange: "#d4652e", gold: "#e8a838", peach: "#f4c9a0", wine: "#9b304a", dusk: "#5b2d4a" };

export default function Home() {
  const [name, setName] = useState("Alex");
  const [course, setCourse] = useState("B.Tech CSE — 2nd Year");
  const [sleep, setSleep] = useState(7.5);
  const [activity, setActivity] = useState(30);
  const [water, setWater] = useState(2.0);
  const [mood, setMood] = useState<Mood>("good");
  const [logs, setLogs] = useState<DailyLog[]>(DEMO_LOGS);
  const [range, setRange] = useState<"7d" | "14d" | "30d">("7d");
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("today");

  useEffect(() => {
    setMounted(true);
    try {
      const n = localStorage.getItem("ws_name");
      const c = localStorage.getItem("ws_course");
      const l = localStorage.getItem("ws_logs");
      if (n) setName(n);
      if (c) setCourse(c);
      if (l) { const p = JSON.parse(l); if (Array.isArray(p) && p.length) setLogs(p); }
      else setLogs(DEMO_LOGS);
    } catch {}
  }, []);
  useEffect(() => { if (mounted) localStorage.setItem("ws_name", name); }, [name, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("ws_course", course); }, [course, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("ws_logs", JSON.stringify(logs)); }, [logs, mounted]);

  const preview = useMemo(() => analyze(sleep, activity, water, mood), [sleep, activity, water, mood]);
  const previewCls = classify(preview.wellnessScore);

  const displayLogs = useMemo(() => {
    const sorted = [...logs].sort((a,b) => a.date.localeCompare(b.date));
    const n = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    return sorted.slice(-n);
  }, [logs, range]);

  const avgScore = displayLogs.length ? Math.round(displayLogs.reduce((s,l) => s + l.wellnessScore, 0) / displayLogs.length) : 0;
  const streak = (() => {
    let c = 0; const sorted = [...logs].sort((a,b) => b.date.localeCompare(a.date));
    for (const l of sorted) { if (l.wellnessScore >= 60) c++; else break; }
    return c;
  })();

  function saveToday() {
    const newLog: DailyLog = { date: todayISO(), sleepHours: sleep, activityMinutes: activity, waterLiters: water, mood, wellnessScore: preview.wellnessScore, wellnessLevel: preview.wellnessLevel, suggestions: preview.suggestions };
    setLogs(prev => {
      const filtered = prev.filter(p => p.date !== todayISO());
      return [...filtered, newLog].sort((a,b) => a.date.localeCompare(b.date));
    });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }
  function deleteLog(date: string) { setLogs(p => p.filter(x => x.date !== date)); }
  function fillDemo() {
    const demo: DailyLog = { date: todayISO(), sleepHours: 7 + Math.random() * 1.5, activityMinutes: 20 + Math.floor(Math.random() * 50), waterLiters: Number((1.5 + Math.random() * 1.2).toFixed(1)), mood: (["great","good","okay"] as Mood[])[Math.floor(Math.random() * 3)], wellnessScore: 0, wellnessLevel: "Balanced", suggestions: [] };
    const a = analyze(demo.sleepHours, demo.activityMinutes, demo.waterLiters, demo.mood);
    demo.wellnessScore = a.wellnessScore; demo.wellnessLevel = a.wellnessLevel; demo.suggestions = a.suggestions;
    setSleep(Number(demo.sleepHours.toFixed(1))); setActivity(demo.activityMinutes); setWater(demo.waterLiters); setMood(demo.mood);
  }

  /* ---------- CHARTS ---------- */

  function LineChart({ data }: { data: DailyLog[] }) {
    if (!data.length) return <div className="h-[190px] grid place-items-center text-sm text-[var(--muted)]">Log a day to see your sunset curve 🌇</div>;
    const w = 600, h = 170, padL = 34, padR = 14, padT = 14, padB = 26;
    const xs = data.map((_, i) => padL + (i * (w - padL - padR) / Math.max(1, data.length - 1)));
    const ys = data.map(d => padT + (1 - d.wellnessScore / 100) * (h - padT - padB));
    const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
    const area = `${path} L ${xs[xs.length - 1]} ${h - padB} L ${xs[0]} ${h - padB} Z`;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[190px]">
        <defs>
          <linearGradient id="sunArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8a838" stopOpacity="0.35"/>
            <stop offset="60%" stopColor="#d4652e" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#d4652e" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="sunLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e8a838"/><stop offset="100%" stopColor="#9b304a"/>
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(v => {
          const y = padT + (1 - v / 100) * (h - padT - padB);
          return <g key={v}><line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#f3e7db" strokeWidth={1} strokeDasharray="4 3"/><text x={padL - 8} y={y + 3} fontSize="9" fill="#c9b8a8" textAnchor="end">{v}</text></g>
        })}
        <path d={area} fill="url(#sunArea)"/>
        <path d={path} fill="none" stroke="url(#sunLine)" strokeWidth={2.5} strokeLinecap="round"/>
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={xs[i]} cy={ys[i]} r={9} fill="#d4652e" opacity={0.12}/>
            <circle cx={xs[i]} cy={ys[i]} r={4.5} fill={d.wellnessScore >= 80 ? "#d4652e" : d.wellnessScore >= 60 ? "#e8a838" : d.wellnessScore >= 40 ? "#c4956a" : "#9b304a"} stroke="white" strokeWidth={2}/>
          </g>
        ))}
        {data.map((d, i) => <text key={d.date} x={xs[i]} y={h - 5} fontSize="9" textAnchor="middle" fill="#c9b8a8">{d.date.slice(5)}</text>)}
      </svg>
    );
  }

  function HabitBars({ data }: { data: DailyLog[] }) {
    const rows = data.slice(-7);
    if (!rows.length) return <div className="h-[190px] grid place-items-center text-sm text-[var(--muted)]">No habits yet</div>;
    return (
      <div className="h-[190px] flex items-end gap-3 px-1">
        {rows.map(d => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div className="w-full flex gap-1 justify-center items-end flex-1">
              <div className="flex-1 rounded-t-md transition-all duration-500" style={{ height: `${Math.max(6, (d.sleepHours / 10) * 100)}%`, background: "linear-gradient(180deg,#e8a838,#d4652e)" }} title={`Sleep ${d.sleepHours}h`} />
              <div className="flex-1 rounded-t-md transition-all duration-500" style={{ height: `${Math.max(6, Math.min(100, (d.activityMinutes / 60) * 100))}%`, background: "linear-gradient(180deg,#f4c9a0,#e8a838)" }} title={`Move ${d.activityMinutes}m`} />
              <div className="flex-1 rounded-t-md transition-all duration-500" style={{ height: `${Math.max(6, (d.waterLiters / 3.5) * 100)}%`, background: "linear-gradient(180deg,#e8b4b8,#9b304a)" }} title={`Water ${d.waterLiters}L`} />
            </div>
            <div className="text-[9px] text-[var(--muted)]">{d.date.slice(5)}</div>
          </div>
        ))}
      </div>
    );
  }

  function RadarChart() {
    const axes = [
      { label: "Sleep", value: Math.min(1, sleep / 9) },
      { label: "Move", value: Math.min(1, activity / 60) },
      { label: "Water", value: Math.min(1, water / 3) },
      { label: "Mood", value: ({ great: 1, good: 0.75, okay: 0.5, low: 0.25 } as Record<Mood, number>)[mood] },
      { label: "Score", value: preview.wellnessScore / 100 },
    ];
    const cx = 110, cy = 105, r = 68, n = axes.length;
    const pt = (v: number, i: number) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      return { x: cx + r * v * Math.cos(a), y: cy + r * v * Math.sin(a) };
    };
    const poly = axes.map((a, i) => { const p = pt(a.value, i); return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`; }).join(" ") + " Z";
    return (
      <svg viewBox="0 0 220 210" className="w-full max-w-[240px] mx-auto h-[190px]">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#e8a838" stopOpacity="0.35"/><stop offset="100%" stopColor="#d4652e" stopOpacity="0.08"/>
          </radialGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map(g => (
          <polygon key={g} points={axes.map((_, i) => { const p = pt(g, i); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="#f0e2d4" strokeWidth={g === 1 ? 1.2 : 0.8} />
        ))}
        {axes.map((_, i) => { const p = pt(1, i); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#f0e2d4" strokeWidth={0.7} />; })}
        <path d={poly} fill="url(#radarFill)" stroke="#d4652e" strokeWidth={2} strokeLinejoin="round" />
        {axes.map((a, i) => {
          const p = pt(a.value, i);
          const lp = pt(1.22, i);
          return (
            <g key={a.label}>
              <circle cx={p.x} cy={p.y} r={4.5} fill="#d4652e" stroke="#fff" strokeWidth={2} />
              <text x={lp.x} y={lp.y + 3} fontSize="10" textAnchor="middle" fill="#8a7a72" fontWeight={600}>{a.label}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  function LevelDonut() {
    const counts = { Thriving: 0, Balanced: 0, "Needs Attention": 0, "Action Needed": 0 } as Record<string, number>;
    displayLogs.forEach(l => { counts[l.wellnessLevel] = (counts[l.wellnessLevel] || 0) + 1; });
    const total = Math.max(1, displayLogs.length);
    const segs = [
      { label: "Thriving", color: "#d4652e", v: counts["Thriving"] },
      { label: "Balanced", color: "#e8a838", v: counts["Balanced"] },
      { label: "Needs care", color: "#f4c9a0", v: counts["Needs Attention"] },
      { label: "Low", color: "#9b304a", v: counts["Action Needed"] },
    ];
    const R = 52, C = 2 * Math.PI * R;
    let acc = 0;
    return (
      <div className="flex items-center gap-5 h-[190px]">
        <div className="relative shrink-0 mx-auto">
          <svg viewBox="0 0 130 130" className="w-[130px] h-[130px] -rotate-90">
            <circle cx="65" cy="65" r={R} fill="none" stroke="#f3e7db" strokeWidth="16" />
            {segs.map(s => {
              const frac = s.v / total;
              const el = (
                <circle key={s.label} cx="65" cy="65" r={R} fill="none" stroke={s.color} strokeWidth="16"
                  strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C} strokeLinecap="butt" />
              );
              acc += frac;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center"><div className="text-2xl font-bold">{avgScore}</div><div className="text-[10px] text-[var(--muted)]">avg</div></div>
          </div>
        </div>
        <div className="space-y-2 flex-1">
          {segs.map(s => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              <span className="text-[var(--muted)] flex-1">{s.label}</span>
              <b>{s.v}</b>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function Heatmap() {
    const days = Array.from({ length: 21 }, (_, i) => {
      const d = new Date(Date.now() - (20 - i) * 86400000);
      const log = logs.find(l => l.date === d.toISOString().slice(0, 10));
      return { date: d, score: log ? log.wellnessScore : null };
    });
    return (
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div key={i} title={`${d.date.toISOString().slice(0, 10)}${d.score ? ` — ${d.score}` : " — no log"}`}
            className="aspect-square rounded-md transition-all"
            style={{ background: !d.score ? "#f6efe6" : d.score >= 80 ? "#d4652e" : d.score >= 60 ? "#e8a838" : d.score >= 40 ? "#f4c9a0" : "#e9c8c8" }} />
        ))}
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="flex-1">
      {/* minimal top bar */}
      <header className="sticky top-0 z-20 backdrop-blur-lg bg-[#fdf8f0]/85 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg grid place-items-center text-white text-sm shadow-md" style={{ background: "linear-gradient(135deg,#e8a838,#d4652e)" }}>☀</div>
            <div className="font-semibold tracking-tight">WellSpring</div>
          </div>
          <button onClick={fillDemo} className="text-xs border border-[var(--border)] px-4 py-2 rounded-xl hover:bg-[var(--soft)] transition-colors">🎲 Demo</button>
        </div>
      </header>

      {/* ===== SUNSET HERO (the graphic anchor) ===== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="relative overflow-hidden rounded-3xl text-white fade-in-up" style={{ background: "linear-gradient(180deg,#2e1a3a 0%,#7a2d4d 30%,#d4652e 62%,#e8a838 85%,#ffd98e 100%)" }}>
          <svg viewBox="0 0 800 260" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMax slice">
            <circle cx="620" cy="150" r="58" fill="#ffe9b0" opacity="0.95" />
            <circle cx="620" cy="150" r="86" fill="#ffdf9e" opacity="0.25" />
            <ellipse cx="180" cy="60" rx="70" ry="14" fill="#ffffff" opacity="0.18" />
            <ellipse cx="420" cy="40" rx="90" ry="12" fill="#ffffff" opacity="0.14" />
            <path d="M0 210 Q 130 170 260 200 T 520 195 T 800 205 V 260 H 0 Z" fill="#4a2545" opacity="0.55" />
            <path d="M0 228 Q 160 200 340 222 T 800 224 V 260 H 0 Z" fill="#2e1a3a" opacity="0.7" />
          </svg>
          <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.2em] opacity-80">SDG 3 · Good Health · PS-2Y-03</div>
              <h1 className="text-3xl sm:text-5xl font-light mt-2 leading-tight">Golden hour for<br /><span className="font-semibold">your wellbeing, {name.split(" ")[0]}</span></h1>
              <p className="text-sm opacity-85 mt-3 max-w-md">One calm check-in a day. Watch your habits paint the sky.</p>
              <div className="flex gap-2 mt-5">
                {(["today", "insights", "journal"] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t ? "bg-white text-[#7a2d4d] shadow-lg" : "bg-white/15 text-white hover:bg-white/25"}`}>
                    {t === "today" ? "☀ Today" : t === "insights" ? "📊 Insights" : "📔 Journal"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-4 text-center min-w-[96px]">
                <div className="text-3xl font-bold">{preview.wellnessScore}</div>
                <div className="text-[11px] opacity-80 mt-1">today&apos;s glow</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-4 text-center min-w-[96px]">
                <div className="text-3xl font-bold">{streak || "–"}</div>
                <div className="text-[11px] opacity-80 mt-1">day streak 🔥</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-4 text-center min-w-[96px] hidden sm:block">
                <div className="text-3xl font-bold">{avgScore}</div>
                <div className="text-[11px] opacity-80 mt-1">{range} avg</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ===== TAB: TODAY ===== */}
        {tab === "today" && (
          <div className="grid lg:grid-cols-2 gap-6 fade-in-up" key="today">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">How was today?</h2>
                <span className="text-xs text-[var(--muted)]">{todayISO()}</span>
              </div>
              <div className="space-y-7">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">🌙 Sleep <span className="text-xs text-[var(--muted)] font-normal ml-1">last night</span></label>
                    <span className="text-lg font-bold text-[#d4652e]">{sleep.toFixed(1)}<span className="text-xs font-normal">h</span></span>
                  </div>
                  <input type="range" min={0} max={12} step={0.5} value={sleep} onChange={e => setSleep(Number(e.target.value))} />
                  <div className="flex justify-between text-[11px] text-[var(--muted)] mt-1.5"><span>0h</span><span className="font-semibold text-[#d4652e]">7–9h golden zone</span><span>12h</span></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">🏃 Movement</label>
                    <span className="text-lg font-bold text-[#c98a2e]">{activity}<span className="text-xs font-normal"> min</span></span>
                  </div>
                  <input type="range" min={0} max={180} step={5} value={activity} onChange={e => setActivity(Number(e.target.value))} />
                  <div className="flex justify-between text-[11px] text-[var(--muted)] mt-1.5"><span>rest</span><span className="font-semibold text-[#c98a2e]">30–60 min</span><span>marathon</span></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">💧 Water</label>
                    <span className="text-lg font-bold text-[#9b304a]">{water.toFixed(1)}<span className="text-xs font-normal"> L</span></span>
                  </div>
                  <input type="range" min={0} max={5} step={0.1} value={water} onChange={e => setWater(Number(e.target.value))} />
                  <div className="flex justify-between text-[11px] text-[var(--muted)] mt-1.5"><span>0L</span><span className="font-semibold text-[#9b304a]">2–3L</span><span>5L</span></div>
                </div>
                <div>
                  <label className="text-sm font-medium">Mood at sunset</label>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {(["great", "good", "okay", "low"] as Mood[]).map(m => (
                      <button key={m} onClick={() => setMood(m)}
                        className={`rounded-2xl border-2 py-3 text-sm font-medium transition-all ${mood === m ? "border-[#d4652e] bg-[rgba(212,101,46,0.07)] text-[#7a2d1d]" : "border-[var(--border)] text-[var(--fg)] hover:border-[#e8a838]"}`}>
                        <span className="text-xl block">{m === "great" ? "😄" : m === "good" ? "🙂" : m === "okay" ? "😐" : "🌧️"}</span>
                        <span className="text-xs capitalize">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={saveToday}
                  className="w-full py-4 rounded-2xl font-semibold text-white text-sm tracking-wide transition-all active:scale-[0.98] hover:shadow-xl"
                  style={{ background: "linear-gradient(135deg,#d4652e,#e8a838)" }}>
                  {saved ? "✓ Saved to your journal" : "Save today's sunset →"}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: "linear-gradient(90deg,#e8a838,#d4652e,#9b304a)" }} />
                <div className="text-xs uppercase tracking-widest text-[var(--muted)] font-semibold">Live score</div>
                <div className="relative w-[170px] h-[170px] mx-auto mt-4">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e8a838" /><stop offset="100%" stopColor="#9b304a" /></linearGradient></defs>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f3e7db" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(preview.wellnessScore / 100) * 314} 314`} style={{ transition: "stroke-dasharray .7s ease" }} />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <div><div className="text-5xl font-light">{preview.wellnessScore}</div><div className="text-xs text-[var(--muted)] mt-1">{previewCls.emoji} {preview.wellnessLevel}</div></div>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] mt-4 leading-relaxed max-w-xs mx-auto">
                  {preview.wellnessScore >= 80 ? "Radiant. You're glowing like golden hour." : preview.wellnessScore >= 60 ? "Warm and steady — keep the rhythm." : preview.wellnessScore >= 40 ? "A little overcast. Small steps clear the sky." : "Cloudy today. Be gentle with yourself."}
                </p>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold mb-1">✨ Tonight&apos;s notes</h3>
                <p className="text-xs text-[var(--muted)] mb-4">Gentle suggestions, not medical advice.</p>
                <div className="space-y-3">
                  {preview.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--soft)]">
                      <div className="text-xl">{s.icon}</div>
                      <div><div className="text-sm font-semibold">{s.title}</div><div className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">{s.detail}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: INSIGHTS ===== */}
        {tab === "insights" && (
          <div className="space-y-6 fade-in-up" key="insights">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-light">Your sky, <b className="font-semibold">visualised</b></h2>
              <div className="flex gap-1.5">
                {(["7d", "14d", "30d"] as const).map(r => (
                  <button key={r} onClick={() => setRange(r)} className={`tab-btn text-xs font-semibold px-4 py-2 border border-[var(--border)] ${range === r ? "active" : "text-[var(--muted)]"}`}>{r.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="section-head">🌅 Score journey</h3>
                <p className="text-xs text-[var(--muted)] mb-3">Wellness over time</p>
                <div className="graph-box p-3"><LineChart data={displayLogs} /></div>
              </div>
              <div className="card p-6">
                <h3 className="section-head">🥗 Habit mix</h3>
                <p className="text-xs text-[var(--muted)] mb-3">Sleep · Move · Water per day (last 7)</p>
                <div className="graph-box p-3"><HabitBars data={displayLogs} /></div>
                <div className="flex justify-center gap-4 mt-3 text-[11px] text-[var(--muted)]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#d4652e" }} /> Sleep</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#e8a838" }} /> Move</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#9b304a" }} /> Water</span>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="section-head">🪞 Balance radar</h3>
                <p className="text-xs text-[var(--muted)] mb-3">Live shape of today&apos;s inputs</p>
                <div className="graph-box p-2"><RadarChart /></div>
              </div>
              <div className="card p-6">
                <h3 className="section-head">🍩 Level mix</h3>
                <p className="text-xs text-[var(--muted)] mb-3">Share of days per level ({range})</p>
                <div className="graph-box p-3"><LevelDonut /></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="section-head">🔥 21-day consistency map</h3>
              <p className="text-xs text-[var(--muted)] mb-4">Deeper orange = brighter day. Blank = not logged.</p>
              <Heatmap />
              <div className="flex justify-between mt-3 text-[11px] text-[var(--muted)]"><span>3 weeks ago</span><span>today</span></div>
            </div>
          </div>
        )}

        {/* ===== TAB: JOURNAL ===== */}
        {tab === "journal" && (
          <div className="grid lg:grid-cols-5 gap-6 fade-in-up" key="journal">
            <div className="lg:col-span-3 card overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="font-semibold">All sunsets <span className="text-xs font-normal text-[var(--muted)] ml-2">{logs.length} entries</span></h2>
                <button onClick={() => {
                  const csv = ["date,sleepHours,activityMinutes,waterLiters,mood,wellnessScore,wellnessLevel"].concat(logs.map(l => `${l.date},${l.sleepHours},${l.activityMinutes},${l.waterLiters},${l.mood},${l.wellnessScore},${l.wellnessLevel}`)).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `wellspring-${name.replace(/\s+/g, "_")}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }} className="text-xs border border-[var(--border)] px-4 py-2 rounded-xl hover:bg-[var(--soft)] transition-colors">⬇ CSV</button>
              </div>
              <div className="divide-y divide-[var(--border)] max-h-[440px] overflow-auto">
                {[...logs].sort((a, b) => b.date.localeCompare(a.date)).map(l => {
                  const c = classify(l.wellnessScore);
                  return (
                    <div key={l.date} className="history-row px-6 py-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl grid place-items-center text-white text-sm font-bold shrink-0" style={{ background: c.level === "Thriving" ? "linear-gradient(135deg,#e8a838,#d4652e)" : c.level === "Balanced" ? "linear-gradient(135deg,#f4c9a0,#e8a838)" : c.level === "Needs Attention" ? "#e5d5c3" : "linear-gradient(135deg,#9b304a,#5b2d4a)" }}>
                        {l.wellnessScore}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{l.date} <span className="font-normal text-[var(--muted)]">· {c.level}</span></div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">🌙 {l.sleepHours}h &nbsp; 🏃 {l.activityMinutes}m &nbsp; 💧 {l.waterLiters}L &nbsp; {c.emoji} {l.mood}</div>
                      </div>
                      <button onClick={() => deleteLog(l.date)} className="text-xs text-[var(--muted)] hover:text-[#9b304a] border border-[var(--border)] rounded-xl px-3 py-1.5 transition-colors shrink-0">Delete</button>
                    </div>
                  );
                })}
                {logs.length === 0 && <div className="p-10 text-center text-sm text-[var(--muted)]">No entries yet — go log your first sunset ☀</div>}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h3 className="section-head">👤 Profile</h3>
                <label className="text-xs text-[var(--muted)]">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="mt-1 mb-3 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#d4652e]" />
                <label className="text-xs text-[var(--muted)]">Course</label>
                <input value={course} onChange={e => setCourse(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#d4652e]" />
                <button onClick={() => { if (confirm("Clear all logs?")) { setLogs([]); localStorage.removeItem("ws_logs"); } }} className="mt-4 text-xs text-[#9b304a] border border-[var(--border)] rounded-xl px-4 py-2 hover:bg-[rgba(155,48,74,0.05)] transition-colors">Clear all data</button>
              </div>
              <div className="card p-6">
                <h3 className="section-head">🌇 About WellSpring</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">Student Wellness Assistant · <b className="text-[var(--fg)]">PS-2Y-03 · SDG 3</b>. Rule-based AI classifies your sleep, movement & hydration into a 0–100 glow score with gentle suggestions.</p>
                <div className="mt-4 rounded-2xl p-4 text-xs leading-relaxed" style={{ background: "rgba(212,101,46,0.07)", border: "1px solid rgba(212,101,46,0.18)", color: "#8a5a40" }}>
                  ⚠️ General wellbeing info only — not medical advice. Reach your campus health centre if unwell.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="text-center text-[11px] text-[var(--muted)]">Made for golden hours · Next.js + Tailwind · data stays on your device 🌅</div>
      </footer>
    </div>
  );
}
