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

// Reactive media-query hook — drives the desktop⇄iOS shell switch. Returns the
// current match and re-renders on viewport crossings of the breakpoint.
function useMediaQuery(query) {
  const [match, setMatch] = useState(function () {
    try { return typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false; }
    catch (e) { return false; }
  });
  useEffect(function () {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const on = function () { setMatch(mql.matches); };
    on();
    if (mql.addEventListener) mql.addEventListener("change", on);
    else if (mql.addListener) mql.addListener(on);
    return function () {
      if (mql.removeEventListener) mql.removeEventListener("change", on);
      else if (mql.removeListener) mql.removeListener(on);
    };
  }, [query]);
  return match;
}

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
  { id: "today", title: "Heute", icon: "sun", accent: "cyan", meta: "9 Ereignisse", metric: "9", metricSub: "Ereignisse", pos: { x: 25, y: 13 } },
  { id: "tasks", title: "Aufgaben & Ziele", icon: "list-todo", accent: "amber", meta: "7 aktiv · 3 heute", metric: "7", metricSub: "aktiv · 3 heute", pos: { x: 46, y: 6 } },
  { id: "learning", title: "Lernplan", icon: "graduation-cap", accent: "violet", meta: "3 Lektionen fällig", metric: "3", metricSub: "Lektionen fällig", pos: { x: 65, y: 13 } },
  { id: "risel", title: "Rise-L Prozesse", icon: "server", accent: "blue", meta: "5 Workflows aktiv", metric: "5", metricSub: "Workflows aktiv", pos: { x: 85, y: 20 } },
  { id: "travel", title: "Reisen", icon: "plane", accent: "cyan", meta: "Rom · 18. Jun", metric: "3 T", metricSub: "bis Rom", pos: { x: 89, y: 39 } },
  { id: "nutrition", title: "Ernährung", icon: "leaf", accent: "emerald", meta: "2.105 kcal", metric: "2.105", metricSub: "kcal heute", pos: { x: 89, y: 57 } },
  { id: "company", title: "Firma-Signale", icon: "building-2", accent: "neutral", meta: "Nur lesen", metric: "—", metricSub: "Nur lesen", readOnly: true, pos: { x: 85, y: 74 } },
  { id: "kalender", title: "Kalender", icon: "calendar-days", accent: "cyan", meta: "Nächster · 10:30", metric: "10:30", metricSub: "nächstes Ereignis", pos: { x: 12, y: 31 } },
  { id: "body", title: "Körper / WHOOP", icon: "heart-pulse", accent: "emerald", meta: "Recovery 82%", metric: "82 %", metricSub: "Recovery", pos: { x: 9, y: 50 } },
  { id: "journal", title: "Journal", icon: "notebook-pen", accent: "neutral", meta: "1 Eintrag heute", metric: "1", metricSub: "Eintrag heute", pos: { x: 13, y: 68 } },
];

// Living-Timeline event fixtures (Phase 4). Each event links to a ring module id
// so the timeline reuses the same Phase-2 read-model honesty: a card whose linked
// module is live shows its live state pip; concept modules keep the Konzept badge.
// `period` groups the day into Morgen / Mittag / Abend for the axis dividers.
const TIMELINE = [
  { id: "briefing", period: "morgen", time: "06:45", end: "07:00", title: "Morgenbriefing", sub: "Tagesstart & Fokus setzen", icon: "sun", accent: "cyan", moduleId: "today" },
  { id: "training", period: "morgen", time: "07:30", end: "08:30", title: "Training", sub: "Hyrox + Mobility", icon: "activity", accent: "emerald", moduleId: "body" },
  { id: "deep1", period: "morgen", time: "09:00", end: "11:00", title: "Deep Work Block 1", sub: "Codex Build Sprint", icon: "code-xml", accent: "cyan", moduleId: "engineering" },
  { id: "learn", period: "morgen", time: "11:00", end: "11:45", title: "Lernplan", sub: "KI-Systeme · Kapitel 4", icon: "graduation-cap", accent: "violet", moduleId: "learning" },
  { id: "claude", period: "mittag", time: "11:45", end: "12:30", title: "Claude Mission", sub: "Research & Draft", icon: "sparkles", accent: "violet", moduleId: "engineering" },
  { id: "biz", period: "mittag", time: "13:00", end: "13:45", title: "Business Review", sub: "KPIs & Team-Sync", icon: "building-2", accent: "amber", moduleId: "company" },
  { id: "focus2", period: "mittag", time: "14:30", end: "16:00", title: "Focus Block 2", sub: "Engineering & Delivery", icon: "zap", accent: "cyan", moduleId: "engineering" },
  { id: "riselp", period: "mittag", time: "16:00", end: "16:30", title: "Rise-L Process", sub: "Weekly Verification", icon: "server", accent: "emerald", moduleId: "risel" },
  { id: "route", period: "abend", time: "17:00", end: "18:30", title: "Route & Reisen", sub: "Flughafen ZRH – MUC", icon: "plane", accent: "amber", moduleId: "travel" },
  { id: "dinner", period: "abend", time: "19:00", end: "21:00", title: "Abendessen", sub: "High Protein + Greens", icon: "utensils", accent: "emerald", moduleId: "nutrition" },
  { id: "journalx", period: "abend", time: "21:30", end: "22:00", title: "Journal & Reflexion", sub: "Tagesreview & Dankbarkeit", icon: "notebook-pen", accent: "violet", moduleId: "journal" },
];
// Single date source for the whole shell — the desktop top-bar, the desktop
// timeline sub-header and the mobile timeline hero all read from here, so the
// same day can never appear as two different dates on one screen.
const TODAY = { long: "Donnerstag, 26. Juni", short: "Do, 26. Juni" };
// The conceptual "now" the Jarvis marker sits at (writes NOTHING — a suggestion
// only). 16:42 sits chronologically AFTER the 16:00 Rise-L block and before the
// 17:00 departure, so the rail never contradicts its own timestamp.
const TIMELINE_NOW = { after: "riselp", time: "16:42", suggestion: "Kurze Pause vor der Fahrt einlegen.", tag: "Hydration" };
const PERIODS = [
  { id: "morgen", label: "Morgen", icon: "sun" },
  { id: "mittag", label: "Mittag", icon: "cloud-moon" },
  { id: "abend", label: "Abend", icon: "moon-star" },
];

