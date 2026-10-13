import { useState, useEffect, useCallback } from "react";
import { TOPICS, MODULES, QUESTIONS, QBYID } from "./data.js";
import "./styles.css";

/* ============================================================
   MASTERY HELPERS
   ============================================================ */

const MASTER = 2; // correct twice in a row, no hint
const STORE_KEY = "stars-midterm1-v1";

const STAR_SCALE = [
  { c: "M", col: "#FF6B4A" }, { c: "K", col: "#FFA55C" }, { c: "G", col: "#FFD970" },
  { c: "F", col: "#FFF1C9" }, { c: "A", col: "#F3F6FF" }, { c: "B", col: "#BCD0FF" }, { c: "O", col: "#8DB0FF" },
];

function applyResult(p, correct, hinted) {
  const base = p || { s: 0, a: 0, c: 0, w: 0 };
  return {
    s: correct ? (hinted ? base.s : base.s + 1) : 0,
    a: base.a + 1,
    c: base.c + (correct ? 1 : 0),
    w: base.w + (correct ? 0 : 1),
  };
}

function topicStats(tid, progress) {
  const qs = QUESTIONS.filter((q) => q.t === tid);
  let pts = 0, attempted = 0, mastered = 0, wrong = 0;
  qs.forEach((q) => {
    const p = progress[q.id];
    if (p) {
      attempted++;
      pts += Math.min(p.s, MASTER);
      if (p.s >= MASTER) mastered++;
      wrong += p.w;
    }
  });
  return { total: qs.length, attempted, mastered, wrong, frac: pts / (qs.length * MASTER) };
}

