/**
 * MIKAEL OS — Personal OS dashboard-plugin surface (Phase 1 shell).
 * ================================================================
 *
 * A dedicated full-screen personal operating surface for Mikael, delivered as a
 * Nous Hermes *dashboard plugin* (not inside FSM, not a second task database).
 *
 * Phase 1 goal (per the V3 "Command Constellation" build handoff): render a
 * faithful, interactive full-screen private surface — photographic atmosphere
 * layer, a spatial JARVIS energy-orb, a ring of orbiting domain modules with
 * constellation connectors, a glass Focus-Lens, a command bar, and a Jarvis
 * state-rail — WITHOUT touching FSM or the host. All values here are CONCEPT
 * DATA / fixtures — explicitly badged in the UI and never presented as live
 * truth. Real read models (mission.v2 / job_projection / task_priority_preview,
 * WHOOP, calendar, Rise-L, company signals) arrive in Phase 2.
 *
 * Three deliberate render layers (spec):
 *   1. Atmosphere  — the photographic night-city background (CSS layer), very
 *      slow parallax on pointer move; OFF under prefers-reduced-motion. No
 *      text/data ever sits directly on the noisy photo — only on glass.
 *   2. Spatial     — the JARVIS orb + energy waves + orbit particles, painted to
 *      a <canvas> (decorative, aria-hidden). Adaptive: the rAF loop pauses on a
 *      hidden tab and renders a single static frame under reduced motion.
 *   3. Product UI  — semantic React/DOM for every card, button, status and
 *      command. Glass via backdrop-filter in three tiers (base / raised / focus).
 *
 * Contract with the host (see web/src/plugins/registry.ts::exposePluginSDK and
 * usePlugins.ts): the host injects this bundle as a <script>, having first set
 * window.__HERMES_PLUGIN_SDK__ (React, hooks, UI primitives, auth'd fetch) and
 * window.__HERMES_PLUGINS__ (register). We pull React off the SDK — nothing is
 * bundled — and register the root component under the manifest name "mikael-os".
 * This is the exact pattern the checked-in kanban / hermes-achievements bundles
 * use; this file is compiled to that same IIFE shape by Vite (see vite.config.js).
 */

import { ICONS } from "./icons.js";
import "./styles.css";

const SDK = typeof window !== "undefined" ? window.__HERMES_PLUGIN_SDK__ : undefined;
const React = SDK && SDK.React;
const H = (SDK && SDK.hooks) || {};
const useState = H.useState || (() => [undefined, () => {}]);
const useEffect = H.useEffect || (() => {});
const useRef = H.useRef || (() => ({ current: null }));
const useCallback = H.useCallback || ((fn) => fn);
const useMemo = H.useMemo || ((fn) => (typeof fn === "function" ? fn() : fn));

const h = React ? React.createElement : () => null;

// ---------------------------------------------------------------------------
// Icon — renders an authentic lucide glyph from the inlined geometry map with
// the standard lucide 24x24 stroke wrapper. Decorative unless given a label.
// (The host SDK does not expose a lucide component surface, so we inline the
// paths exactly like the hermes-achievements plugin does.)
// ---------------------------------------------------------------------------
function Icon(props) {
  const { name, size = 20, className = "", label } = props;
  const inner = ICONS[name] || ICONS.circle;
  const decorative = !label;
  return h("span", {
    className: "mos__icon " + className,
    style: { width: size, height: size },
    role: decorative ? undefined : "img",
    "aria-label": decorative ? undefined : label,
    "aria-hidden": decorative ? "true" : undefined,
    dangerouslySetInnerHTML: {
      __html:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>",
    },
  });
}

// ---------------------------------------------------------------------------
// Concept fixtures — DEMO ONLY. Structure mirrors the eventual PersonalOSModule
// contract (id/workspace/title/icon/accent/summary/pos) so Phase 2 can swap
// fixtures for typed read-model projections without touching the renderer.
// `pos` = centre of the node as a percentage of the constellation stage; this
// is what reproduces the reference ring composition and what drag mutates.
// ---------------------------------------------------------------------------
const MODULES = [
  { id: "today", title: "Heute", icon: "sun", accent: "cyan", meta: "9 Ereignisse", pos: { x: 25, y: 13 } },
  { id: "tasks", title: "Aufgaben & Ziele", icon: "target", accent: "emerald", meta: "7 aktiv · 3 heute", pos: { x: 46, y: 6 } },
  { id: "learning", title: "Lernplan", icon: "graduation-cap", accent: "violet", meta: "3 Lektionen fällig", pos: { x: 65, y: 13 } },
  { id: "risel", title: "Rise-L Prozesse", icon: "server", accent: "amber", meta: "5 Workflows aktiv", pos: { x: 85, y: 20 } },
  { id: "travel", title: "Reisen", icon: "plane", accent: "cyan", meta: "Rom · 18. Jun", pos: { x: 89, y: 39 } },
  { id: "nutrition", title: "Ernährung", icon: "leaf", accent: "emerald", meta: "2.105 kcal", pos: { x: 89, y: 57 } },
  { id: "company", title: "Firma-Signale", icon: "building-2", accent: "neutral", meta: "Nur lesen", readOnly: true, pos: { x: 85, y: 74 } },
  { id: "kalender", title: "Kalender", icon: "calendar-days", accent: "cyan", meta: "Nächster · 10:30", pos: { x: 12, y: 31 } },
  { id: "body", title: "Körper / WHOOP", icon: "heart-pulse", accent: "emerald", meta: "Recovery 82%", pos: { x: 9, y: 50 } },
  { id: "journal", title: "Journal", icon: "notebook-pen", accent: "cyan", meta: "1 Eintrag heute", pos: { x: 13, y: 68 } },
];