// Focus-Lens payloads (keyed by module id, plus the "engineering" home lens the
// reference shows by default). Rows reuse one generic renderer.
const LENS = {
  engineering: {
    icon: "code-xml", accent: "violet", title: "Engineering / Codex", sub: "Fokus-Linse · 4 Missionen",
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

// ---------------------------------------------------------------------------
// Phase 2 — live read-model wiring.
// The module ring positions are frontend-only composition; the *data* (summary,
// rows, state, provenance/freshness) is projected from the control-plane via the
// plugin's read-only adapter (/api/plugins/mikael-os/overview). Nothing here is
// ever presented as live when it isn't: each module carries an honest `state`
// (loading·fresh·stale·unavailable·empty·partial·error) plus source + observedAt,
// and fixture modules keep `demo:true` so the "Konzept" pill stays on them.
// ---------------------------------------------------------------------------
const PLUGIN_API = "/api/plugins/mikael-os";
const POS = MODULES.reduce((acc, m) => { acc[m.id] = m.pos; return acc; }, {});

// Honest per-module state vocabulary → tone (colours the node dot / lens badge)
// and a German label. `loading` is the pre-fetch state; fixtures report `fresh`
// but with demo:true so the UI still shows "Konzept" rather than a live source.
const STATE_META = {
  loading:     { tone: "muted",    label: "Lädt …" },
  fresh:       { tone: "verified", label: "Live" },
  stale:       { tone: "amber",    label: "Veraltet" },
  partial:     { tone: "blue",     label: "Teilweise" },
  empty:       { tone: "muted",    label: "Leer" },
  unavailable: { tone: "red",      label: "Nicht erreichbar" },
  error:       { tone: "red",      label: "Fehler" },
};

// Compact German "vor X" freshness from an ISO timestamp (no external dep).
function freshnessLabel(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "gerade eben";
  const m = Math.round(s / 60);
  if (m < 60) return "vor " + m + " Min";
  const h = Math.round(m / 60);
  if (h < 48) return "vor " + h + " Std";
  return "vor " + Math.round(h / 24) + " T";
}

// Enrich one positional (draggable) module with its live read-model payload.
// The base keeps pos authority; live summary/state/rows/provenance win.
function enrichModule(base, L, loading) {
  if (!L) return { ...base, _state: loading ? "loading" : "empty", _metric: base.metric, _metricSub: base.metricSub };
  return {
    ...base,
    title: L.title || base.title,
    icon: L.icon || base.icon,
    accent: L.accent || base.accent,
    meta: L.summary || base.meta,
    readOnly: L.readOnly != null ? L.readOnly : base.readOnly,
    _state: L.state || "fresh",
    _demo: !!L.demo,
    _source: L.source,
    _sourceKind: L.sourceKind,
    _observedAt: L.observedAt,
    _permission: L.permission,
    _note: L.note,
    _rows: Array.isArray(L.rows) ? L.rows : [],
    _metric: deriveMetric(base, L),
    _metricSub: L.demo ? base.metricSub : (deriveMetricSub(base, L) || base.metricSub),
  };
}

// Big-number headline for the iOS domain cards. Live modules project a real
// count (missions / tasks / services / pending cards); the WHOOP body module is
// connection-only here (no token in the plugin context) so it honestly reads
// "Verbunden" rather than a fabricated recovery %. Concept modules keep the
// fixture metric (and always wear the Konzept pip, so it never reads as live).
function deriveMetric(base, L) {
  if (!L || L.demo) return base.metric;
  if (base.id === "body") return L.tokenFresh ? base.metric : "Verbunden";
  if (L.active != null) return String(L.active);
  if (L.count != null) return String(L.count);
  if (L.services && L.services.active != null) return String(L.services.active);
  if (L.pending != null) return String(L.pending);
  return base.metric;
}
function deriveMetricSub(base, L) {
  if (base.id === "body") return L.tokenFresh ? base.metricSub : "WHOOP verbunden";
  if (base.id === "tasks" && L.active != null) return "aktiv · " + (L.count || 0) + " gesamt";
  if (base.id === "engineering" && L.count != null) return "Missionen aktiv";
  if (base.id === "risel" && L.services) return "Dienste live";
  if (base.id === "company" && L.pending != null) return "Approval-Cards";
  return null;
}

// Index the overview payload's modules by id (empty until the fetch resolves).
function indexLive(live) {
  const byId = {};
  (live && live.modules ? live.modules : []).forEach((m) => { byId[m.id] = m; });
  return byId;
}

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

// Per-module honest freshness/provenance pip. Fixture modules (demo:true) keep
// the calm "Konzept" pill; live modules show their state + source freshness so
// no node ever silently implies live data it doesn't have.
function StatePip(props) {
  const m = props.module;
  const st = m._state || "loading";
  if (m._demo) {
    return h("span", { className: "mos__pip mos__pip--konzept", title: m._note || "Konzeptdaten" },
      h(Icon, { name: "flask-conical", size: 11 }), "Konzept");
  }
  const meta = STATE_META[st] || STATE_META.loading;
  const fresh = freshnessLabel(m._observedAt);
  const tip = [m._source && ("Quelle: " + m._source), fresh && ("Stand: " + fresh), m._note]
    .filter(Boolean).join(" · ");
  return h("span", { className: "mos__pip mos__pip--" + meta.tone, title: tip || meta.label },
    h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
    meta.label,
    fresh && (st === "fresh" || st === "stale" || st === "partial")
      ? h("span", { className: "mos__pip-age" }, fresh) : null,
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
        h(StatePip, { module: m }),
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

// Resolve the lens payload for a module: project the live read-model when the
// plugin adapter returned rows, otherwise fall back to the fixture concept lens.
// The returned object always carries an honest state + source + freshness so the
// footer never implies live data that isn't there.
function resolveLens(focusId, liveModule) {
  const fixture = LENS[focusId] || LENS.engineering;
  const L = liveModule;
  const hasLive = L && !L._demo && Array.isArray(L._rows) && L._rows.length > 0;
  const st = L ? (L._state || "loading") : "loading";
  if (hasLive) {
    const fresh = freshnessLabel(L._observedAt);
    return {
      icon: L.icon || fixture.icon, accent: L.accent || fixture.accent,
      title: L.title || fixture.title, sub: L.meta || fixture.sub,
      rows: L._rows, source: L._source || fixture.source,
      freshness: fresh || (st === "partial" ? "Verbindung ok" : "—"),
      permission: L._permission || fixture.permission,
      state: st, demo: false, note: L._note,
    };
  }
  // Live source present but empty/partial/unavailable/error → honest, no fixture rows.
  if (L && !L._demo && st !== "fresh") {
    return {
      icon: L.icon || fixture.icon, accent: L.accent || fixture.accent,
      title: L.title || fixture.title, sub: L.meta || fixture.sub,
      rows: Array.isArray(L._rows) ? L._rows : [],
      source: L._source || fixture.source,
      freshness: freshnessLabel(L._observedAt) || "—",
      permission: L._permission || fixture.permission,
      state: st, demo: false, note: L._note,
    };
  }
  // Fixture / concept module (or pre-fetch): keep the concept lens + Konzept badge.
  return {
    icon: (L && L.icon) || fixture.icon, accent: (L && L.accent) || fixture.accent,
    title: (L && L.title) || fixture.title, sub: (L && L.meta) || fixture.sub,
    rows: fixture.rows, source: "Konzept", freshness: "Konzeptdaten",
    permission: fixture.permission, state: L ? "fresh" : "loading",
    demo: true, note: L && L._note,
  };
}

function FocusLens(props) {
  const data = resolveLens(props.focusId, props.liveModule);
  const closable = props.focusId !== "engineering";
  const stMeta = STATE_META[data.state] || STATE_META.loading;
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
        { className: "mos__lens-state mos__pip mos__pip--" + (data.demo ? "konzept" : stMeta.tone),
          title: data.note || stMeta.label },
        data.demo
          ? h(Icon, { name: "flask-conical", size: 12 })
          : h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
        data.demo ? "Konzept" : stMeta.label,
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
      data.rows && data.rows.length
        ? data.rows.map((r, i) => h(LensRow, { key: r.title, row: r, index: i + 1 }))
        : h(
            "div",
            { className: "mos__lens-empty mos--" + (STATE_META[data.state] || STATE_META.loading).tone },
            h(Icon, { name: data.state === "unavailable" || data.state === "error" ? "unplug" : "inbox", size: 22 }),
            h("span", { className: "mos__lens-empty-title" }, stMeta.label),
            h("span", { className: "mos__lens-empty-note" }, data.note || "Keine Daten von dieser Quelle."),
          ),
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

// ===========================================================================
// Phase 4 · A — LIVING TIMELINE scene (desktop). A continuous Morgen→Nacht axis
// of grounded event cards in time order + a fixed right-hand focus panel
// (Kalender heute · Top-3 · WHOOP · Jarvis-Empfehlung). Reuses the SAME Phase-2
// read-model honesty: each event's linked ring module drives its state pip, so
// live modules read live and concept modules keep the Konzept badge. The Jarvis
// marker at the conceptual "now" is a SUGGESTION only — it writes nothing.
// ===========================================================================
function TimelineCard(props) {
  const e = props.event;
  const m = props.module;
  return h(
    "button",
    {
      type: "button",
      className: "mos__tl-card mos--" + e.accent + (props.active ? " is-active" : ""),
      "aria-current": props.active ? "true" : undefined,
      "aria-label": e.title + " öffnen",
      onClick: () => props.onActivate(e.moduleId),
    },
    h("span", { className: "mos__tl-card-icon" }, h(Icon, { name: e.icon, size: 20 })),
    h(
      "span",
      { className: "mos__tl-card-body" },
      h(
        "span",
        { className: "mos__tl-card-top" },
        h("span", { className: "mos__tl-card-title" }, e.title),
        h("span", { className: "mos__tl-card-range" }, e.time + " – " + e.end),
      ),
      h("span", { className: "mos__tl-card-sub" }, e.sub),
      // Keep the rail calm (reference has no pills on rows): only the focused card
      // carries its freshness pip; per-source provenance stays in the focus panel.
      props.active && m ? h(StatePip, { module: m }) : null,
      props.active ? h("span", { className: "mos__tl-progress", "aria-hidden": "true" }, h("span", { style: { width: "58%" } })) : null,
    ),
  );
}

function TimelineNow() {
  return h(
    "div",
    { className: "mos__tl-row mos__tl-row--now" },
    h("span", { className: "mos__tl-time mos__tl-time--now" }, TIMELINE_NOW.time),
    h("span", { className: "mos__tl-now-node", "aria-hidden": "true" }, "J"),
    h(
      "div",
      { className: "mos__tl-now-card" },
      h("span", { className: "mos__tl-now-k" }, h(Icon, { name: "orbit", size: 13 }), "Jarvis · Vorschlag"),
      h(
        "span",
        { className: "mos__tl-now-text" },
        TIMELINE_NOW.suggestion,
        h("span", { className: "mos__tl-now-tag" }, "+" + TIMELINE_NOW.tag),
      ),
      h("span", { className: "mos__pip mos__pip--konzept" }, h(Icon, { name: "flask-conical", size: 11 }), "schreibt nichts"),
    ),
  );
}

// Shared axis — used by both the desktop timeline scene and the mobile Timeline
// tab. `showNow` inserts the Jarvis suggestion marker after the "now" event.
function TimelineAxis(props) {
  const rows = [];
  PERIODS.forEach((per) => {
    rows.push(h("div", { key: "p-" + per.id, className: "mos__tl-period" }, h(Icon, { name: per.icon, size: 14 }), per.label));
    TIMELINE.filter((e) => e.period === per.id).forEach((e) => {
      rows.push(
        h(
          "div",
          { key: e.id, className: "mos__tl-row" },
          h("span", { className: "mos__tl-time" }, e.time),
          h("span", { className: "mos__tl-mark", "aria-hidden": "true" }),
          h(TimelineCard, { event: e, module: props.byId[e.moduleId], active: props.activeEventId === e.id, onActivate: props.onActivate }),
        ),
      );
      if (props.showNow && e.id === TIMELINE_NOW.after) rows.push(h(TimelineNow, { key: "now" }));
    });
  });
  rows.push(h("div", { key: "p-night", className: "mos__tl-period mos__tl-period--last" }, h(Icon, { name: "moon", size: 14 }), "Nacht"));
  return h("div", { className: "mos__tl-axis" }, rows);
}

// Honest WHOOP status ring. In the plugin context the connector reports
// "connected" but holds no recovery detail (no WHOOP_INTERNAL_TOKEN), so this
// NEVER fabricates a percentage — it shows the real connection state.
function WhoopRing(props) {
  const m = props.module;
  const live = m && !m._demo && m._state === "fresh" && typeof m._recovery === "number";
  const pct = live ? m._recovery : null;
  const C = 2 * Math.PI * 52;
  // Live: arc length ∝ recovery. No data: a FULL ring (CSS renders it dashed +
  // muted) rather than a partial solid arc that looks like a rendering error.
  const dash = pct != null ? (pct / 100) * C : C;
  return h(
    "div",
    { className: "mos__whoop-ring" + (pct == null ? " is-connected" : "") },
    h(
      "svg",
      { viewBox: "0 0 120 120", "aria-hidden": "true" },
      h("circle", { cx: 60, cy: 60, r: 52, className: "mos__whoop-track" }),
      h("circle", { cx: 60, cy: 60, r: 52, className: "mos__whoop-arc", style: { strokeDasharray: dash + " " + C, strokeDashoffset: C * 0.25, transform: "rotate(-90deg)", transformOrigin: "60px 60px" } }),
    ),
    h(
      "span",
      { className: "mos__whoop-center" },
      pct != null
        ? [h("b", { key: "v" }, pct + "%"), h("span", { key: "l" }, "Recovery")]
        : [h(Icon, { key: "i", name: "heart-pulse", size: 22 }), h("b", { key: "v", className: "mos__whoop-conn" }, "Verbunden"), h("span", { key: "l" }, "Keine Werte")],
    ),
  );
}

// Right-hand focus panel. Kalender + WHOOP stay their honest source-state;
// the header reflects the currently focused timeline event.
function TimelineFocusPanel(props) {
  const e = props.event;
  const byId = props.byId;
  const linked = byId[e.moduleId];
  const cal = byId["kalender"];
  const tasks = byId["tasks"];
  const body = byId["body"];
  const calRows = (cal && cal._rows && cal._rows.length ? cal._rows : (LENS.kalender.rows)).slice(0, 3);
  const topRows = (tasks && tasks._rows && tasks._rows.length ? tasks._rows : (LENS.tasks.rows)).slice(0, 3);
  return h(
    "aside",
    { className: "mos__tlfocus", "aria-label": "Fokus: " + e.title },
    h(
      "header",
      { className: "mos__tlfocus-head" },
      h("span", { className: "mos__tlfocus-badge mos--" + e.accent }, h(Icon, { name: e.icon, size: 20 })),
      h(
        "span",
        { className: "mos__tlfocus-titles" },
        h("span", { className: "mos__tlfocus-k" }, "Fokus"),
        h("span", { className: "mos__tlfocus-title" }, e.title),
      ),
      linked ? h(StatePip, { module: linked }) : null,
      h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Fokus zurücksetzen", onClick: props.onClose }, h(Icon, { name: "x", size: 18 })),
    ),
    h(
      "div",
      { className: "mos__tlfocus-body" },
      h(
      "div",
      { className: "mos__tlfocus-duo" },
      // Kalender – Heute
      h(
        "section",
        { className: "mos__tlfocus-sec" },
        h(
          "h3",
          { className: "mos__tlfocus-h3" },
          h(Icon, { name: "calendar-days", size: 14 }), "Kalender – Heute",
        ),
        calRows.map((r, i) =>
          h(
            "div",
            { key: i, className: "mos__tlfocus-cal" },
            h("span", { className: "mos__tlfocus-cal-time" }, r.value || "—"),
            h(
              "span",
              { className: "mos__tlfocus-cal-body" },
              h("span", { className: "mos__tlfocus-cal-title" }, r.title),
              h("span", { className: "mos__tlfocus-cal-sub" }, r.sub),
            ),
          )),
      ),
      // Top 3 Prioritäten
      h(
        "section",
        { className: "mos__tlfocus-sec" },
        h(
          "h3",
          { className: "mos__tlfocus-h3" },
          h(Icon, { name: "list-todo", size: 14 }), "Top 3 Prioritäten",
        ),
        topRows.map((r, i) =>
          h(
            "div",
            { key: i, className: "mos__tlfocus-top mos--" + (r.accent || "cyan") },
            h("span", { className: "mos__tlfocus-top-idx" }, String(i + 1)),
            h(
              "span",
              { className: "mos__tlfocus-top-body" },
              h("span", { className: "mos__tlfocus-top-title" }, r.title),
              h("span", { className: "mos__tlfocus-top-sub" }, r.sub),
            ),
          )),
      ),
      ),
      // WHOOP – Körperstatus
      h(
        "section",
        { className: "mos__tlfocus-sec mos__tlfocus-whoop" },
        h(
          "h3",
          { className: "mos__tlfocus-h3" },
          h(Icon, { name: "heart-pulse", size: 14 }), "WHOOP – Körperstatus",
          body ? h(StatePip, { module: body }) : null,
        ),
        h(
          "div",
          { className: "mos__tlfocus-whoop-row" },
          h(WhoopRing, { module: body }),
          h(
            "div",
            { className: "mos__tlfocus-stats" },
            [["Schlaf", "moon"], ["HRV", "activity"], ["Ruhepuls", "heart-pulse"], ["Belastung", "zap"]].map((s) =>
              h(
                "div",
                { key: s[0], className: "mos__tlfocus-stat" },
                h("span", { className: "mos__tlfocus-stat-k" }, h(Icon, { name: s[1], size: 12 }), s[0]),
                h("span", { className: "mos__tlfocus-stat-v" }, "—"),
              )),
          ),
        ),
        h("span", { className: "mos__tlfocus-note" }, body && body._note ? "Detailwerte nur über autorisierten Connector-Endpunkt." : "WHOOP verbunden."),
      ),
      // Jarvis Empfehlung
      h(
        "section",
        { className: "mos__tlfocus-sec mos__tlfocus-rec" },
        h("h3", { className: "mos__tlfocus-h3" }, h(Icon, { name: "orbit", size: 14 }), "Jarvis Empfehlung"),
        h(
          "p",
          { className: "mos__tlfocus-rec-text" },
          "Sehr gute Ausgangslage für Deep Work am Vormittag. Plane Fokusblöcke vor 11:30 und schütze deine Energie. Nachmittags Meetings & Kommunikation.",
        ),
        h("span", { className: "mos__pip mos__pip--konzept" }, h(Icon, { name: "flask-conical", size: 11 }), "schreibt nichts"),
      ),
    ),
  );
}

function TimelineScene(props) {
  const focusEvent = TIMELINE.find((e) => e.moduleId === props.focusId) || TIMELINE.find((e) => e.id === TIMELINE_NOW.after) || TIMELINE[0];
  return h(
    "div",
    { className: "mos__timeline" },
    h(
      "div",
      { className: "mos__tl-col" },
      h(
        "div",
        { className: "mos__tl-head" },
        h("span", { className: "mos__tl-head-icon" }, h(Icon, { name: "waypoints", size: 18 })),
        h(
          "span",
          { className: "mos__tl-head-titles" },
          h("span", { className: "mos__tl-head-title" }, "Living Timeline"),
          h("span", { className: "mos__tl-head-sub" }, TODAY.long + " · Morgen → Nacht"),
        ),
      ),
      h("div", { className: "mos__tl-scroll" }, h(TimelineAxis, { byId: props.byId, activeEventId: focusEvent.id, onActivate: props.onActivate, showNow: true })),
    ),
    h(TimelineFocusPanel, { event: focusEvent, byId: props.byId, onClose: props.onClose }),
  );
}

// ===========================================================================
// Phase 4 · B — iOS RESPONSIVE MODE (<=430px). A STABLE vertical scene stack —
// not a shrunken desktop. Top bar · Heute header · grounded 2-col grid · a
// Jarvis command dock anchored above a fixed bottom tab-bar. The Focus-Lens
// becomes a native bottom-sheet with detents; the Timeline tab reuses the same
// axis. Voice is reachable from every screen.
// ===========================================================================
const M_TABS = [
  { id: "home", icon: "house", label: "Home" },
  { id: "timeline", icon: "list", label: "Timeline" },
  { id: "jarvis", icon: "brain", label: "Jarvis" },
  { id: "module", icon: "layers", label: "Module" },
  { id: "profil", icon: "circle-user", label: "Profil" },
];

function MobileTopBar(props) {
  return h(
    "header",
    { className: "mos__mtop" },
    h(
      "div",
      { className: "mos__mtop-id" },
      h("span", { className: "mos__mtop-avatar", "aria-hidden": "true" }, "M"),
      h("span", { className: "mos__mtop-word" }, "MIKAEL OS"),
    ),
    h(
      "div",
      { className: "mos__mtop-right" },
      h(
        "span",
        { className: "mos__mtop-time" },
        h("span", { className: "mos__mtop-city" }, "BERLIN"),
        h("b", null, "09:41"),
      ),
      props.loadState === "loading"
        ? h("span", { className: "mos__concept mos__concept--loading" }, h(Icon, { name: "loader", size: 12 }), "Lädt")
        : props.liveCount > 0
          ? h("span", { className: "mos__concept mos__concept--live" }, h(Icon, { name: "activity", size: 12 }), props.liveCount + " Live")
          : h("span", { className: "mos__concept" }, h(Icon, { name: "flask-conical", size: 12 }), "Konzept"),
    ),
  );
}

function MobileHeute() {
  return h(
    "section",
    { className: "mos__mheute" },
    h(
      "div",
      { className: "mos__mheute-head" },
      h("h2", null, "Heute"),
    ),
    h(
      "div",
      { className: "mos__mheute-cols" },
      h(
        "div",
        { className: "mos__mheute-col" },
        h("span", { className: "mos__mheute-k" }, h(Icon, { name: "clock", size: 13 }), "Nächster Termin"),
        h("span", { className: "mos__mheute-v" }, "10:30 · Team Sync"),
        h("span", { className: "mos__mheute-sub" }, h(Icon, { name: "map", size: 12 }), "Q4 Roadmap · Virtuell"),
      ),
      h(
        "div",
        { className: "mos__mheute-col" },
        h("span", { className: "mos__mheute-k" }, h(Icon, { name: "target", size: 13 }), "Fokus"),
        h("span", { className: "mos__mheute-v" }, "Engineering Deep Work"),
        h("span", { className: "mos__mheute-sub" }, h(Icon, { name: "clock", size: 12 }), "bis 12:00"),
      ),
    ),
  );
}

function DomainCardM(props) {
  const m = props.module;
  if (!m) return null;
  return h(
    "button",
    { type: "button", className: "mos__mcard mos--" + m.accent, onClick: () => props.onOpen(m.id), "aria-label": m.title + " öffnen" },
    h(
      "span",
      { className: "mos__mcard-top" },
      h("span", { className: "mos__mcard-icon" }, h(Icon, { name: m.icon, size: 18 })),
      h("span", { className: "mos__mcard-title" }, m.title),
    ),
    h("span", { className: "mos__mcard-metric" }, m._metric || m.metric),
    h("span", { className: "mos__mcard-sub" }, m._metricSub || m.metricSub),
    h(StatePip, { module: m }),
  );
}

function MobileHome(props) {
  const cards = ["body", "tasks", "kalender", "engineering", "risel", "journal"].map((id) => props.byId[id]).filter(Boolean);
  return h(
    "div",
    { className: "mos__m-scroll" },
    h(MobileHeute, null),
    h("div", { className: "mos__mgrid" }, cards.map((m) => h(DomainCardM, { key: m.id, module: m, onOpen: props.onOpen }))),
  );
}

function ModuleRowM(props) {
  const m = props.module;
  return h(
    "button",
    { type: "button", className: "mos__mrow mos--" + m.accent, onClick: () => props.onOpen(m.id), "aria-label": m.title + " öffnen" },
    h("span", { className: "mos__mrow-icon" }, h(Icon, { name: m.icon, size: 18 })),
    h(
      "span",
      { className: "mos__mrow-body" },
      h("span", { className: "mos__mrow-title" }, m.title),
      h("span", { className: "mos__mrow-meta" }, m.meta),
    ),
    h(StatePip, { module: m }),
    h("span", { className: "mos__mrow-chev", "aria-hidden": "true" }, h(Icon, { name: "chevron-right", size: 18 })),
  );
}

function MobileModules(props) {
  return h(
    "div",
    { className: "mos__m-scroll" },
    h("h2", { className: "mos__m-h2" }, "Alle Module"),
    h("div", { className: "mos__mlist" }, props.modules.map((m) => h(ModuleRowM, { key: m.id, module: m, onOpen: props.onOpen }))),
  );
}

function MobileProfile(props) {
  return h(
    "div",
    { className: "mos__m-scroll" },
    h(
      "section",
      { className: "mos__mprofile" },
      h("span", { className: "mos__mprofile-avatar", "aria-hidden": "true" }, "M"),
      h(
        "span",
        { className: "mos__mprofile-id" },
        h("span", { className: "mos__mprofile-name" }, "Mikael"),
        h("span", { className: "mos__mprofile-sub" }, "Privates System"),
      ),
    ),
    h(WorkspaceSwitcher, { active: props.workspace, onChange: props.onWorkspace }),
    h(
      "section",
      { className: "mos__mpanel" },
      h("h3", { className: "mos__m-h3" }, h(Icon, { name: "shield-check", size: 14 }), "Privatsphäre & Berechtigungen"),
      h("p", { className: "mos__mpanel-note" }, "Alle Module sind ", h("b", null, "nur lesend"), ". Schreibende Aktionen laufen ausschließlich über Gates (Phase 3)."),
      h("span", { className: "mos__pip mos__pip--konzept" }, h(Icon, { name: "flask-conical", size: 11 }), "Konzeptdaten wo keine Live-Quelle"),
    ),
  );
}

function WaveForm() {
  return h(
    "svg",
    { className: "mos__wave", viewBox: "0 0 320 80", preserveAspectRatio: "none", "aria-hidden": "true" },
    h("path", { d: "M0 40 Q 20 10 40 40 T 80 40 T 120 40 T 160 40 T 200 40 T 240 40 T 280 40 T 320 40", className: "mos__wave-a" }),
    h("path", { d: "M0 40 Q 20 62 40 40 T 80 40 T 120 40 T 160 40 T 200 40 T 240 40 T 280 40 T 320 40", className: "mos__wave-b" }),
  );
}

function MobileJarvis(props) {
  const st = STATES[props.stateIndex] || STATES[0];
  const label = st.id === "listening" ? "Ich höre zu" : (st.id === "ready" ? "Bereit" : st.label);
  const quick = [
    { icon: "sun", label: "Wetter", accent: "cyan" },
    { icon: "heart-pulse", label: "Recovery", accent: "emerald" },
    { icon: "clock", label: "Deep Work", accent: "amber" },
  ];
  return h(
    "div",
    { className: "mos__mjarvis" },
    h("div", { className: "mos__mjarvis-orb" }, h(Orb, null)),
    h("span", { className: "mos__mjarvis-state" }, label),
    h(WaveForm, null),
    h(
      "button",
      { type: "button", className: "mos__mjarvis-ptt", onClick: props.onSpeak },
      h(Icon, { name: "mic", size: 20 }), "Halten zum Sprechen",
    ),
    h(
      "div",
      { className: "mos__mjarvis-quick" },
      quick.map((q) =>
        h(
          "button",
          { key: q.label, type: "button", className: "mos__mquick mos--" + q.accent, onClick: () => props.onQuick(q.label) },
          h(Icon, { name: q.icon, size: 20 }), q.label,
        )),
    ),
  );
}

function MobileCommandDock(props) {
  return h(
    "form",
    { className: "mos__mdock", onSubmit: props.onSubmit },
    h("button", { type: "button", className: "mos__mdock-orb", "aria-label": "Sprachbefehl", onClick: props.onSpeak }, h(Icon, { name: "mic", size: 20 })),
    h("input", {
      className: "mos__mdock-input",
      type: "text",
      "aria-label": "Befehl eingeben",
      placeholder: "Sage Jarvis …",
      value: props.command,
      onChange: (e) => props.onCommand(e.target.value),
    }),
    h("button", { type: "submit", className: "mos__mdock-send", "aria-label": "Senden" }, h(Icon, { name: "send-horizontal", size: 16 })),
  );
}

function MobileTabBar(props) {
  return h(
    "nav",
    { className: "mos__mtabs", "aria-label": "Navigation" },
    M_TABS.map((t) =>
      h(
        "button",
        {
          key: t.id,
          type: "button",
          className: "mos__mtab" + (props.active === t.id ? " is-active" : "") + (t.id === "jarvis" ? " mos__mtab--jarvis" : ""),
          "aria-current": props.active === t.id ? "page" : undefined,
          onClick: () => props.onChange(t.id),
        },
        h("span", { className: "mos__mtab-icon" }, h(Icon, { name: t.icon, size: 22 })),
        h("span", { className: "mos__mtab-label" }, t.label),
      )),
  );
}

const SHEET_DETENTS = [46, 76, 100];

function MobileSheet(props) {
  const [dragVh, setDragVh] = useState(null);
  const dragRef = useRef(null);
  useEffect(() => {
    function move(ev) {
      const d = dragRef.current;
      if (!d) return;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const vh = Math.max(16, Math.min(100, d.startVh + ((d.startY - cy) / window.innerHeight) * 100));
      setDragVh(vh);
    }
    function up() {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      const cur = dragVh != null ? dragVh : SHEET_DETENTS[props.detent];
      // pure tap on the grabber (no meaningful drag) → cycle detent upward
      if (Math.abs(cur - d.startVh) < 3) {
        setDragVh(null);
        props.onDetent((props.detent + 1) % SHEET_DETENTS.length);
        return;
      }
      if (cur < 30) { setDragVh(null); props.onClose(); return; }
      let best = 0, bd = 1e9;
      SHEET_DETENTS.forEach((hh, i) => { const dd = Math.abs(hh - cur); if (dd < bd) { bd = dd; best = i; } });
      setDragVh(null);
      props.onDetent(best);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [dragVh, props.detent, props.open]);

  if (!props.open) return null;
  const data = resolveLens(props.focusId, props.liveModule);
  const stMeta = STATE_META[data.state] || STATE_META.loading;
  const height = dragVh != null ? dragVh : SHEET_DETENTS[props.detent];
  const startDrag = (ev) => {
    const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
    dragRef.current = { startY: cy, startVh: height };
  };
  return h(
    "div",
    { className: "mos__sheet-scrim", onClick: props.onClose },
    h(
      "section",
      {
        className: "mos__sheet" + (dragVh != null ? " is-dragging" : ""),
        style: { height: height + "vh" },
        "aria-label": "Fokus: " + data.title,
        onClick: (e) => e.stopPropagation(),
      },
      h(
        "button",
        { type: "button", className: "mos__sheet-grab", "aria-label": "Größe ändern", onPointerDown: startDrag, onTouchStart: startDrag },
        h("span", { className: "mos__sheet-grab-bar", "aria-hidden": "true" }),
      ),
      h(
        "header",
        { className: "mos__sheet-head" },
        h("span", { className: "mos__sheet-badge mos--" + data.accent }, h(Icon, { name: data.icon, size: 20 })),
        h(
          "span",
          { className: "mos__sheet-titles" },
          h("span", { className: "mos__sheet-title" }, data.title),
          h("span", { className: "mos__sheet-sub" }, data.sub),
          h(
            "span",
            { className: "mos__pip mos__pip--" + (data.demo ? "konzept" : stMeta.tone) },
            data.demo ? h(Icon, { name: "flask-conical", size: 11 }) : h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
            data.demo ? "Konzept" : stMeta.label,
          ),
        ),
        h("button", { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Schließen", onClick: props.onClose }, h(Icon, { name: "x", size: 18 })),
      ),
      h(
        "div",
        { className: "mos__sheet-body" },
        data.rows && data.rows.length
          ? data.rows.map((r, i) => h(LensRow, { key: r.title + i, row: r, index: i + 1 }))
          : h(
              "div",
              { className: "mos__lens-empty mos--" + stMeta.tone },
              h(Icon, { name: data.state === "unavailable" || data.state === "error" ? "unplug" : "inbox", size: 22 }),
              h("span", { className: "mos__lens-empty-title" }, stMeta.label),
              h("span", { className: "mos__lens-empty-note" }, data.note || "Keine Daten von dieser Quelle."),
            ),
      ),
      h(
        "footer",
        { className: "mos__sheet-foot" },
        h(
          "span",
          { className: "mos__sheet-prov" },
          "Quelle ", h("b", null, data.source), " · Stand ", h("b", null, data.freshness), " · ", data.permission,
        ),
        h("button", { type: "button", className: "mos__sheet-cta mos--" + data.accent }, "Details anzeigen"),
      ),
    ),
  );
}

function MobileShell(props) {
  const tab = props.mobileTab;
  // The command pill belongs to the Jarvis tab; the Timeline is a read view
  // (reference shows no input there), so the dock never overlaps its last card.
  const showDock = tab !== "jarvis" && tab !== "timeline";
  let content;
  if (tab === "timeline") {
    content = h(
      "div",
      { className: "mos__m-scroll" },
      h(
        "div",
        { className: "mos__mtl-head" },
        h("span", { className: "mos__tl-head-icon" }, h(Icon, { name: "waypoints", size: 18 })),
        h(
          "span",
          { className: "mos__tl-head-titles" },
          h("span", { className: "mos__tl-head-title" }, "Living Timeline"),
          h("span", { className: "mos__tl-head-sub" }, TODAY.long),
        ),
      ),
      h(TimelineAxis, { byId: props.byId, activeEventId: (TIMELINE.find((e) => e.moduleId === props.focusId) || {}).id, onActivate: props.onOpen, showNow: true }),
    );
  } else if (tab === "jarvis") {
    content = h(MobileJarvis, { stateIndex: props.stateIndex, onSpeak: props.onSpeak, onQuick: props.onQuick });
  } else if (tab === "module") {
    content = h(MobileModules, { modules: props.modules, onOpen: props.onOpen });
  } else if (tab === "profil") {
    content = h(MobileProfile, { workspace: props.workspace, onWorkspace: props.onWorkspace });
  } else {
    content = h(MobileHome, { byId: props.byId, onOpen: props.onOpen });
  }
  return h(
    "div",
    { className: "mos__m" },
    tab === "jarvis" ? null : h(MobileTopBar, { loadState: props.loadState, liveCount: props.liveCount }),
    h("main", { className: "mos__m-main" }, content),
    showDock ? h(MobileCommandDock, { command: props.command, onCommand: props.onCommand, onSubmit: props.onSubmit, onSpeak: props.onSpeak }) : null,
    h(MobileTabBar, { active: tab, onChange: props.onMobileTab }),
    h(MobileSheet, {
      open: props.sheetOpen,
      detent: props.sheetDetent,
      onDetent: props.onSheetDetent,
      onClose: props.onSheetClose,
      focusId: props.focusId,
      liveModule: props.byId[props.focusId],
    }),
  );
}

function SceneSwitcher(props) {
  return h(
    "div",
    { className: "mos__scenes", role: "group", "aria-label": "Ansicht wechseln" },
    [{ id: "constellation", icon: "orbit", label: "Konstellation" }, { id: "timeline", icon: "waypoints", label: "Timeline" }].map((s) =>
      h(
        "button",
        { key: s.id, type: "button", className: "mos__scene-tab", "aria-pressed": props.scene === s.id ? "true" : "false", onClick: () => props.onScene(s.id) },
        h(Icon, { name: s.icon, size: 15 }), h("span", null, s.label),
      )),
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
      h(SceneSwitcher, { scene: props.scene, onScene: props.onScene }),
      (function () {
        const ls = props.loadState;
        const liveN = props.liveCount || 0;
        if (ls === "loading") {
          return h("span", { className: "mos__concept mos__concept--loading", title: "Read-Modelle werden geladen …" },
            h(Icon, { name: "loader", size: 14 }), "Lädt Read-Modelle …");
        }
        if (liveN > 0) {
          return h("span",
            { className: "mos__concept mos__concept--live",
              title: "Phase 2: " + liveN + " Module projizieren echte Read-Modelle (mission.v2 / WHOOP / systemd / Approval-Cards); übrige bleiben Konzept." },
            h(Icon, { name: "activity", size: 14 }),
            liveN + " Live · " + Math.max(0, (props.total || 0) - liveN) + " Konzept");
        }
        return h("span",
          { className: "mos__concept", title: ls === "offline"
              ? "Read-Modelle nicht erreichbar — Konzeptdaten angezeigt."
              : "Konzeptdaten. Keine Live-Wahrheit." },
          h(Icon, { name: "flask-conical", size: 14 }),
          ls === "offline" ? "Quellen offline · Konzept" : "Konzeptdaten");
      })(),
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
        h("span", null, TODAY.short + " · Berliner Zeit"),
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
  // Phase 4 — desktop scene toggle (Konstellation ⇄ Timeline), iOS shell switch,
  // active mobile tab, and the mobile focus bottom-sheet (open + detent index).
  const [scene, setScene] = useState("constellation"); // constellation | timeline
  const isMobile = useMediaQuery("(max-width: 430px)");
  const [mobileTab, setMobileTab] = useState("home"); // home | timeline | jarvis | module | profil
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDetent, setSheetDetent] = useState(1); // index into SHEET_DETENTS
  // Live read-model overview (null until the plugin adapter responds; a failed
  // or absent fetch simply leaves the concept fixtures in place — the shell
  // must never break because a source is down).
  const [live, setLive] = useState(null);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | offline

  // Fetch the read-only projection once on mount, via the host SDK's authed
  // fetchJSON (falls back to window.fetch for the screenshot harness). Any error
  // is swallowed into `offline` so fixtures remain visible.
  useEffect(() => {
    let alive = true;
    const sdk = (typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__) || {};
    const getJSON = sdk.fetchJSON
      ? (u) => sdk.fetchJSON(u)
      : (typeof fetch === "function" ? (u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(r.status))) : null);
    if (!getJSON) { setLoadState("offline"); return; }
    Promise.resolve()
      .then(() => getJSON(PLUGIN_API + "/overview"))
      .then((data) => { if (alive) { setLive(data); setLoadState("ready"); } })
      .catch(() => { if (alive) setLoadState("offline"); });
    return () => { alive = false; };
  }, []);

  const liveById = useMemo(() => indexLive(live), [live]);
  const loadingModules = loadState === "loading";
  const viewModules = useMemo(
    () => modules.map((base) => enrichModule(base, liveById[base.id], loadingModules)),
    [modules, liveById, loadingModules],
  );
  const liveCount = useMemo(
    () => viewModules.filter((m) => !m._demo && (m._state === "fresh" || m._state === "stale" || m._state === "partial")).length,
    [viewModules],
  );
  // Enriched lookup for the Focus-Lens — includes modules the adapter returns
  // that are NOT ring nodes (e.g. the default "engineering / Codex" lens), so
  // the lens projects their live read-model instead of falling back to fixtures.
  const enrichedById = useMemo(() => {
    const map = {};
    viewModules.forEach((m) => { map[m.id] = m; });
    Object.keys(liveById).forEach((id) => {
      if (map[id]) return;
      const L = liveById[id];
      map[id] = enrichModule(
        { id, title: L.title, icon: L.icon, accent: L.accent, pos: { x: 50, y: 50 } },
        L, loadingModules,
      );
    });
    return map;
  }, [viewModules, liveById, loadingModules]);

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

  // Mobile: tapping a domain card / module row / timeline card focuses the
  // module AND opens the bottom-sheet at the middle detent (shared focusId means
  // the choice survives a scene/tab switch, exactly like the desktop lens).
  const openModule = useCallback((id) => { setFocusId(id); setStateIndex(1); setSheetDetent(1); setSheetOpen(true); }, []);
  const closeSheet = useCallback(() => { setSheetOpen(false); }, []);
  const onSpeak = useCallback(() => { runStateSequence(); }, [runStateSequence]);
  const onQuick = useCallback((label) => { setCommand(label); runStateSequence(); }, [runStateSequence]);

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
      if (k === "Escape") { if (sheetOpen) { setSheetOpen(false); } else { closeFocus(); } return; }
      if (k >= "1" && k <= "9") {
        const idx = parseInt(k, 10) - 1;
        if (modules[idx]) { if (isMobile) openModule(modules[idx].id); else activate(modules[idx].id); }
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
  }, [modules, focusId, activate, closeFocus, sheetOpen, isMobile, openModule]);

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

  // iOS shell — a distinct vertical scene stack (not a shrunken desktop). All
  // state (focusId, stateIndex, command, live read-models) is shared, so opening
  // a module here is the same choice as the desktop lens.
  if (isMobile) {
    return h(
      "div",
      { className: "mos mos--mobile" },
      h("div", { className: "mos__atmosphere", "aria-hidden": "true" }),
      h("div", { className: "mos__atmosphere-veil", "aria-hidden": "true" }),
      h(MobileShell, {
        mobileTab: mobileTab, onMobileTab: setMobileTab,
        byId: enrichedById, modules: viewModules,
        focusId: focusId, onOpen: openModule,
        command: command, onCommand: setCommand, onSubmit: submit,
        onSpeak: onSpeak, onQuick: onQuick, stateIndex: stateIndex,
        workspace: workspace, onWorkspace: setWorkspace,
        loadState: loadState, liveCount: liveCount,
        sheetOpen: sheetOpen, sheetDetent: sheetDetent,
        onSheetDetent: setSheetDetent, onSheetClose: closeSheet,
      }),
    );
  }

  return h(
    "div",
    { className: "mos" + (scene === "timeline" ? " mos--timeline" : "") },
    h("div", { className: "mos__atmosphere", "aria-hidden": "true" }),
    h("div", { className: "mos__atmosphere-veil", "aria-hidden": "true" }),
    h(
      "div",
      { className: "mos__shell" },
      h(TopBar, { loadState: loadState, liveCount: liveCount, total: viewModules.length, scene: scene, onScene: setScene }),
      scene === "timeline"
        ? h("div", { className: "mos__stagewrap mos__stagewrap--tl" },
            h(TimelineScene, { byId: enrichedById, focusId: focusId, onActivate: activate, onClose: closeFocus }))
        : h(
        "div",
        { className: "mos__stagewrap" },
        h(WorkspaceSwitcher, { active: workspace, onChange: setWorkspace }),
        h(
          "div",
          { className: "mos__stage", ref: stageRef },
          h(Connectors, { modules: viewModules, focusId: focusId }),
          // orbiting module nodes
          viewModules.map((m) =>
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
            h(FocusLens, {
              focusId: focusId,
              liveModule: enrichedById[focusId],
              onClose: closeFocus,
            }),
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