function starFor(st) {
  if (!st.attempted) return { c: "", col: "#4B5573", name: "not started" };
  return STAR_SCALE[Math.min(6, Math.floor(st.frac * 7))];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sci(x) {
  if (x >= 0.01 && x < 10000) return x < 10 ? x.toPrecision(2) : Math.round(x).toLocaleString();
  const e = Math.floor(Math.log10(x));
  const m = x / Math.pow(10, e);
  const sup = String(e).split("").map((ch) => "⁰¹²³⁴⁵⁶⁷⁸⁹⁻"["0123456789-".indexOf(ch)]).join("");
  return `${m.toFixed(1)}×10${sup}`;
}

function classForT(T) {
  if (T >= 33000) return "O";
  if (T >= 10000) return "B";
  if (T >= 7300) return "A";
  if (T >= 6000) return "F";
  if (T >= 5300) return "G";
  if (T >= 3900) return "K";
  return "M";
}
const colForClass = (c) => (STAR_SCALE.find((s) => s.c === c) || STAR_SCALE[0]).col;

/* ============================================================
   VISUALS
   ============================================================ */


function SymbolTable() {
  const rows = [
    ["~", "about, to the order of magnitude (\"typical values are\")", "R☉ ~ 100 R_E"],
    ["≃", "about, within a factor of a few", "t ≃ 500 s"],
    ["≈", "approximated (a more precise value exists, not worth using)", "1 AU ≈ 1.5×10⁸ km"],
    ["=", "equal", "1 km = 10⁵ cm"],
    ["≡", "defined as / equivalent", "E_kin ≡ ½mv²"],
    ["∝", "proportional to (stresses a scaling)", "E_kin ∝ v²"],
  ];
  return (
    <figure className="fig">
      <div className="symtable">
        {rows.map(([s, m, e]) => (
          <div key={s}><span className="sym">{s}</span><span>{m}</span><span className="ex">{e}</span></div>
        ))}
      </div>
      <figcaption>"Not all signs are equal" (Lesson 3, slide 5).</figcaption>
    </figure>
  );
}

function EMBar() {
  const bands = [
    { n: "Radio", bg: "#454A78", where: "Ground" },
    { n: "Microwave", bg: "#57507F", where: "Mostly space" },
    { n: "Infrared", bg: "#8A4646", where: "Mostly space" },
    { n: "Visible", bg: "linear-gradient(90deg,#d0312d,#f28c28,#f6d32d,#3bb143,#1f75fe,#7a3dd8)", where: "Ground" },
    { n: "UV", bg: "#6447B5", where: "Space" },
    { n: "X-ray", bg: "#4766BD", where: "Space" },
    { n: "Gamma", bg: "#2E86C1", where: "Space" },
  ];
  return (
    <figure className="fig">
      <div className="em-arrows"><span>Longer wavelength, lower frequency, less energy</span><span>Shorter, higher, more</span></div>
      <div className="em-row">
        {bands.map((b) => (
          <div key={b.n} className="em-band" style={{ background: b.bg, flex: b.n === "Visible" ? 0.9 : 1 }}>
            <span>{b.n}</span>
          </div>
        ))}
      </div>
      <div className="em-row em-where">
        {bands.map((b) => (
          <div key={b.n} style={{ flex: b.n === "Visible" ? 0.9 : 1 }} className={b.where === "Ground" ? "ok" : ""}>{b.where}</div>
        ))}
      </div>
      <figcaption>Where telescopes for each band can work. The atmosphere's two open windows are radio and visible.</figcaption>
    </figure>
  );
}

function ParticlesTable() {
  const groups = [
    { h: "Quarks (matter)", items: ["up +2/3", "down −1/3", "charm", "strange", "top", "bottom"] },
    { h: "Leptons (matter)", items: ["electron −1", "muon", "tau", "e neutrino", "μ neutrino", "τ neutrino"] },
    { h: "Bosons (forces)", items: ["gluon: strong", "photon: EM", "W±, Z⁰: weak", "Higgs", "graviton? (hypothetical)"] },
  ];
  return (
    <figure className="fig">
      <div className="ptable">
        {groups.map((g) => (
          <div key={g.h}>
            <h4>{g.h}</h4>
            <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
      <figcaption>Proton = u u d (charge +1). Neutron = u d d (charge 0). Every particle has an antiparticle.</figcaption>
    </figure>
  );
}

function EnergyChain() {
  const steps = [
    ["Nuclear", "fusion in the Sun's core"],
    ["Thermal", "the Sun is hot (~6000 K)"],
    ["Electromagnetic", "sunlight crosses space"],
    ["Thermal", "the snow warms and melts"],
  ];
  return (
    <figure className="fig">
      <ol className="chain">
        {steps.map(([a, b], i) => (
          <li key={i}><strong>{a}</strong><span>{b}</span></li>
        ))}
      </ol>
      <figcaption>"The Sun melts the snow": one chain, four forms of energy.</figcaption>
    </figure>
  );
}

function FateLadder() {
  const rows = [
    ["below 0.08 M☉", "Brown dwarf (never fuses hydrogen)", 10, "#B5714B"],
    ["about 1 M☉", "Planetary nebula + white dwarf", 16, "#FFD970"],
    ["up to ~10 M☉", "Supernova + neutron star", 24, "#BCD0FF"],
    ["above ~10 M☉", "Supernova + black hole", 32, "#8DB0FF"],
  ];
  return (
    <figure className="fig night">
      <div className="fate">
        {rows.map(([m, out, d, col]) => (
          <div key={m} className="fate-row">
            <div className="fate-dot"><span style={{ width: d, height: d, background: col, boxShadow: `0 0 ${d / 2}px ${col}` }} /></div>
            <div className="fate-m">{m}</div>
            <div className="fate-out">{out}</div>
          </div>
        ))}
      </div>
      <figcaption>Fate is written in the (initial) mass.</figcaption>
    </figure>
  );
}

function ParallaxFig() {
  return (
    <figure className="fig night">
      <svg viewBox="0 0 520 270" role="img" aria-label="Parallax: Earth on opposite sides of its orbit sees a nearby star shift against distant background stars">
        {[[40, 22], [90, 40], [150, 18], [230, 30], [300, 14], [360, 38], [430, 20], [480, 44], [200, 50], [400, 52]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill="#C9D2E8" />
        ))}
        <ellipse cx="260" cy="215" rx="150" ry="26" fill="none" stroke="#5B6690" strokeDasharray="4 4" />
        <circle cx="260" cy="215" r="13" fill="#FFD970" style={{ filter: "drop-shadow(0 0 6px #FFD970)" }} />
        <text x="260" y="252" fill="#C9D2E8" fontSize="12" textAnchor="middle">Sun</text>
        <line x1="110" y1="215" x2="326" y2="14" stroke="#8DB0FF" strokeWidth="1.2" />
        <line x1="410" y1="215" x2="194" y2="14" stroke="#FF9F7A" strokeWidth="1.2" />
        <circle cx="110" cy="215" r="6" fill="#6FA8FF" />
        <circle cx="410" cy="215" r="6" fill="#6FA8FF" />
        <text x="110" y="240" fill="#C9D2E8" fontSize="12" textAnchor="middle">Earth in February</text>
        <text x="410" y="240" fill="#C9D2E8" fontSize="12" textAnchor="middle">Earth in August</text>
        <line x1="260" y1="215" x2="410" y2="215" stroke="#C9D2E8" strokeWidth="1" />
        <text x="335" y="208" fill="#C9D2E8" fontSize="11" textAnchor="middle">1 AU</text>
        <circle cx="260" cy="76" r="5" fill="#FFF1C9" />
        <text x="272" y="80" fill="#FFF1C9" fontSize="12">nearby star</text>
        <path d="M 247 88 Q 260 96 273 88" fill="none" stroke="#FFF1C9" strokeWidth="1.4" />
        <text x="260" y="112" fill="#FFF1C9" fontSize="12" textAnchor="middle">parallax angle</text>
        <circle cx="326" cy="14" r="3.5" fill="none" stroke="#8DB0FF" />
        <circle cx="194" cy="14" r="3.5" fill="none" stroke="#FF9F7A" />
      </svg>
      <figcaption>The nearby star appears at two different spots against the background. Closer star → bigger angle. d (pc) = 1 / p (arcsec).</figcaption>
    </figure>
  );
}

function SpectraFig() {
  const lines = [[434, "#7A3DD8"], [486, "#2BB3C0"], [657, "#E0312D"]];
  const pos = (l) => `${((l - 380) / 360) * 100}%`;
  const rainbow = "linear-gradient(90deg,#7a3dd8,#1f75fe,#2bb3c0,#3bb143,#f6d32d,#f28c28,#d0312d)";
  const Strip = ({ bg, children, label }) => (
    <div className="spec">
      <div className="spec-label">{label}</div>
      <div className="spec-bar" style={{ background: bg }}>{children}</div>
    </div>
  );
  return (
    <figure className="fig">
      <Strip label="Hot source alone: continuous" bg={rainbow} />
      <Strip label="Through cooler gas: absorption" bg={rainbow}>
        {lines.map(([l]) => <span key={l} className="spec-line" style={{ left: pos(l), background: "#0E1224" }} />)}
      </Strip>
      <Strip label="Gas alone, from the side: emission" bg="#0E1224">
        {lines.map(([l, c]) => <span key={l} className="spec-line" style={{ left: pos(l), background: c, boxShadow: `0 0 6px ${c}` }} />)}
      </Strip>
      <div className="spec-ticks"><span>380 nm</span><span>hydrogen: 434, 486, 657 nm</span><span>740 nm</span></div>
      <figcaption>Dark absorption lines and bright emission lines sit at the same wavelengths.</figcaption>
    </figure>
  );
}

function BlackBodySim() {
  const [T, setT] = useState(5800);
  const [logR, setLogR] = useState(0);
  const R = Math.pow(10, logR);
  const W = 520, H = 220, PAD = 30;
  const lmin = 100, lmax = 2000;
  const planck = (lnm, t) => 1 / (Math.pow(lnm, 5) * (Math.exp(1.4388e7 / (lnm * t)) - 1));
  const pts = (t) => {
    const out = [];
    for (let i = 0; i <= 160; i++) {
      const l = lmin + ((lmax - lmin) * i) / 160;
      out.push([l, planck(l, t)]);
    }
    return out;
  };
  const cur = pts(T), sun = pts(5800);
  const ymax = Math.max(...cur.map((p) => p[1]), ...sun.map((p) => p[1]));
  const X = (l) => PAD + ((l - lmin) / (lmax - lmin)) * (W - 2 * PAD);
  const Y = (v) => H - PAD - (v / ymax) * (H - 2 * PAD);
  const path = (arr) => arr.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ");
  const peak = 3e6 / T; // nm, from λ_max ≃ 0.3 cm / T
  const band = peak < 380 ? "ultraviolet" : peak <= 740 ? "visible" : "infrared";
  const cls = classForT(T);
  const L = R * R * Math.pow(T / 5800, 4);
  const size = R <= 0.05 ? "tiny, white-dwarf territory (lower left of the HR diagram)" : R >= 100 ? "enormous, supergiant territory (top of the HR diagram)" : R >= 10 ? "big, giant territory" : "similar to the Sun, the main-sequence range";
  const presets = [["Sun", 5800, 0], ["Betelgeuse", 3300, Math.log10(760)], ["Rigel", 12100, Math.log10(79)], ["White dwarf", 10000, -2]];
  return (
    <figure className="fig night">
      <div className="bb-head">
        <div className="bb-swatch" style={{ background: colForClass(cls), boxShadow: `0 0 22px ${colForClass(cls)}` }} />
        <div>
          <div className="bb-big">{T.toLocaleString()} K, class {cls}</div>
          <div className="bb-small">Peak λ ≈ 0.3 cm / {T.toLocaleString()} ≈ {Math.round(peak)} nm ({band})</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Black body spectrum for the chosen temperature compared with the Sun">
        <defs>
          <linearGradient id="vis" x1="0" x2="1">
            <stop offset="0" stopColor="#7a3dd8" /><stop offset="0.3" stopColor="#1f75fe" /><stop offset="0.5" stopColor="#3bb143" />
            <stop offset="0.7" stopColor="#f6d32d" /><stop offset="1" stopColor="#d0312d" />
          </linearGradient>
        </defs>
        <rect x={X(380)} y={PAD} width={X(740) - X(380)} height={H - 2 * PAD} fill="url(#vis)" opacity="0.22" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#5B6690" />
        <path d={path(sun)} fill="none" stroke="#FFD970" strokeDasharray="5 4" strokeWidth="1.5" />
        <path d={path(cur)} fill="none" stroke={colForClass(cls)} strokeWidth="2.5" />
        {peak >= lmin && peak <= lmax && <line x1={X(peak)} y1={PAD} x2={X(peak)} y2={H - PAD} stroke="#C9D2E8" strokeDasharray="2 3" />}
        {[200, 500, 1000, 1500, 2000].map((l) => (
          <text key={l} x={X(l)} y={H - 10} fill="#9AA5C4" fontSize="11" textAnchor="middle">{l} nm</text>
        ))}
        <text x={X(560)} y={PAD - 8} fill="#C9D2E8" fontSize="11" textAnchor="middle">visible</text>
        <text x={W - PAD} y={PAD + 4} fill="#FFD970" fontSize="11" textAnchor="end">dashed: the Sun (5800 K)</text>
      </svg>
      <label className="bb-ctl">
        <span>Surface temperature: {T.toLocaleString()} K</span>
        <input type="range" min="2500" max="30000" step="100" value={T} onChange={(e) => setT(+e.target.value)} />
      </label>
      <label className="bb-ctl">
        <span>Radius: {sci(R)} R☉</span>
        <input type="range" min="-2" max="3" step="0.05" value={logR} onChange={(e) => setLogR(+e.target.value)} />
      </label>
      <div className="bb-out">
        L / L☉ = (R/R☉)² × (T / 5800 K)⁴ = ({sci(R)})² × ({(T / 5800).toFixed(2)})⁴ ≈ <strong>{sci(L)}</strong>. Size: {size}.
      </div>
      <div className="bb-presets">
        {presets.map(([n, t, r]) => (
          <button key={n} onClick={() => { setT(t); setLogR(r); }}>{n}</button>
        ))}
      </div>
      <figcaption>Try it: double the temperature and watch L grow 16×; double the radius and it grows 4×. Preset radii are approximate real values, not from the slides.</figcaption>
    </figure>
  );
}

function HRSketch() {
  const W = 560, H = 360, L0 = 54, R0 = 16, T0 = 18, B0 = 46;
  const lt0 = Math.log10(40000), lt1 = Math.log10(2400);
  const X = (T) => L0 + ((lt0 - Math.log10(T)) / (lt0 - lt1)) * (W - L0 - R0);
  const Y = (L) => T0 + ((6 - Math.log10(L)) / 10) * (H - T0 - B0);
  const ms = [[35000, 2e5], [25000, 2e4], [15000, 1e3], [10000, 40], [8000, 10], [6500, 2.5], [5800, 1], [5000, 0.4], [4300, 0.15], [3700, 0.05], [3200, 0.01], [2800, 0.002]];
  const giants = [[5000, 60], [4600, 100], [4300, 180], [4000, 300], [3800, 500]];
  const sgs = [[20000, 2e5], [12000, 1.2e5], [7000, 1e5], [4500, 1e5], [3400, 7e4]];
  const wds = [[20000, 0.03], [15000, 0.01], [11000, 0.003], [8500, 0.001]];
  const radLine = (R) => {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const T = Math.pow(10, lt0 - ((lt0 - lt1) * i) / 30);
      const L = R * R * Math.pow(T / 5800, 4);
      if (L > 1e-4 && L < 1e6) pts.push(`${X(T).toFixed(1)},${Y(L).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const dot = (T, L, r, key) => {
    const c = colForClass(classForT(T));
    return <circle key={key} cx={X(T)} cy={Y(L)} r={r} fill={c} style={{ filter: `drop-shadow(0 0 3px ${c})` }} />;
  };
  const classes = [["O", 36000], ["B", 18000], ["A", 8600], ["F", 6600], ["G", 5650], ["K", 4600], ["M", 3150]];
  return (
    <figure className="fig night">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Schematic HR diagram: luminosity versus temperature, hot stars on the left">
        {[0.01, 1, 100].map((R) => (
          <g key={R}>
            <polyline points={radLine(R)} fill="none" stroke="#3E4870" strokeDasharray="4 4" />
          </g>
        ))}
        <text x={X(30000)} y={Y(0.01 * 0.01 * Math.pow(30000 / 5800, 4)) - 6} fill="#7D88AB" fontSize="10">R = 0.01 R☉</text>
        <text x={X(30000)} y={Y(Math.pow(30000 / 5800, 4)) - 6} fill="#7D88AB" fontSize="10">R = 1 R☉</text>
        <text x={X(9000)} y={Y(1e4 * Math.pow(9000 / 5800, 4)) + 14} fill="#7D88AB" fontSize="10">R = 100 R☉</text>
        <polyline points={ms.map(([t, l]) => `${X(t)},${Y(l)}`).join(" ")} fill="none" stroke="#2B3560" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        {ms.map(([t, l], i) => dot(t, l, 4, "m" + i))}
        {giants.map(([t, l], i) => dot(t, l, 6, "g" + i))}
        {sgs.map(([t, l], i) => dot(t, l, 8, "s" + i))}
        {wds.map(([t, l], i) => dot(t, l, 2.5, "w" + i))}
        <circle cx={X(5800)} cy={Y(1)} r="7" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x={X(5800) + 10} y={Y(1) + 4} fill="#FFFFFF" fontSize="12">Sun</text>
        <text x={X(15000)} y={Y(25)} fill="#C9D2E8" fontSize="12" transform={`rotate(24 ${X(15000)} ${Y(25)})`}>Main sequence</text>
        <text x={X(4300)} y={Y(1500)} fill="#C9D2E8" fontSize="12" textAnchor="middle">Giants</text>
        <text x={X(9000)} y={Y(5e5)} fill="#C9D2E8" fontSize="12" textAnchor="middle">Supergiants</text>
        <text x={X(14000)} y={Y(0.0012) + 16} fill="#C9D2E8" fontSize="12" textAnchor="middle">White dwarfs</text>
        <line x1={L0} y1={H - B0} x2={W - R0} y2={H - B0} stroke="#5B6690" />
        <line x1={L0} y1={T0} x2={L0} y2={H - B0} stroke="#5B6690" />
        {classes.map(([c, t]) => (
          <text key={c} x={X(t)} y={H - B0 + 16} fill={colForClass(c)} fontSize="13" fontWeight="700" textAnchor="middle">{c}</text>
        ))}
        {[30000, 10000, 5000, 3000].map((t) => (
          <text key={t} x={X(t)} y={H - B0 + 32} fill="#9AA5C4" fontSize="10" textAnchor="middle">{t.toLocaleString()} K</text>
        ))}
        {[[1e-4, "10⁻⁴"], [1e-2, "10⁻²"], [1, "1"], [1e2, "10²"], [1e4, "10⁴"], [1e6, "10⁶"]].map(([l, s]) => (
          <text key={s} x={L0 - 8} y={Y(l) + 4} fill="#9AA5C4" fontSize="10" textAnchor="end">{s}</text>
        ))}
        <text x={14} y={(H - B0) / 2} fill="#9AA5C4" fontSize="11" transform={`rotate(-90 14 ${(H - B0) / 2})`} textAnchor="middle">Luminosity (L☉)</text>
        <text x={(W + L0) / 2} y={H - 2} fill="#9AA5C4" fontSize="11" textAnchor="middle">Surface temperature: hotter to the LEFT</text>
      </svg>
      <figcaption>Dashed lines: constant radius. Cool but luminous → big (upper right). Hot but dim → small (lower left).</figcaption>
    </figure>
  );
}

function Timescales() {
  const rows = [
    ["Chemical burning (a Sun made of fuel)", 5e3, "background estimate"],
    ["Gravitational contraction (Helmholtz)", 3e7, "background estimate"],
    ["Darwin's Earth age (1859)", 3e8, "from the slides"],
    ["Sun's actual age", 4.6e9, "background"],
  ];
  const lo = 3, hi = 10.3;
  return (
    <figure className="fig">
      <div className="ts">
        {rows.map(([n, y, src]) => (
          <div key={n} className="ts-row">
            <div className="ts-name">{n}<span>{src}</span></div>
            <div className="ts-track"><div className="ts-bar" style={{ width: `${((Math.log10(y) - lo) / (hi - lo)) * 100}%` }} /><em>~{sci(y)} yr</em></div>
          </div>
        ))}
      </div>
      <figcaption>Log scale: each step right is 10× longer. Only nuclear fusion reaches the billions of years needed.</figcaption>
    </figure>
  );
}

const VISUALS = { symbols: SymbolTable, em: EMBar, particles: ParticlesTable, energy: EnergyChain, fate: FateLadder, parallax: ParallaxFig, spectra: SpectraFig, bb: BlackBodySim, hr: HRSketch, timescales: Timescales };

/* ============================================================
   SESSIONS
   ============================================================ */

function buildSession(mode, arg, progress) {
  const st = (id) => progress[id] || null;
  const unmastered = (q) => !st(q.id) || st(q.id).s < MASTER;
  let ids = [], label = "";
  if (mode === "smart") {
    const pool = QUESTIONS.filter(unmastered);
    const missed = shuffle(pool.filter((q) => st(q.id) && st(q.id).w > 0 && st(q.id).s === 0));
    const fresh = pool.filter((q) => !st(q.id));
    const half = shuffle(pool.filter((q) => st(q.id) && !missed.includes(q) && st(q.id).s < MASTER));
    ids = [...missed, ...half, ...fresh].map((q) => q.id);
    label = "Smart review: all topics, misses first";
  } else if (mode === "topic") {
    const qs = QUESTIONS.filter((q) => q.t === arg);
    const pool = qs.filter(unmastered);
    ids = shuffle(pool.length ? pool : qs).map((q) => q.id);
    label = `Topic: ${TOPICS.find((t) => t.id === arg).title}`;
  } else if (mode === "weak") {
    const ranked = TOPICS.map((t) => ({ t, s: topicStats(t.id, progress) }))
      .filter((x) => x.s.attempted > 0 && x.s.frac < 1)
      .sort((a, b) => a.s.frac - b.s.frac)
      .slice(0, 3)
      .map((x) => x.t.id);
    ids = shuffle(QUESTIONS.filter((q) => ranked.includes(q.t) && unmastered(q))).map((q) => q.id);
    label = "Weak spots: your three lowest topics";
  } else if (mode === "missed") {
    ids = shuffle(QUESTIONS.filter((q) => st(q.id) && st(q.id).w > 0 && st(q.id).s < MASTER)).map((q) => q.id);
    label = "Questions you've missed";
  } else if (mode === "exam") {
    const picks = [];
    TOPICS.forEach((t) => picks.push(...shuffle(QUESTIONS.filter((q) => q.t === t.id)).slice(0, 2)));
    ids = shuffle(picks).slice(0, 20).map((q) => q.id);
    label = "Exam simulation: 20 questions, no hints";
  }
  return advance({ mode, label, queue: ids, cur: null, order: [], chosen: null, hinted: false, showHint: false, n: 0, right: 0, total: ids.length, exam: [], done: false });
}

function advance(s) {
  if (!s.queue.length) return { ...s, cur: null, done: true, chosen: null };
  const [cur, ...rest] = s.queue;
  const q = QBYID[cur];
  const idx = q.o.map((_, i) => i);
  return { ...s, cur, queue: rest, order: q.fixed ? idx : shuffle(idx), chosen: null, hinted: false, showHint: false };
}

/* ============================================================
   LEARN VIEW
   ============================================================ */

function StarDot({ st, size = 12 }) {
  const s = starFor(st);
  return (
    <span className="stardot" aria-hidden="true">
      <span style={{ width: size, height: size, background: s.col, boxShadow: st.attempted ? `0 0 ${size / 1.5}px ${s.col}` : "none" }} />
    </span>
  );
}

function Learn({ progress, moduleId, setModuleId, startTopic, firstRun }) {
  const idx = TOPICS.findIndex((t) => t.id === moduleId);
  return (
    <div className="learn">
      <nav className="rail" aria-label="Topics">
        {TOPICS.map((t) => (
          <button key={t.id} className={t.id === moduleId ? "on" : ""} onClick={() => setModuleId(t.id)}>
            <StarDot st={topicStats(t.id, progress)} />
            <span>{t.title}</span>
          </button>
        ))}
        <button className={moduleId === "recall" ? "on" : ""} onClick={() => setModuleId("recall")}>
          <span className="stardot"><span style={{ width: 12, height: 12, background: "transparent", border: "1.5px solid #9AA5C4" }} /></span>
          <span>Key numbers: test your recall</span>
        </button>
      </nav>
      <article className="lesson">
        {firstRun && (
          <p className="howto">
            Read a topic, then press <em>Practice this topic</em>. A question is mastered once you answer it correctly twice in a row without a hint. Missed questions keep coming back until you do. Your progress saves in this browser, on this device.
          </p>
        )}
        {moduleId === "recall" ? <Recall /> : <Lesson t={TOPICS[idx]} startTopic={startTopic} next={TOPICS[idx + 1]} setModuleId={setModuleId} />}
      </article>
    </div>
  );
}

function Lesson({ t, startTopic, next, setModuleId }) {
  const m = MODULES[t.id];
  const V = m.visual ? VISUALS[m.visual] : null;
  const n = QUESTIONS.filter((q) => q.t === t.id).length;
  return (
    <>
      <h2 className="lesson-title">{t.title}</h2>
      <p className="src">From {t.src}</p>
      <div className="prose">
        {m.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {V && <V />}
      <aside className="picture">
        <h3>Picture it</h3>
        <p>{m.picture}</p>
      </aside>
      <h3 className="sub">Numbers and facts to know</h3>
      <dl className="facts">
        {m.facts.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <h3 className="sub">Common traps</h3>
      <ul className="traps">{m.traps.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <div className="lesson-actions">
        <button className="btn" onClick={() => startTopic(t.id)}>Practice this topic ({n} questions)</button>
        {next && <button className="btn ghost" onClick={() => setModuleId(next.id)}>Next: {next.short}</button>}
      </div>
    </>
  );
}

function Recall() {
  const [shown, setShown] = useState({});
  const all = TOPICS.flatMap((t) => MODULES[t.id].facts.map(([k, v]) => ({ t: t.short, k, v, id: t.id + k })));
  const allShown = all.every((f) => shown[f.id]);
  return (
    <>
      <h2 className="lesson-title">Key numbers: test your recall</h2>
      <p className="src">Say each answer out loud before you reveal it. Every fact from every topic is here.</p>
      <div className="lesson-actions" style={{ marginTop: 0 }}>
        <button className="btn ghost" onClick={() => setShown(allShown ? {} : Object.fromEntries(all.map((f) => [f.id, true])))}>
          {allShown ? "Hide all answers" : "Reveal all answers"}
        </button>
      </div>
      {TOPICS.map((t) => (
        <section key={t.id} className="recall-group">
          <h3 className="sub">{t.title}</h3>
          <dl className="facts">
            {all.filter((f) => f.t === t.short).map((f) => (
              <div key={f.id}>
                <dt>{f.k}</dt>
                <dd>
                  {shown[f.id] ? f.v : <button className="reveal" onClick={() => setShown({ ...shown, [f.id]: true })}>Reveal</button>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}

/* ============================================================
   PRACTICE VIEW
   ============================================================ */

/* "Explain it another way" talks to /api/explain (a Vercel function).
   The button only appears if that function exists and has an API key. */
let aiStatusPromise = null;
function aiAvailable() {
  if (!aiStatusPromise) {
    aiStatusPromise = fetch("/api/explain")
      .then((r) => (r.ok && (r.headers.get("content-type") || "").includes("json") ? r.json() : { enabled: false }))
      .then((d) => Boolean(d && d.enabled))
      .catch(() => false);
  }
  return aiStatusPromise;
}

function ExplainAgain({ q, chosen }) {
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState("idle");
  useEffect(() => {
    let live = true;
    aiAvailable().then((ok) => live && setEnabled(ok));
    return () => { live = false; };
  }, []);
  const ask = async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/explain?qid=${encodeURIComponent(q.id)}&chosen=${chosen}`);
      const data = await res.json();
      if (!res.ok || !data.text) throw new Error(data.error || "empty");
      setText(data.text);
      setState("done");
    } catch (e) {
      setState("error");
    }
  };
  if (!enabled) return null;
  if (state === "done") return <div className="again"><h4>Another way to see it</h4><p>{text}</p></div>;
  return (
    <div className="again-row">
      <button className="btn ghost small" onClick={ask} disabled={state === "loading"}>
        {state === "loading" ? "Writing a new explanation…" : "Explain it another way"}
      </button>
      {state === "error" && <span className="err">The explanation didn't load. Try again in a moment.</span>}
    </div>
  );
}

function Practice({ progress, setProgress, session, setSession, goLearn }) {
  const s = session;
  const q = s && s.cur ? QBYID[s.cur] : null;

  const answer = useCallback((i) => {
    if (!s || s.chosen !== null || !q) return;
    const correct = i === q.a;
    const hinted = s.hinted && s.mode !== "exam";
    const nextP = applyResult(progress[q.id], correct, hinted);
    setProgress((pr) => ({ ...pr, [q.id]: applyResult(pr[q.id], correct, hinted) }));
    if (s.mode === "exam") {
      setSession(advance({ ...s, n: s.n + 1, right: s.right + (correct ? 1 : 0), exam: [...s.exam, { id: q.id, chosen: i, correct }] }));
      return;
    }
    const queue = [...s.queue];
    if (nextP.s < MASTER) queue.splice(Math.min(correct ? 6 : 3, queue.length), 0, q.id);
    setSession({ ...s, chosen: i, queue, n: s.n + 1, right: s.right + (correct ? 1 : 0) });
  }, [s, q, progress, setProgress, setSession]);

  const next = useCallback(() => s && setSession(advance(s)), [s, setSession]);

  useEffect(() => {
    const onKey = (e) => {
      if (!s || s.done || !q) return;
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (s.chosen === null) {
        const d = parseInt(e.key, 10);
        if (d >= 1 && d <= s.order.length) answer(s.order[d - 1]);
        if (e.key === "h" && s.mode !== "exam") setSession({ ...s, hinted: true, showHint: true });
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s, q, answer, next, setSession]);

  if (!s) return <PracticeMenu progress={progress} start={(m, a) => setSession(buildSession(m, a, progress))} />;

  if (s.done) {
    return (
      <div className="practice">
        {s.mode === "exam" ? (
          <ExamReview s={s} />
        ) : (
          <>
            <h2 className="lesson-title">{s.total ? "Round complete" : "Nothing left to practice here"}</h2>
            <p className="prose-ui">
              {s.total
                ? `Every question in this set is now mastered. You answered ${s.n} times and got ${s.right} right along the way.`
                : "Every question in this set is already mastered. Pick another mode, or run an exam simulation to check yourself."}
            </p>
          </>
        )}
        <div className="lesson-actions">
          <button className="btn" onClick={() => setSession(null)}>Choose what to practice next</button>
        </div>
      </div>
    );
  }

  const p = progress[q.id];
  const topic = TOPICS.find((t) => t.id === q.t);
  const remaining = new Set([s.cur, ...s.queue]).size;
  const isRight = s.chosen === q.a;

  return (
    <div className="practice">
      <div className="session-bar">
        <span>{s.label}</span>
        <span>{s.mode === "exam" ? `Question ${s.n + 1} of ${s.total}` : `${remaining} left to master in this round`}</span>
        <button className="linkish" onClick={() => setSession(null)}>End session</button>
      </div>
      <p className="qmeta">
        {topic.short}
        {p && s.mode !== "exam" ? `. Your streak on this one: ${Math.min(p.s, MASTER)} of ${MASTER}.` : s.mode !== "exam" ? ". New question." : ""}
      </p>
      <h2 className="qtext">{q.q}</h2>
      <div className="opts" role="group" aria-label="Answer options">
        {s.order.map((oi, k) => {
          let cls = "opt";
          if (s.chosen !== null) {
            if (oi === q.a) cls += " right";
            else if (oi === s.chosen) cls += " wrong";
            else cls += " dim";
          }
          return (
            <button key={oi} className={cls} onClick={() => answer(oi)} disabled={s.chosen !== null}>
              <span className="key">{k + 1}</span>
              <span>{q.o[oi]}</span>
            </button>
          );
        })}
      </div>

      {s.chosen === null && s.mode !== "exam" && (
        <div className="hint-row">
          {s.showHint ? (
            <p className="hint">Hint: {q.h}<span> This attempt won't count toward mastery.</span></p>
          ) : (
            <button className="linkish" onClick={() => setSession({ ...s, hinted: true, showHint: true })}>Show a hint (H)</button>
          )}
        </div>
      )}

      {s.chosen !== null && (
        <div className={`feedback ${isRight ? "is-right" : "is-wrong"}`} aria-live="polite">
          <h3>{isRight ? (s.hinted ? "Correct, with a hint" : "Correct") : "Not quite"}</h3>
          {!isRight && (
            <p>
              You chose <strong>{q.o[s.chosen]}</strong>. {q.w && q.w[s.chosen] ? q.w[s.chosen] : ""}
            </p>
          )}
          {!isRight && <p>The answer is <strong>{q.o[q.a]}</strong>.</p>}
          <p>{q.why}</p>
          {!isRight && <p className="note">This one will come back in a few questions.</p>}
          {isRight && s.hinted && <p className="note">Hinted answers don't raise your streak. It will come back.</p>}
          {!isRight && <ExplainAgain key={q.id + s.n} q={q} chosen={s.chosen} />}
          <div className="lesson-actions">
            <button className="btn" onClick={next} autoFocus>Next question (Enter)</button>
            <button className="btn ghost" onClick={() => goLearn(q.t)}>Review this lesson</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PracticeMenu({ progress, start }) {
  const [topic, setTopic] = useState(TOPICS[0].id);
  const anyAttempt = Object.keys(progress).length > 0;
  const missedCount = QUESTIONS.filter((q) => progress[q.id] && progress[q.id].w > 0 && progress[q.id].s < MASTER).length;
  const modes = [
    { m: "smart", h: "Smart review", d: "Every topic mixed together. Your misses come first, then new questions. It keeps asking until each one is answered right twice in a row without a hint.", go: "Start smart review" },
    { m: "weak", h: "Drill my weak spots", d: anyAttempt ? "Only the unmastered questions from your three lowest-scoring topics." : "Answer a few questions first so there's something to measure.", go: "Drill weak spots", off: !anyAttempt },
    { m: "missed", h: "Redo questions I've missed", d: missedCount ? `${missedCount} questions you've gotten wrong and haven't mastered yet.` : "No missed questions waiting right now.", go: "Redo missed questions", off: !missedCount },
    { m: "exam", h: "Exam simulation", d: "20 questions across all topics. No hints and no feedback until the end, like the real midterm.", go: "Start the exam simulation" },
  ];
  return (
    <div className="practice">
      <h2 className="lesson-title">What do you want to practice?</h2>
      <div className="modes">
        <div className="mode">
          <h3>Drill one topic</h3>
          <p>Best right after reading a lesson.</p>
          <div className="row">
            <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Choose a topic">
              {TOPICS.map((t) => {
                const st = topicStats(t.id, progress);
                return <option key={t.id} value={t.id}>{t.title} ({st.mastered}/{st.total} mastered)</option>;
              })}
            </select>
            <button className="btn" onClick={() => start("topic", topic)}>Drill this topic</button>
          </div>
        </div>
        {modes.map((x) => (
          <div key={x.m} className={`mode ${x.off ? "off" : ""}`}>
            <h3>{x.h}</h3>
            <p>{x.d}</p>
            <button className="btn" disabled={x.off} onClick={() => start(x.m)}>{x.go}</button>
          </div>
        ))}
      </div>
      <p className="kbd-note">Keyboard: press 1–4 to answer, H for a hint, Enter for the next question.</p>
    </div>
  );
}

function ExamReview({ s }) {
  const pct = Math.round((100 * s.right) / s.total);
  const wrong = s.exam.filter((e) => !e.correct);
  const byTopic = {};
  wrong.forEach((e) => { const t = QBYID[e.id].t; byTopic[t] = (byTopic[t] || 0) + 1; });
  const worst = Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => TOPICS.find((x) => x.id === t).short);
  return (
    <>
      <h2 className="lesson-title">You scored {s.right} of {s.total} ({pct}%)</h2>
      <p className="prose-ui">
        {wrong.length === 0
          ? "A clean sheet. Run it again tomorrow to make sure it sticks."
          : `Topics to revisit: ${worst.join(", ")}. Every miss below has been reset in your progress, so it will show up in smart review.`}
      </p>
      <ol className="review">
        {s.exam.map((e, i) => {
          const q = QBYID[e.id];
          return (
            <li key={i} className={e.correct ? "ok" : "bad"}>
              <p className="rq">{q.q}</p>
              <p>{e.correct ? "Correct: " : "You chose: "}<strong>{q.o[e.chosen]}</strong></p>
              {!e.correct && <p>Answer: <strong>{q.o[q.a]}</strong>. {q.w && q.w[e.chosen] ? q.w[e.chosen] : ""}</p>}
              <p className="why">{q.why}</p>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ============================================================
   PROGRESS VIEW
   ============================================================ */

function Progress({ progress, setProgress, startMode, startTopic, goLearn }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const stats = TOPICS.map((t) => ({ t, s: topicStats(t.id, progress) }));
  const masteredQ = QUESTIONS.filter((q) => progress[q.id] && progress[q.id].s >= MASTER).length;
  const weak = stats.filter((x) => x.s.attempted > 0 && x.s.frac < 1).sort((a, b) => a.s.frac - b.s.frac).slice(0, 4);
  const untouched = stats.filter((x) => x.s.attempted === 0);
  const missed = QUESTIONS.filter((q) => progress[q.id] && progress[q.id].w > 0)
    .sort((a, b) => (progress[a.id].s - progress[b.id].s) || (progress[b.id].w - progress[a.id].w))
    .slice(0, 12);
  return (
    <div className="progress">
      <section className="sky" aria-label="Mastery by topic">
        <h2>Your sky</h2>
        <p>Each topic is a star. It heats up from a cool red M star to a blazing blue O star as you master it, the same O B A F G K M sequence you need for the exam.</p>
        <div className="stars">
          {stats.map(({ t, s }) => {
            const star = starFor(s);
            const d = 18 + 3 * Math.sqrt(s.total);
            return (
              <button key={t.id} className="star" onClick={() => goLearn(t.id)} aria-label={`${t.title}: ${Math.round(s.frac * 100)}% mastered`}>
                <span className="orb" style={{ width: d, height: d, background: star.col, boxShadow: s.attempted ? `0 0 ${d * 0.9}px ${star.col}` : "none" }} />
                <span className="sname">{t.short}</span>
                <span className="sval">{s.attempted ? `class ${star.c}, ${Math.round(s.frac * 100)}%` : "not started"}</span>
              </button>
            );
          })}
        </div>
        <div className="legend"><span>just started</span><span className="legend-strip" /><span>mastered</span></div>
      </section>

      <p className="summary">
        {masteredQ} of {QUESTIONS.length} questions mastered. Mastered means answered correctly twice in a row without a hint.
      </p>

      <section>
        <h3 className="sub">Your weak spots</h3>
        {weak.length === 0 ? (
          <p className="empty">
            {Object.keys(progress).length === 0
              ? "No answers yet, so no weak spots to show. Read the first lesson, then practice it."
              : "Every topic you've started is fully mastered. Start a new topic or run an exam simulation."}
          </p>
        ) : (
          <div className="weak">
            {weak.map(({ t, s }) => {
              const star = starFor(s);
              return (
                <div key={t.id} className="weak-row">
                  <div className="weak-name">{t.title}<span>{s.mastered} of {s.total} mastered, {s.wrong} wrong answers so far</span></div>
                  <div className="bar"><span style={{ width: `${Math.max(4, s.frac * 100)}%`, background: star.col, boxShadow: `0 0 10px ${star.col}` }} /></div>
                  <div className="weak-act">
                    <button className="btn small" onClick={() => startTopic(t.id)}>Drill</button>
                    <button className="btn ghost small" onClick={() => goLearn(t.id)}>Review lesson</button>
                  </div>
                </div>
              );
            })}
            <button className="btn" onClick={() => startMode("weak")}>Drill all my weak spots</button>
          </div>
        )}
        {untouched.length > 0 && Object.keys(progress).length > 0 && (
          <p className="empty">Not started yet: {untouched.map((x) => x.t.short).join(", ")}.</p>
        )}
      </section>

      {missed.length > 0 && (
        <section>
          <h3 className="sub">Questions you've missed</h3>
          <div className="missed">
            {missed.map((q) => (
              <details key={q.id}>
                <summary>
                  <span>{q.q}</span>
                  <em>{progress[q.id].s >= MASTER ? "now mastered" : `missed ${progress[q.id].w}×`}</em>
                </summary>
                <p>Answer: <strong>{q.o[q.a]}</strong></p>
                <p>{q.why}</p>
              </details>
            ))}
          </div>
          <button className="btn" onClick={() => startMode("missed")}>Redo missed questions</button>
        </section>
      )}

      <section className="reset">
        {confirmReset ? (
          <>
            <span>This erases all your answers and mastery. Continue?</span>
            <button className="btn danger small" onClick={() => { setProgress({}); setConfirmReset(false); }}>Erase progress</button>
            <button className="btn ghost small" onClick={() => setConfirmReset(false)}>Keep it</button>
          </>
        ) : (
          <button className="linkish" onClick={() => setConfirmReset(true)}>Reset all progress</button>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */

function countdownText() {
  const exam = new Date(2026, 9, 14);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((exam - today) / 86400000);
  if (days > 1) return `Midterm on Wednesday, October 14, in class: ${days} days to go`;
  if (days === 1) return "Midterm tomorrow, Wednesday, October 14, in class";
  if (days === 0) return "Midterm today. Do one last smart review and trust your prep.";
  return "Midterm 1 is done. Your progress here still counts toward the final.";
}

function loadSaved() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const d = JSON.parse(raw);
    return d && typeof d === "object" ? d : {};
  } catch (e) {
    return {}; // private browsing or corrupted data: start fresh
  }
}

export default function App() {
  const saved = useState(loadSaved)[0];
  const [view, setView] = useState("learn");
  const [progress, setProgress] = useState(saved.p || {});
  const [moduleId, setModuleId] = useState(saved.m && (saved.m === "recall" || MODULES[saved.m]) ? saved.m : TOPICS[0].id);
  const [session, setSession] = useState(null);
  const [saveErr, setSaveErr] = useState(false);
  const loaded = true;

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify({ p: progress, m: moduleId }));
        setSaveErr(false);
      } catch (e) {
        setSaveErr(true);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [progress, moduleId]);

  const startTopic = (tid) => { setSession(buildSession("topic", tid, progress)); setView("practice"); };
  const startMode = (m) => { setSession(buildSession(m, null, progress)); setView("practice"); };
  const goLearn = (tid) => { setModuleId(tid); setView("learn"); window.scrollTo && window.scrollTo(0, 0); };

  return (
    <div className="sm">
      <div className="strip" aria-hidden="true" />
      <header>
        <div>
          <h1>Stars, Midterm 1</h1>
          <p className="count">{countdownText()}</p>
        </div>
        <nav className="tabs" aria-label="Sections">
          {[["learn", "Learn"], ["practice", "Practice"], ["progress", "Progress"]].map(([v, l]) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)} aria-current={view === v ? "page" : undefined}>{l}</button>
          ))}
        </nav>
      </header>
      {saveErr && <p className="save-err">This browser isn't letting the site save progress (private browsing can cause this). Your answers still count until you close the tab.</p>}
      {!loaded ? (
        <p className="loading">Loading your progress…</p>
      ) : view === "learn" ? (
        <Learn progress={progress} moduleId={moduleId} setModuleId={(id) => { setModuleId(id); window.scrollTo && window.scrollTo(0, 0); }} startTopic={startTopic} firstRun={Object.keys(progress).length === 0} />
      ) : view === "practice" ? (
        <Practice progress={progress} setProgress={setProgress} session={session} setSession={setSession} goLearn={goLearn} />
      ) : (
        <Progress progress={progress} setProgress={setProgress} startMode={startMode} startTopic={startTopic} goLearn={goLearn} />
      )}
    </div>
  );
}