// Focus-Lens payloads (keyed by module id, plus the "engineering" home lens the
// reference shows by default). Rows reuse one generic renderer.
const LENS = {
  engineering: {
    icon: "code-xml", accent: "cyan", title: "Engineering / Codex", sub: "Fokus-Linse · 4 Missionen",
    source: "GitHub", freshness: "vor 7 Min", permission: "Lesen & Schreiben",
    rows: [
      { icon: "rocket", accent: "emerald", title: "Feature: KI Fokus-Modus", sub: "Sprint 42 · Frontend", status: "running", statusLabel: "Läuft", value: "68 %" },
      { icon: "lock", accent: "amber", title: "API: Permissions Service", sub: "Backend · Sicherheit", status: "waiting", statusLabel: "Wartet auf Review", value: "—" },
      { icon: "circle-check-big", accent: "cyan", title: "Refactor: Workspace Core", sub: "Architektur", status: "verified", statusLabel: "Verifiziert", value: "100 %" },
      { icon: "flask-round", accent: "emerald", title: "Test Suite: E2E Stabilität", sub: "Qualitätssicherung", status: "running", statusLabel: "Läuft", value: "24 %" },
    ],
  },
  today: {
    icon: "sun", accent: "cyan", title: "Heute", sub: "Tagesplan · 9 Ereignisse",
    source: "Kalender", freshness: "vor 2 Min", permission: "Nur lesen",
    rows: [
      { icon: "sun", accent: "cyan", title: "Morning Light & Bewegung", sub: "20 Min · Tagesstart", value: "07:30" },
      { icon: "brain", accent: "emerald", title: "Strategy Deep Work", sub: "90 Min · Fokus", value: "09:00" },
      { icon: "target", accent: "violet", title: "Leadership Sync", sub: "45 Min · Team", value: "12:30" },
      { icon: "plane", accent: "cyan", title: "Kunden-Call · Projekt A", sub: "60 Min", value: "16:30" },
    ],
  },
  tasks: {
    icon: "target", accent: "emerald", title: "Aufgaben & Ziele", sub: "7 aktiv · 3 heute fällig",
    source: "Personal OS", freshness: "vor 5 Min", permission: "Lesen & Schreiben",
    rows: [
      { icon: "circle-check-big", accent: "emerald", title: "Strategie Review", sub: "Diese Woche", status: "running", statusLabel: "Läuft", value: "60 %" },
      { icon: "circle-check-big", accent: "amber", title: "Team Alignment", sub: "Diese Woche", status: "waiting", statusLabel: "Wartet", value: "30 %" },
      { icon: "circle-check-big", accent: "violet", title: "Produkt Roadmap", sub: "Nächste Woche", value: "10 %" },
    ],
  },
  learning: {
    icon: "graduation-cap", accent: "violet", title: "Lernplan", sub: "3 Lektionen fällig",
    source: "Lern-Skills", freshness: "vor 1 Std", permission: "Nur lesen",
    rows: [
      { icon: "book-open", accent: "violet", title: "Deep Work Playbook", sub: "Fortschritt", status: "running", statusLabel: "Läuft", value: "68 %" },
      { icon: "graduation-cap", accent: "cyan", title: "Nächste Lektion", sub: "Heute · 20 Min", value: "—" },
      { icon: "sparkles", accent: "violet", title: "Wiederholung: Systemdenken", sub: "Fällig", value: "—" },
    ],
  },
  risel: {
    icon: "server", accent: "amber", title: "Rise-L Prozesse", sub: "5 Workflows aktiv",
    source: "systemd --user", freshness: "07:15", permission: "Nur lesen",
    rows: [
      { icon: "server", accent: "emerald", title: "Systeme online", sub: "Alle Kernsysteme stabil", status: "verified", statusLabel: "Verifiziert", value: "OK" },
      { icon: "activity", accent: "amber", title: "Mail-Sync · Dispatch-Pulse", sub: "Letzter Lauf heute", value: "5" },
      { icon: "clock", accent: "cyan", title: "Letzter Check", sub: "Heute", value: "07:15" },
    ],
  },
  travel: {
    icon: "plane", accent: "cyan", title: "Reisen", sub: "Nächste Reise · Rom",
    source: "Reiseplan", freshness: "vor 3 Std", permission: "Nur lesen",
    rows: [
      { icon: "plane", accent: "cyan", title: "Rom · Städtereise", sub: "Abflug 18. Jun · 08:20", value: "3 T" },
      { icon: "map", accent: "emerald", title: "Hotel bestätigt", sub: "Trastevere", status: "verified", statusLabel: "Verifiziert", value: "OK" },
      { icon: "clock", accent: "amber", title: "Check-in öffnet", sub: "17. Jun", value: "—" },
    ],
  },
  nutrition: {
    icon: "leaf", accent: "emerald", title: "Ernährung", sub: "Heute · 2.105 kcal",
    source: "Ernährungs-Log", freshness: "vor 40 Min", permission: "Lesen & Schreiben",
    rows: [
      { icon: "utensils", accent: "emerald", title: "Protein", sub: "Ziel 160 g", status: "running", statusLabel: "Läuft", value: "142 g" },
      { icon: "leaf", accent: "cyan", title: "Wasser", sub: "Ziel 3 L", value: "2,1 L" },
      { icon: "activity", accent: "amber", title: "Koffein", sub: "Letzte Tasse 14:00", value: "2×" },
    ],
  },
  company: {
    icon: "building-2", accent: "neutral", title: "Firma-Signale", sub: "Nur lesen · Approval-Cards",
    source: "Delta-Tor", freshness: "vor 12 Min", permission: "Nur lesen",
    rows: [
      { icon: "activity", accent: "emerald", title: "Team Momentum", sub: "Auslastung stabil", status: "verified", statusLabel: "Stark", value: "" },
      { icon: "message-square", accent: "cyan", title: "Stakeholder Feedback", sub: "360 Feedback", value: "Positiv" },
      { icon: "shield-check", accent: "amber", title: "Risiko Radar", sub: "Keine Eskalation", value: "Niedrig" },
    ],
  },
  kalender: {
    icon: "calendar-days", accent: "cyan", title: "Kalender / Route", sub: "Nächster Termin · 10:30",
    source: "Kalender", freshness: "vor 2 Min", permission: "Nur lesen",
    rows: [
      { icon: "target", accent: "cyan", title: "Leadership Sync", sub: "Team-Update", value: "10:30" },
      { icon: "brain", accent: "emerald", title: "Strategie Review", sub: "Q2 Planung", value: "14:00" },
      { icon: "plane", accent: "amber", title: "Kunden-Call · Projekt A", sub: "Anfahrt 36 Min · Leichtverkehr", value: "16:30" },
    ],
  },
  body: {
    icon: "heart-pulse", accent: "emerald", title: "Körper / WHOOP", sub: "Recovery 82% · Gut",
    source: "WHOOP", freshness: "Stand 06:12", permission: "Nur lesen",
    rows: [
      { icon: "heart-pulse", accent: "emerald", title: "Recovery", sub: "Bereit für hohe Belastung", status: "verified", statusLabel: "Gut", value: "82 %" },
      { icon: "moon", accent: "cyan", title: "Schlaf", sub: "Erholsam", value: "7 h 26 m" },
      { icon: "activity", accent: "amber", title: "Ruhepuls · Belastung", sub: "48 bpm · Strain 32", value: "+12 %" },
    ],
  },
  journal: {
    icon: "notebook-pen", accent: "cyan", title: "Journal", sub: "1 Eintrag heute",
    source: "Journal", freshness: "vor 6 Std", permission: "Lesen & Schreiben",
    rows: [
      { icon: "notebook-pen", accent: "cyan", title: "Wie fühlt sich Fokus heute an?", sub: "Sprach- oder Text-Eintrag", value: "—" },
      { icon: "audio-lines", accent: "violet", title: "Voice-Memo", sub: "Heute 06:40", value: "0:48" },
    ],
  },
};

const LENS_TOOLS = [
  { icon: "folder-open", label: "Öffnen" },
  { icon: "panels-top-left", label: "Details" },
  { icon: "message-square", label: "Kommentare" },
  { icon: "share-2", label: "Handover" },
  { icon: "ellipsis", label: "Mehr" },
];

const CHIPS = [
  { icon: "sparkles", label: "Beispiele" },
  { icon: "target", label: "Öffne Fokus-Modus" },
  { icon: "clock", label: "Plane Deep Work um 09:00" },
  { icon: "graduation-cap", label: "Zeige meinen Lernplan" },
];

// State-rail: the Jarvis conversational lifecycle. `tone` colours the active dot.
const STATES = [
  { id: "ready", icon: "circle", label: "Bereit", tone: "ready" },
  { id: "listening", icon: "ear", label: "Hört zu", tone: "ready" },
  { id: "thinking", icon: "brain", label: "Denkt", tone: "ready" },
  { id: "suggest", icon: "lightbulb", label: "Vorschlag", tone: "amber" },
  { id: "executing", icon: "zap", label: "Ausführung", tone: "amber" },
  { id: "verified", icon: "circle-check-big", label: "Verifiziert", tone: "verified" },
];

const WORKSPACES = [
  { id: "private", label: "Privat" },
  { id: "engineering", label: "Engineering" },
  { id: "company_signal", label: "Firma-Signale" },
];

function prefersReducedMotion() {
  try {
    return typeof window !== "undefined" && window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { return false; }
}

// ---------------------------------------------------------------------------
// Spatial layer — the JARVIS orb painted to a <canvas>: a glowing plasma core,
// three phase-shifted energy-wave bands, an orbiting particle field and a
// low-amplitude pulse. Decorative + aria-hidden. The rAF loop pauses when the
// tab is hidden and collapses to a single static frame under reduced motion.
// ---------------------------------------------------------------------------
function Orb() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    let raf = 0;
    let running = true;

    // stable particle field — points of light distributed across the sphere
    const particles = [];
    for (let i = 0; i < 68; i++) {
      particles.push({
        ang: Math.random() * Math.PI * 2,
        rad: 0.18 + Math.random() * 0.78,
        spd: (0.12 + Math.random() * 0.45) * (Math.random() < 0.5 ? 1 : -1),
        size: 0.5 + Math.random() * 1.3,
        tilt: 0.34 + Math.random() * 0.5,
      });
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const s = Math.max(rect.width, 1);
      canvas.width = s * dpr;
      canvas.height = s * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return s;
    }
    let size = resize();

    function draw(t) {
      const w = size, hgt = size;
      const cx = w / 2, cy = hgt / 2;
      const pulse = reduce ? 0.5 : Math.sin(t * 0.0011) * 0.5 + 0.5;
      const R = (w / 2) * (0.9 + pulse * 0.02);
      const R0 = R * 0.82; // sphere radius
      ctx.clearRect(0, 0, w, hgt);

      // --- outer bloom halo: two stacked additive glows for a soft volumetric
      //     falloff well beyond the sphere edge (luminous, not a hard disc) ---
      ctx.globalCompositeOperation = "lighter";
      const bloom = ctx.createRadialGradient(cx, cy, R0 * 0.35, cx, cy, R * 1.18);
      bloom.addColorStop(0, "rgba(70,180,255," + (0.32 + pulse * 0.06) + ")");
      bloom.addColorStop(0.42, "rgba(48,140,235,0.16)");
      bloom.addColorStop(0.72, "rgba(34,96,190,0.07)");
      bloom.addColorStop(1, "rgba(8,20,40,0)");
      ctx.fillStyle = bloom;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // --- core sphere: deep navy body with a bright plasma hotspot sitting a
      //     touch below centre, matching the reference's luminous underglow ---
      const body = ctx.createRadialGradient(cx, cy - R0 * 0.1, R0 * 0.1, cx, cy, R0);
      body.addColorStop(0, "rgba(40,120,205,0.55)");
      body.addColorStop(0.55, "rgba(20,64,130,0.5)");
      body.addColorStop(0.85, "rgba(11,34,74,0.42)");
      body.addColorStop(1, "rgba(6,16,34,0.06)");
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.fill();

      // clip everything luminous to the sphere and composite additively so the
      // core, surface points and wave ribbon read as layered light.
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.clip();
      ctx.globalCompositeOperation = "lighter";

      // faint latitude arcs — give the sphere a globe structure without clutter
      for (let i = 0; i < 3; i++) {
        const yy = cy + (i - 1) * R0 * 0.42;
        const rw = Math.sqrt(Math.max(0, R0 * R0 - (yy - cy) * (yy - cy)));
        ctx.beginPath();
        ctx.ellipse(cx, yy, rw, Math.max(rw * 0.14, 2), 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(96,165,225,0.09)";
        ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.stroke();
      }

      // bright plasma hotspot — sits low in the sphere so the upper body stays
      // deep navy (depth), the underglow reads as luminous energy welling up.
      const plasma = ctx.createRadialGradient(cx, cy + R0 * 0.2, R0 * 0.02, cx, cy + R0 * 0.16, R0 * 0.66);
      plasma.addColorStop(0, "rgba(206,246,255," + (0.8 + pulse * 0.06) + ")");
      plasma.addColorStop(0.24, "rgba(112,208,255,0.5)");
      plasma.addColorStop(0.58, "rgba(52,144,232,0.2)");
      plasma.addColorStop(1, "rgba(20,60,130,0)");
      ctx.fillStyle = plasma;
      ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.fill();

      // surface point field (stars of light drifting over the sphere)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const a = p.ang + (reduce ? 0 : t * 0.0004 * p.spd);
        const rx = R0 * 0.96 * p.rad;
        const px = cx + Math.cos(a) * rx;
        const py = cy + Math.sin(a) * rx * p.tilt;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(178,236,255," + (0.2 + (1 - p.rad) * 0.4) + ")";
        ctx.fill();
      }

      // energy-wave ribbon — three near-parallel cyan lines, same base frequency
      // with small phase offsets, so they read as one coherent luminous waveform
      // through the lower-centre of the sphere (not a criss-cross net).
      const wavePhase = reduce ? 0.6 : t * 0.0015;
      const waveFreq = 2.2, waveAmp = R * 0.13, waveY = cy + R0 * 0.15;
      const waveAt = (x) => {
        const nx = x / R;
        return Math.sin(nx * Math.PI * waveFreq + wavePhase) * Math.cos(nx * 1.1);
      };
      for (let b = 0; b < 3; b++) {
        const amp = waveAmp * (1 - b * 0.16);
        const yoff = waveY + (b - 1) * R * 0.045;
        const phase = wavePhase + b * 0.5;
        ctx.beginPath();
        for (let x = -R; x <= R; x += 3) {
          const nx = x / R;
          const y = yoff + Math.sin(nx * Math.PI * waveFreq + phase) * amp * Math.cos(nx * 1.1);
          if (x === -R) ctx.moveTo(cx + x, y); else ctx.lineTo(cx + x, y);
        }
        ctx.strokeStyle = "rgba(158,232,255," + (0.6 - b * 0.16) + ")";
        ctx.lineWidth = 2.4 - b * 0.6;
        ctx.shadowColor = "rgba(96,210,255,0.9)";
        ctx.shadowBlur = 16 - b * 3;
        ctx.stroke();
      }
      ctx.restore();

      // escaping energy tails — the primary waveform bleeds past the sphere edge
      // as fading cyan tendrils reaching toward the handoff pills (ref signature).
      ctx.globalCompositeOperation = "lighter";
      for (let dir = -1; dir <= 1; dir += 2) {
        const g = ctx.createLinearGradient(cx + dir * R0 * 0.9, 0, cx + dir * R, 0);
        g.addColorStop(0, "rgba(150,228,255,0.55)");
        g.addColorStop(1, "rgba(120,205,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(96,210,255,0.8)"; ctx.shadowBlur = 8;
        ctx.beginPath();
        let first = true;
        for (let s = 0; s <= 1.0001; s += 0.04) {
          const x = dir * (R0 * 0.9 + s * (R - R0 * 0.9));
          const y = waveY + waveAt(x) * waveAmp;
          if (first) { ctx.moveTo(cx + x, y); first = false; } else ctx.lineTo(cx + x, y);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;

      // rim highlight — a thin luminous meniscus around the sphere edge, brighter
      // along the lower arc where the plasma wells up (crisper spherical read).
      ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(150,220,255," + (0.3 + pulse * 0.14) + ")";
      ctx.lineWidth = 1.4; ctx.shadowColor = "rgba(96,205,255,0.6)"; ctx.shadowBlur = 8; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R0, Math.PI * 0.12, Math.PI * 0.88);
      ctx.strokeStyle = "rgba(180,238,255," + (0.5 + pulse * 0.22) + ")";
      ctx.lineWidth = 1.8; ctx.shadowColor = "rgba(120,220,255,0.9)"; ctx.shadowBlur = 12; ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function loop(t) {
      if (!running) return;
      draw(t);
      raf = window.requestAnimationFrame(loop);
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        running = false;
        if (raf) window.cancelAnimationFrame(raf);
      } else if (!reduce && !running) {
        running = true;
        raf = window.requestAnimationFrame(loop);
      }
    }
    function onResize() { size = resize(); if (reduce) draw(600); }

    if (reduce) {
      draw(600); // one static, settled frame
    } else {
      raf = window.requestAnimationFrame(loop);
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    return () => {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return h(
    "div",
    { className: "mos__orb", "aria-hidden": "true" },
    h("canvas", { ref: canvasRef, className: "mos__orb-canvas" }),
    h("span", { className: "mos__orb-label" }, "JARVIS"),
    h("button", { type: "button", className: "mos__orb-mic", "aria-label": "Sprachbefehl starten (Demo)", tabIndex: -1 },
      h(Icon, { name: "mic", size: 18 })),
  );
}

// Constellation connectors — faint curved lines from the orb to every module.
// Pure decoration; recomputed from live positions so drag keeps the web intact.
function Connectors(props) {
  const ox = 50, oy = 27;
  return h(
    "svg",
    { className: "mos__connectors", "aria-hidden": "true", viewBox: "0 0 100 100", preserveAspectRatio: "none" },
    props.modules.map((m) => {
      const midX = (ox + m.pos.x) / 2;
      const midY = (oy + m.pos.y) / 2 - 4;
      const d = "M " + ox + " " + oy + " Q " + midX + " " + midY + " " + m.pos.x + " " + m.pos.y;
      const on = props.focusId === m.id;
      return h("path", {
        key: m.id,
        d,
        className: "mos__connector" + (on ? " is-active" : ""),
        vectorEffect: "non-scaling-stroke",
        fill: "none",
      });
    }),
  );
}

// A single orbiting domain module — button (click → focus) with a drag handle,
// wrapped in a decorative orbit halo. Position comes from state so it can move.
function ModuleNode(props) {
  const m = props.module;
  return h(
    "div",
    {
      className: "mos__nodewrap mos--" + m.accent + (props.active ? " is-active" : "") + (props.dragging ? " is-dragging" : ""),
      style: { left: m.pos.x + "%", top: m.pos.y + "%" },
    },
    h(
      "span",
      { className: "mos__orbitring", "aria-hidden": "true" },
      h("span", { className: "mos__sat mos__sat--a" }),
      h("span", { className: "mos__sat mos__sat--b" }),
    ),
    h(
      "span",
      { className: "mos__orbitring mos__orbitring--2", "aria-hidden": "true" },
      h("span", { className: "mos__sat mos__sat--c" }),
    ),
    h(
      "button",
      {
        type: "button",
        className: "mos__node",
        "aria-current": props.active ? "true" : undefined,
        "aria-label": m.title + " öffnen",
        onPointerDown: (e) => props.onPointerDown(e, m.id),
        onClick: () => props.onActivate(m.id),
      },
      h("span", { className: "mos__node-orbit" }, h(Icon, { name: m.icon, size: 22 })),
      h(
        "span",
        { className: "mos__node-body" },
        h("span", { className: "mos__node-title" }, m.title),
        h("span", { className: "mos__node-meta" }, m.meta),
        m.readOnly &&
          h("span", { className: "mos__node-readonly" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen"),
      ),
      h("span", { className: "mos__node-grip", "aria-hidden": "true" }, h(Icon, { name: "grip-vertical", size: 14 })),
    ),
  );
}

function LensRow(props) {
  const r = props.row;
  return h(
    "div",
    { className: "mos__mission mos--" + (r.accent || "cyan") },
    h("span", { className: "mos__mission-idx" }, String(props.index)),
    h("span", { className: "mos__mission-icon" }, h(Icon, { name: r.icon, size: 18 })),
    h(
      "span",
      { className: "mos__mission-body" },
      h("span", { className: "mos__mission-title" }, r.title),
      h("span", { className: "mos__mission-sub" }, r.sub),
    ),
    r.status
      ? h(
          "span",
          { className: "mos__status mos__status--" + r.status },
          r.status === "verified" && h(Icon, { name: "circle-check-big", size: 13 }),
          r.status === "waiting" && h(Icon, { name: "clock", size: 13 }),
          r.statusLabel,
        )
      : h("span", { className: "mos__status-spacer" }),
    h("span", { className: "mos__mission-pct" }, r.value),
  );
}

function FocusLens(props) {
  const data = LENS[props.focusId] || LENS.engineering;
  const closable = props.focusId !== "engineering";
  return h(
    "section",
    { className: "mos__lens", "aria-label": "Fokus-Linse: " + data.title, key: props.focusId },
    h(
      "header",
      { className: "mos__lens-head" },
      h("span", { className: "mos__lens-badge mos--" + data.accent }, h(Icon, { name: data.icon, size: 22 })),
      h(
        "span",
        { className: "mos__lens-titles" },
        h("span", { className: "mos__lens-title" }, data.title),
        h("span", { className: "mos__lens-sub" }, data.sub),
      ),
      h(
        "span",
        { className: "mos__lens-actions" },
        h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Anheften" }, h(Icon, { name: "pin", size: 18 })),
        h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Einklappen" }, h(Icon, { name: "chevron-up", size: 18 })),
        h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Weitere Optionen" }, h(Icon, { name: "ellipsis", size: 18 })),
        closable &&
          h("button", { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Fokus schließen", onClick: props.onClose },
            h(Icon, { name: "x", size: 18 })),
      ),
    ),
    h(
      "div",
      { className: "mos__lens-body" },
      data.rows.map((r, i) => h(LensRow, { key: r.title, row: r, index: i + 1 })),
    ),
    h(
      "footer",
      { className: "mos__lens-foot" },
      h("span", { className: "mos__meta" }, h(Icon, { name: "git-branch", size: 14 }), "Quelle: ", h("b", null, data.source)),
      h("span", { className: "mos__meta" }, h(Icon, { name: "clock", size: 14 }), "Aktualität: ", h("b", null, data.freshness)),
      h("span", { className: "mos__meta" }, h(Icon, { name: "shield-check", size: 14 }), "Berechtigung: ", h("b", null, data.permission)),
      h("span", { className: "mos__lens-foot-shield" }, h(Icon, { name: "shield-check", size: 18, label: "Berechtigungen geprüft" })),
    ),
    h(
      "div",
      { className: "mos__lens-tools" },
      LENS_TOOLS.map((tl) =>
        h("button", { key: tl.label, type: "button", className: "mos__tool" }, h(Icon, { name: tl.icon, size: 15 }), tl.label)),
    ),
  );
}

function TopBar(props) {
  return h(
    "header",
    { className: "mos__topbar" },
    h(
      "div",
      { className: "mos__identity" },
      h("span", { className: "mos__avatar", "aria-hidden": "true" }, "M"),
      h(
        "span",
        null,
        h("span", { className: "mos__identity-name" }, "Mikael"),
        h("span", { className: "mos__identity-sub" }, "Privates System"),
      ),
    ),
    h("div", { className: "mos__wordmark" }, "MIKAEL OS"),
    h(
      "div",
      { className: "mos__topright" },
      h(
        "span",
        { className: "mos__concept", title: "Alle angezeigten Werte sind Konzeptdaten (Phase 1). Keine Live-Wahrheit." },
        h(Icon, { name: "flask-conical", size: 14 }),
        "Konzeptdaten",
      ),
      h(
        "span",
        { className: "mos__topchip" },
        h(Icon, { name: "cloud-moon", size: 16 }),
        h("strong", null, "22°"),
        " Klar",
      ),
      h(
        "span",
        { className: "mos__topchip mos__topchip-time" },
        h("b", null, "22:30"),
        h("span", null, "Do, 22. Mai · Berliner Zeit"),
      ),
      h("button", { type: "button", className: "mos__shieldbtn", "aria-label": "Privatsphäre & Berechtigungen" }, h(Icon, { name: "shield-check", size: 20 })),
    ),
  );
}

function WorkspaceSwitcher(props) {
  return h(
    "div",
    { className: "mos__workspace", role: "group", "aria-label": "Workspace wechseln" },
    h("span", { className: "mos__workspace-label" }, "Workspace"),
    WORKSPACES.map((w) =>
      h(
        "button",
        {
          key: w.id,
          type: "button",
          className: "mos__ws-tab",
          "aria-pressed": props.active === w.id ? "true" : "false",
          onClick: () => props.onChange(w.id),
        },
        w.label,
      )),
  );
}

function StateRail(props) {
  return h(
    "div",
    { className: "mos__states", role: "list", "aria-label": "Jarvis-Zustand" },
    STATES.map((s, i) =>
      h(
        "span",
        {
          key: s.id,
          className: "mos__state",
          role: "listitem",
          "data-active": i === props.activeIndex ? "true" : "false",
          "data-passed": i < props.activeIndex ? "true" : "false",
          "data-tone": s.tone,
        },
        h("span", { className: "mos__state-dot", "aria-hidden": "true" }),
        s.label,
      )),
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
function MikaelOS() {
  const [workspace, setWorkspace] = useState("private");
  const [modules, setModules] = useState(MODULES);
  const [focusId, setFocusId] = useState("engineering");
  const [stateIndex, setStateIndex] = useState(0);
  const [command, setCommand] = useState("");

  const stageRef = useRef(null);
  const inputRef = useRef(null);
  const dragRef = useRef(null);
  const timersRef = useRef([]);
  const [dragId, setDragId] = useState(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  // Demo state-machine — drive Bereit→…→Verifiziert. Explicitly a demonstration:
  // no real receipt exists, so "Ausführung/Verifiziert" here are visual only.
  const runStateSequence = useCallback(() => {
    clearTimers();
    if (prefersReducedMotion()) { setStateIndex(STATES.length - 1); return; }
    const steps = [1, 2, 3, 4, 5];
    steps.forEach((s, i) => {
      timersRef.current.push(window.setTimeout(() => setStateIndex(s), (i + 1) * 750));
    });
    timersRef.current.push(window.setTimeout(() => setStateIndex(0), (steps.length + 2) * 750));
  }, [clearTimers]);

  const activate = useCallback((id) => { setFocusId(id); setStateIndex(1); }, []);
  const closeFocus = useCallback(() => { setFocusId("engineering"); setStateIndex(0); }, []);

  // Pointer drag to reorder nodes; distinguishes a click (focus) from a drag by
  // a small movement threshold so both gestures share the same target.
  const onNodePointerDown = useCallback((e, id) => {
    if (e.button != null && e.button !== 0) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, rect, moved: false };
    try { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); } catch (_e) {}
  }, []);

  useEffect(() => {
    function onMove(e) {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < 5) return;
      if (!d.moved) { d.moved = true; setDragId(d.id); }
      const nx = Math.max(4, Math.min(96, ((e.clientX - d.rect.left) / d.rect.width) * 100));
      const ny = Math.max(4, Math.min(96, ((e.clientY - d.rect.top) / d.rect.height) * 100));
      setModules((prev) => prev.map((m) => (m.id === d.id ? { ...m, pos: { x: nx, y: ny } } : m)));
    }
    function onUp() {
      const d = dragRef.current;
      dragRef.current = null;
      if (d && d.moved) { setDragId(null); }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Keyboard: ⌘K/Ctrl-K command mode, 1–9 focus a module, Esc close, arrows cycle.
  useEffect(() => {
    function onKey(e) {
      const k = e.key;
      if ((e.metaKey || e.ctrlKey) && (k === "k" || k === "K")) {
        e.preventDefault();
        if (inputRef.current) inputRef.current.focus();
        return;
      }
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (k === "Escape" && inputRef.current) inputRef.current.blur();
        return;
      }
      if (k === "Escape") { closeFocus(); return; }
      if (k >= "1" && k <= "9") {
        const idx = parseInt(k, 10) - 1;
        if (modules[idx]) activate(modules[idx].id);
        return;
      }
      if (k === "ArrowRight" || k === "ArrowLeft") {
        const ids = modules.map((m) => m.id);
        const cur = ids.indexOf(focusId);
        const next = cur === -1
          ? (k === "ArrowRight" ? 0 : ids.length - 1)
          : (cur + (k === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
        activate(ids[next]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modules, focusId, activate, closeFocus]);

  // Very slow atmosphere parallax on pointer move (skipped under reduced motion).
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = stageRef.current && stageRef.current.closest(".mos");
    if (!root) return;
    function onMove(e) {
      const px = (e.clientX / window.innerWidth - 0.5);
      const py = (e.clientY / window.innerHeight - 0.5);
      root.style.setProperty("--mos-par-x", (px * -14).toFixed(2) + "px");
      root.style.setProperty("--mos-par-y", (py * -10).toFixed(2) + "px");
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const submit = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    runStateSequence();
    setCommand("");
  }, [runStateSequence]);

  return h(
    "div",
    { className: "mos" },
    h("div", { className: "mos__atmosphere", "aria-hidden": "true" }),
    h("div", { className: "mos__atmosphere-veil", "aria-hidden": "true" }),
    h(
      "div",
      { className: "mos__shell" },
      h(TopBar, null),
      h(
        "div",
        { className: "mos__stagewrap" },
        h(WorkspaceSwitcher, { active: workspace, onChange: setWorkspace }),
        h(
          "div",
          { className: "mos__stage", ref: stageRef },
          h(Connectors, { modules: modules, focusId: focusId }),
          // orbiting module nodes
          modules.map((m) =>
            h(ModuleNode, {
              key: m.id,
              module: m,
              active: focusId === m.id,
              dragging: dragId === m.id,
              onActivate: activate,
              onPointerDown: onNodePointerDown,
            })),
          // core: orb + handoff chips
          h(
            "div",
            { className: "mos__core" },
            h(
              "div",
              { className: "mos__core-row" },
              h(
                "span",
                { className: "mos__handoff" },
                h("span", { className: "mos__handoff-k" }, "Übergabe von"),
                h(Icon, { name: "orbit", size: 16 }),
                h("b", null, "Jarvis"),
              ),
              h(Orb, null),
              h(
                "span",
                { className: "mos__handoff" },
                h("span", { className: "mos__handoff-k" }, "Übergabe an"),
                h(Icon, { name: "git-branch", size: 16 }),
                h("b", null, "Codex / Claude"),
              ),
            ),
          ),
          // focus lens
          h(
            "div",
            { className: "mos__lens-slot" },
            h(FocusLens, { focusId: focusId, onClose: closeFocus }),
          ),
          // add-module affordance (bottom-left of stage)
          h(
            "button",
            { type: "button", className: "mos__addmodule" },
            h("span", { className: "mos__addmodule-plus" }, h(Icon, { name: "circle-plus", size: 18 })),
            "Modul hinzufügen",
          ),
        ),
      ),
      // command bar + chips
      h(
        "form",
        { className: "mos__command", onSubmit: submit },
        h(
          "div",
          { className: "mos__command-bar" },
          h("button", { type: "button", className: "mos__mic", "aria-label": "Sprachbefehl starten" }, h(Icon, { name: "mic", size: 22 })),
          h("input", {
            ref: inputRef,
            className: "mos__command-input",
            type: "text",
            "aria-label": "Befehl eingeben",
            placeholder: 'Sage „Jarvis“ oder schreibe einen Befehl …',
            value: command,
            onChange: (e) => setCommand(e.target.value),
          }),
          h("button", { type: "submit", className: "mos__send", "aria-label": "Senden" }, h(Icon, { name: "send-horizontal", size: 18 })),
        ),
        h(
          "div",
          { className: "mos__chips" },
          CHIPS.map((c) =>
            h("button", { key: c.label, type: "button", className: "mos__chip", onClick: () => { setCommand(c.label); if (inputRef.current) inputRef.current.focus(); } },
              h(Icon, { name: c.icon, size: 14 }), c.label)),
        ),
      ),
      // footer: quick access · state rail · reorder hint
      h(
        "footer",
        { className: "mos__footer" },
        h(
          "button",
          { type: "button", className: "mos__quick" },
          h(Icon, { name: "layout-grid", size: 16 }), "Schnellzugriffe", h(Icon, { name: "chevron-up", size: 14 }),
        ),
        h(StateRail, { activeIndex: stateIndex }),
        h(
          "span",
          { className: "mos__reorder" },
          h(Icon, { name: "grip-vertical", size: 14 }),
          "Ziehen um neu zu ordnen",
          h("span", { className: "mos__kbd" }, h(Icon, { name: "command", size: 12 }), "K · Kurzbefehle"),
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Register with the host — identical contract to the kanban / achievements
// template bundles. No-op (and no crash) if loaded without the host SDK.
// ---------------------------------------------------------------------------
if (SDK && React && typeof window !== "undefined" && window.__HERMES_PLUGINS__ && typeof window.__HERMES_PLUGINS__.register === "function") {
  window.__HERMES_PLUGINS__.register("mikael-os", MikaelOS);
}

export default MikaelOS;
