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
// Ring order follows the VISUAL constellation clockwise from the top, so keyboard
// Tab / digit-focus order matches the on-screen ring position (WCAG 2.4.3) instead
// of an arbitrary insertion order. `pos` (centre %, of the stage) is what drag
// mutates and what reproduces the reference ring composition. The top row sits
// clear of the (lowered, smaller) core so no card ever overlaps the orb.
const MODULES = [
  { id: "tasks", title: "Aufgaben & Ziele", icon: "list-todo", accent: "amber", meta: "7 aktiv · 3 heute", metric: "7", metricSub: "aktiv · 3 heute", pos: { x: 47, y: 9 } },
  { id: "learning", title: "Lernplan", icon: "graduation-cap", accent: "violet", meta: "Anki-Sync bereit", metric: "—", metricSub: "Karten fällig", pos: { x: 67, y: 14 } },
  { id: "risel", title: "Rise-L Prozesse", icon: "server", accent: "blue", meta: "5 Workflows aktiv", metric: "5", metricSub: "Workflows aktiv", pos: { x: 86, y: 22 } },
  { id: "travel", title: "Reisen", icon: "plane", accent: "cyan", meta: "Rom · 18. Jun", metric: "3 T", metricSub: "bis Rom", pos: { x: 89, y: 41 } },
  { id: "nutrition", title: "Ernährung", icon: "leaf", accent: "emerald", meta: "2.105 kcal", metric: "2.105", metricSub: "kcal heute", pos: { x: 89, y: 58 } },
  { id: "company", title: "Firma-Signale", icon: "building-2", accent: "neutral", meta: "Nur lesen", metric: "—", metricSub: "Nur lesen", readOnly: true, pos: { x: 85, y: 75 } },
  { id: "journal", title: "Journal", icon: "notebook-pen", accent: "neutral", meta: "1 Eintrag heute", metric: "1", metricSub: "Eintrag heute", pos: { x: 13, y: 70 } },
  { id: "body", title: "Körper / WHOOP", icon: "heart-pulse", accent: "emerald", meta: "Recovery 82%", metric: "82 %", metricSub: "Recovery", pos: { x: 9, y: 51 } },
  { id: "kalender", title: "Kalender", icon: "calendar-days", accent: "cyan", meta: "Nächster · 10:30", metric: "10:30", metricSub: "nächstes Ereignis", pos: { x: 11, y: 32 } },
  { id: "today", title: "Heute", icon: "sun", accent: "cyan", meta: "9 Ereignisse", metric: "9", metricSub: "Ereignisse", pos: { x: 26, y: 15 } },
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
// Shared orb centre (% of the constellation stage). The core CSS anchor, the
// connector origin and the lens clearance are all derived from this single pair,
// so the geometry can't drift into an orb⇄card collision. Kept in sync with
// `.mos__core { left/top }` and the connector origin below.
const CORE_POS = { x: 50, y: 33 };
// One clock source. The desktop top-bar reads it per scene (Konstellation keeps
// the night reference time; Timeline shows the "now" the Jarvis marker sits at,
// so the bar and the marker can never disagree on the same screen).
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
    icon: "graduation-cap", accent: "violet", title: "Lernplan", sub: "Spaced Repetition · Anki",
    source: "anki-sync (read-only)", freshness: "—", permission: "Nur lesen (mode=ro)",
    rows: [
      { icon: "graduation-cap", accent: "violet", title: "Fällig heute", sub: "Anki-Karten", value: "—" },
      { icon: "target", accent: "cyan", title: "Retention", sub: "letzte 30 Tage", value: "—" },
      { icon: "flame", accent: "violet", title: "Streak", sub: "Lern-Tage in Folge", value: "—" },
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

// Honest tooltip for the not-yet-wired chrome buttons (open/details/tools/add
// etc.). Real actions arrive in Phase 3 through gates (propose-only); until then
// these carry this hint rather than silently doing nothing.
const NOT_WIRED = "Noch nicht verbunden — folgt in Phase 3 (über Gates, propose-only).";

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
// Per-state colour coding matches the master mockups' rail (green→cyan→violet→
// amber→blue→green), not a mono-cyan strip. FOKUS carries the violet duoton.
const STATES = [
  { id: "ready", icon: "circle", label: "Bereit", tone: "ready" },
  { id: "listening", icon: "ear", label: "Hört zu", tone: "listen" },
  { id: "thinking", icon: "brain", label: "Denkt", tone: "think" },
  // FOKUS — deep-work / focus mode (violet), matches jd-master-A/B state rail.
  { id: "focus", icon: "target", label: "Fokus", tone: "focus" },
  { id: "suggest", icon: "lightbulb", label: "Vorschlag", tone: "amber" },
  { id: "executing", icon: "zap", label: "Ausführung", tone: "exec" },
  { id: "verified", icon: "circle-check-big", label: "Verifiziert", tone: "verified" },
];

const WORKSPACES = [
  { id: "private", label: "Privat" },
  { id: "engineering", label: "Engineering" },
  { id: "company_signal", label: "Firma-Signale" },
];

// Human status line for the Jarvis lifecycle — one source of truth for the
// desktop rail, the mobile Jarvis surface and the aria-live announcement, so a
// screen reader hears the exact words the sighted user sees.
function jarvisStateText(index) {
  const s = STATES[index] || STATES[0];
  if (s.id === "listening") return "Ich höre zu";
  return s.label;
}

// A screen-reader-only polite live region. Its text is re-announced on change,
// so Jarvis state transitions and load/offline changes reach assistive tech
// even though the visual cue is colour + motion. Never shown; never focusable.
function LiveAnnouncer(props) {
  return h(
    "div",
    { className: "mos__sr-only", role: "status", "aria-live": "polite", "aria-atomic": "true" },
    props.message || "",
  );
}

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
// Phase 3 — the propose lifecycle talks ONLY to the plugin's own read/propose
// routes (same-origin). The plugin backend is the thing that (server-side, on a
// live submit) hands the intent to the gated control-plane :18083/actions. The
// frontend NEVER addresses :18083 directly and NEVER calls /approvals/decide.
const PROPOSE_API = PLUGIN_API + "/actions/propose";
const RECEIPT_API = PLUGIN_API + "/actions/receipt";
// L-2 — the read-only Anki drill/preview session. GET only; the plugin NEVER
// writes the collection and NEVER opens AnkiConnect. Real grading + persistence
// happen in Anki / AnkiDroid — this surface is a preview/drill, nothing more.
const REVIEW_API = PLUGIN_API + "/review/session";
// L-3 — the Lern-Coach read/propose routes (same-origin plugin routes only).
//   /study/plan            GET  — Klausur-Countdown + Pacing (exams.json × Anki, read-only)
//   /study/feynman         GET  — stage a Feynman round (pick concept; is Jarvis reachable?)
//   /study/feynman/evaluate POST — grade the explanation BY JARVIS (Brain-Gateway).
//        This is the ONE Jarvis-dependent call; the plugin never fakes a grade.
//   /study/plan/propose    POST — study-plan MISSION via the gated /actions seam
//        (dry-run default; workspace=studium; never money/firma; never /approvals/decide).
const STUDY_PLAN_API = PLUGIN_API + "/study/plan";
const FEYNMAN_API = PLUGIN_API + "/study/feynman";
const FEYNMAN_EVAL_API = PLUGIN_API + "/study/feynman/evaluate";
const STUDY_PROPOSE_API = PLUGIN_API + "/study/plan/propose";
// Cockpit (M1) — the three read-only Cockpit routes (same-origin plugin routes;
// GET only, zero-write). Each response carries the honest _prov envelope from
// plugin_api.py; the value is never fabricated in the frontend. The Approval-
// Center reads /cockpit/approvals ONLY — it never reaches /approvals/decide.
const KPI_API = PLUGIN_API + "/cockpit/kpi";
const JARVIS_STATE_API = PLUGIN_API + "/cockpit/jarvis-state";
const APPROVALS_API = PLUGIN_API + "/cockpit/approvals";
// M2 — FIRMA/Rise-L read-only projection bundle + one approval card's full
// detail. Both are GET-only, zero-write. The detail route NEVER decides — it
// only projects the raw fields + the honest gated path; the plugin has no
// /approvals/decide code path at all.
const FIRMA_OVERVIEW_API = PLUGIN_API + "/firma/overview";
const FIRMA_APPROVAL_DETAIL_API = PLUGIN_API + "/firma/approvals/detail";
const POS = MODULES.reduce((acc, m) => { acc[m.id] = m.pos; return acc; }, {});

// SDK-aware POST/GET. Prefer the host's authed transport; fall back to window
// fetch (screenshot harness). Kept tiny + dependency-free.
function sdkPost(url, body) {
  const sdk = (typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__) || {};
  if (typeof sdk.postJSON === "function") return Promise.resolve(sdk.postJSON(url, body));
  if (typeof sdk.authedFetch === "function") {
    return Promise.resolve(sdk.authedFetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })).then((r) => (r && typeof r.json === "function" ? r.json() : r));
  }
  if (typeof fetch === "function") {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  }
  return Promise.reject(new Error("no transport"));
}
function sdkGet(url) {
  const sdk = (typeof window !== "undefined" && window.__HERMES_PLUGIN_SDK__) || {};
  if (typeof sdk.fetchJSON === "function") return Promise.resolve(sdk.fetchJSON(url));
  if (typeof fetch === "function") return fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  return Promise.reject(new Error("no transport"));
}

// Lifecycle vocabulary for the ONE propose action. Every state carries text +
// icon + a tone (never colour alone): proposed/preview = amber, approved = cyan,
// executed/verified = emerald, denied/error = red, auth_pending = amber/gated.
const PROPOSE_META = {
  compose:          { tone: "amber",    icon: "git-branch",        label: "Entwurf" },
  loading:          { tone: "muted",    icon: "loader",            label: "Baut Vorschau …" },
  preview:          { tone: "amber",    icon: "flask-conical",     label: "Vorschlag-Vorschau (Dry-Run)" },
  submitting:       { tone: "amber",    icon: "loader",            label: "Sende an Gate …" },
  waiting_approval: { tone: "amber",    icon: "clock",             label: "Wartet auf Freigabe" },
  approved:         { tone: "cyan",     icon: "shield-check",      label: "Freigegeben" },
  executed:         { tone: "emerald",  icon: "circle-check-big",  label: "Ausgeführt" },
  verified:         { tone: "emerald",  icon: "circle-check-big",  label: "Verifiziert" },
  denied:           { tone: "red",      icon: "ban",               label: "Abgelehnt" },
  error:            { tone: "red",      icon: "triangle-alert",    label: "Fehler" },
  auth_pending:     { tone: "gated",    icon: "triangle-alert",    label: "Freigabe-Anbindung: Auth ausstehend" },
};
const PROPOSE_TERMINAL = { approved: 1, executed: 1, verified: 1, denied: 1, error: 1, auth_pending: 1 };

// The propose lifecycle is generic; two profiles reuse the SAME overlay + gate
// flow. `engineering` = Codex task (repo/code). `study` = a Studium/privat
// Lernplan (L-3), routed to /study/plan/propose (workspace=studium) — never
// money/customer/personnel, never /approvals/decide. Only the copy + endpoint
// differ; the propose-only, gate-decides contract is identical.
const PROPOSE_PROFILES = {
  engineering: {
    api: PROPOSE_API, icon: "git-branch",
    title: "Codex-Aufgabe vorschlagen", subKind: "Engineering",
    fieldLabel: "Was soll Codex / Engineering tun?",
    placeholder: "z. B. Refactor: Deploy-Check als eigenes Modul extrahieren …",
    scopeHint: "Nur Engineering · kein Geld / Kunde / Personal",
  },
  study: {
    api: STUDY_PROPOSE_API, icon: "graduation-cap",
    title: "Lernplan vorschlagen", subKind: "Studium · privat",
    fieldLabel: "Welchen Lernplan soll Jarvis bis zur Klausur bauen?",
    placeholder: "z. B. Lernplan bis Thermodynamik-Klausur — Spaced Repetition, ≥3 Abrufe/Thema …",
    scopeHint: "Nur Studium / privat · kein Geld / Kunde / Personal",
  },
};
function proposeProfile(st) {
  return PROPOSE_PROFILES[(st && st.profile) || "engineering"] || PROPOSE_PROFILES.engineering;
}

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
  // Source reachable but the plugin holds read-only scope for it — writes are
  // gated (Phase 3). Distinct blue-grey so it never reads as an error/alarm.
  gated:       { tone: "gated",    label: "Gated · nur lesen" },
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
  // Kalender/Heute project the calendar-evidence read model: the next PRIVATE
  // start (kalender) / today's counts (today). Never the fixture. The Heute
  // tile keeps privat and Dispo STRUCTURALLY separate ("2+1", never a blended
  // sum), so the number can never be read as purely private.
  if (base.id === "kalender") return L.nextTime || "—";
  if (base.id === "today") {
    if (L.privateCount == null && L.firmaCount == null) return "—";
    const priv = L.privateCount || 0;
    const firma = L.firmaCount || 0;
    return firma > 0 ? priv + "+" + firma : String(priv);
  }
  // Lernplan: the fällig-count is the tile headline; empty (not-yet-synced) stays "—".
  if (base.id === "learning") return L.due != null ? String(L.due) : "—";
  if (L.active != null) return String(L.active);
  if (L.count != null) return String(L.count);
  if (L.services && L.services.active != null) return String(L.services.active);
  if (L.pending != null) return String(L.pending);
  return base.metric;
}
function deriveMetricSub(base, L) {
  if (base.id === "body") return L.tokenFresh ? base.metricSub : "WHOOP verbunden";
  if (base.id === "kalender") return "nächster Termin · privat";
  if (base.id === "today") {
    return (L.firmaCount || 0) > 0 ? "privat + Dispo (Firma-Signal)" : "Termine · privat";
  }
  if (base.id === "learning") {
    if (L.due == null) return "Anki-Sync bereit";
    return "fällig" + (L.retentionPct ? " · " + L.retentionPct + " Retention" : "");
  }
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
function Orb(props) {
  const canvasRef = useRef(null);
  const showLabel = !!(props && props.label);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    let raf = 0;
    let running = true;
    // Throttle the animated orb to ~30fps. shadowBlur (used per wave band / rim)
    // is one of the most expensive Canvas2D ops; halving the frame rate roughly
    // halves that cost with no perceptible change to this slow, ambient motion.
    let lastDraw = 0;
    const FRAME_MS = 33;

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
      if (t - lastDraw >= FRAME_MS) { lastDraw = t; draw(t); }
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

  // Pure ambient sphere. No interactive control lives *inside* the orb (the old
  // decorative mic button had no handler and sat over the animated hotspot — a
  // dead tap-target). Voice is always reached via the command bar / dock mic and
  // the persistent Jarvis tab. The "JARVIS" wordmark shows ONLY where the
  // reference keeps it (the desktop constellation core); on the mobile Jarvis
  // surface the sphere stays label-free so the moving wave never crosses text.
  return h(
    "div",
    { className: "mos__orb", "aria-hidden": "true" },
    h("canvas", { ref: canvasRef, className: "mos__orb-canvas" }),
    showLabel ? h("span", { className: "mos__orb-label" }, "JARVIS") : null,
  );
}

// Constellation connectors — faint curved lines from the orb to every module.
// Pure decoration; recomputed from live positions so drag keeps the web intact.
function Connectors(props) {
  const ox = CORE_POS.x, oy = CORE_POS.y;
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
  // Node liveness drives the planet's animation state (meaning, not decoration):
  //   live   = a fresh read-model → a slow breathing halo pulse
  //   stale  = a real-but-old source → a static amber ring (no motion)
  //   demo   = concept fixture → a calm static ring, never a live pulse
  const live = !m._demo && m._state === "fresh";
  const stale = !m._demo && (m._state === "stale" || m._state === "partial");
  const nodeState = live ? " is-live" : stale ? " is-stale" : "";
  return h(
    "div",
    {
      className: "mos__nodewrap mos--" + m.accent + (props.active ? " is-active" : "") + (props.dragging ? " is-dragging" : "") + nodeState,
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
      h(
        "span",
        { className: "mos__node-orbit" },
        h("span", { className: "mos__node-pulse", "aria-hidden": "true" }),
        h(Icon, { name: m.icon, size: 22 }),
      ),
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

// The lens is a *focus* surface, not a full list: it shows the top rows (the
// Nordstern shows 4) and honestly counts the rest as "+N weitere". This keeps
// the glass card compact so the JARVIS orb above it stays the visual centre
// instead of being swallowed by a 16-row live mission dump.
const LENS_MAX_ROWS = 4;

function FocusLens(props) {
  const data = resolveLens(props.focusId, props.liveModule);
  const closable = props.focusId !== "engineering";
  const stMeta = STATE_META[data.state] || STATE_META.loading;
  const allRows = data.rows || [];
  const rows = allRows.slice(0, LENS_MAX_ROWS);
  const extraRows = allRows.length - rows.length;
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
        h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Anheften", title: NOT_WIRED }, h(Icon, { name: "pin", size: 18 })),
        h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Einklappen", title: NOT_WIRED }, h(Icon, { name: "chevron-up", size: 18 })),
        h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Weitere Optionen", title: NOT_WIRED }, h(Icon, { name: "ellipsis", size: 18 })),
        closable &&
          h("button", { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Fokus schließen", onClick: props.onClose },
            h(Icon, { name: "x", size: 18 })),
      ),
    ),
    h(
      "div",
      { className: "mos__lens-body" },
      rows.length
        ? [
            ...rows.map((r, i) => h(LensRow, { key: r.title + i, row: r, index: i + 1 })),
            extraRows > 0
              ? h("div", { key: "more", className: "mos__lens-more" },
                  h(Icon, { name: "ellipsis", size: 14 }),
                  "+" + extraRows + " weitere",
                  h("span", { className: "mos__lens-more-src" }, " · " + data.source))
              : null,
          ]
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
      h("span", { className: "mos__meta mos__meta--src" }, h(Icon, { name: "git-branch", size: 14 }), "Quelle: ", h("b", null, data.source)),
      h("span", { className: "mos__meta mos__meta--fresh" }, h(Icon, { name: "clock", size: 14 }), "Aktualität: ", h("b", null, data.freshness)),
      h("span", { className: "mos__meta mos__meta--perm" }, h(Icon, { name: "shield-check", size: 14, label: "Berechtigungen geprüft" }), "Berechtigung: ", h("b", null, data.permission)),
    ),
    h(
      "div",
      { className: "mos__lens-tools" },
      // The ONE wired action: propose an engineering/Codex task (propose-only,
      // gate-led). Everything else here stays honestly "noch nicht verbunden".
      props.onPropose
        ? h("button", {
            key: "propose", type: "button", className: "mos__tool mos__tool--propose",
            onClick: () => props.onPropose(),
            title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst.",
          }, h(Icon, { name: "git-branch", size: 15 }), "Codex-Aufgabe vorschlagen")
        : null,
      // Lernplan: the wired read-only drill. Opens a preview session (Frage →
      // Antwort → Bewertung-Vorschau); grades/persistence stay in Anki/AnkiDroid.
      props.onReview && props.focusId === "learning"
        ? h("button", {
            key: "review", type: "button", className: "mos__tool mos__tool--review",
            onClick: () => props.onReview(),
            title: "Karten üben (Vorschau) — Bewertung & Speicherung in Anki/AnkiDroid.",
          }, h(Icon, { name: "play", size: 15 }), "Lernen · Drill")
        : null,
      // L-3: the Lern-Coach — Klausur-Countdown, Feynman (Jarvis-graded) und
      // Prüfungsplan-Vorschlag (gated). Read + propose-only; kein Anki-Write.
      props.onCoach && props.focusId === "learning"
        ? h("button", {
            key: "coach", type: "button", className: "mos__tool mos__tool--coach",
            onClick: () => props.onCoach(),
            title: "Countdown, Feynman (von Jarvis bewertet) und Lernplan-Vorschlag (gated).",
          }, h(Icon, { name: "graduation-cap", size: 15 }), "Lern-Coach")
        : null,
      LENS_TOOLS.map((tl) =>
        h("button", { key: tl.label, type: "button", className: "mos__tool", title: NOT_WIRED }, h(Icon, { name: tl.icon, size: 15 }), tl.label)),
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
      // (No progress bar — there is no per-event completion signal in the read
      // model, so a fixed-width bar would fake a state that doesn't exist.)
      props.active && m ? h(StatePip, { module: m }) : null,
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
        : [h(Icon, { key: "i", name: "heart-pulse", size: 22 }), h("b", { key: "v", className: "mos__whoop-conn" }, "Verbunden"), h("span", { key: "l" }, "WHOOP")],
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
  // Honest peripheral "Live-Signale": only modules backed by a real read-model
  // (never demo), showing their genuine state + freshness. Fills the panel's
  // lower fold with useful signal instead of dead space — no invented values.
  const liveSignals = Object.keys(byId)
    .map((k) => byId[k])
    .filter((m) => m && !m._demo && m.title && m.icon &&
      (m._state === "fresh" || m._state === "stale" || m._state === "partial"))
    .sort((a, b) => (a._state === "fresh" ? -1 : 1) - (b._state === "fresh" ? -1 : 1))
    .slice(0, 4);
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
              h("span", { className: "mos__tlfocus-top-title", title: r.title }, r.title),
              h("span", { className: "mos__tlfocus-top-sub" }, r.sub),
            ),
          )),
      ),
      ),
      // WHOOP – Körperstatus. When the connector holds no detail values (no token
      // in the plugin context) we do NOT render four dead "—" tiles that dominate
      // the fold — we show the honest connection ring plus one compact note naming
      // what the authorized connector would provide. If real values ever arrive
      // (body live + numeric stats) the 2×2 value grid renders instead. Nothing
      // is ever fabricated.
      (function () {
        const bodyLive = body && !body._demo && body._state === "fresh";
        const stats = [
          { k: "Schlaf", icon: "moon", v: bodyLive ? body._sleep : null },
          { k: "HRV", icon: "activity", v: bodyLive ? body._hrv : null },
          { k: "Ruhepuls", icon: "heart-pulse", v: bodyLive ? body._rhr : null },
          { k: "Belastung", icon: "zap", v: bodyLive ? body._strain : null },
        ];
        const hasVals = stats.some((s) => s.v != null);
        return h(
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
            { className: "mos__tlfocus-whoop-row" + (hasVals ? "" : " is-compact") },
            h(WhoopRing, { module: body }),
            hasVals
              ? h(
                  "div",
                  { className: "mos__tlfocus-stats" },
                  stats.map((s) =>
                    h(
                      "div",
                      { key: s.k, className: "mos__tlfocus-stat" },
                      h("span", { className: "mos__tlfocus-stat-k" }, h(Icon, { name: s.icon, size: 12 }), s.k),
                      h("span", { className: "mos__tlfocus-stat-v" }, s.v),
                    )),
                )
              : h(
                  "div",
                  { className: "mos__tlfocus-whoop-empty" },
                  h("span", { className: "mos__tlfocus-whoop-empty-title" }, "Keine Detailwerte im Plugin-Kontext"),
                  h("span", { className: "mos__tlfocus-whoop-empty-note" },
                    "Schlaf · HRV · Ruhepuls · Belastung nur über den autorisierten WHOOP-Connector."),
                ),
          ),
        );
      })(),
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
      // Live-Signale — real read-model modules only (honest state + freshness)
      liveSignals.length
        ? h(
            "section",
            { className: "mos__tlfocus-sec mos__tlfocus-signals" },
            h("h3", { className: "mos__tlfocus-h3" }, h(Icon, { name: "activity", size: 14 }), "Live-Signale",
              h("span", { className: "mos__tlfocus-sig-count" }, liveSignals.length + " aktiv")),
            h(
              "div",
              { className: "mos__tlfocus-sig-grid" },
              liveSignals.map((m) => {
                const fresh = freshnessLabel(m._observedAt);
                const sm = STATE_META[m._state] || STATE_META.loading;
                return h(
                  "div",
                  { key: m.id, className: "mos__tlfocus-sig mos--" + m.accent },
                  h("span", { className: "mos__tlfocus-sig-icon" }, h(Icon, { name: m.icon, size: 16 })),
                  h(
                    "span",
                    { className: "mos__tlfocus-sig-body" },
                    h("span", { className: "mos__tlfocus-sig-title" }, m.title),
                    h("span", { className: "mos__tlfocus-sig-meta" },
                      h("span", { className: "mos__tlfocus-sig-dot mos__tlfocus-sig-dot--" + sm.tone, "aria-hidden": "true" }),
                      m._metric != null && m._metric !== "—" ? h("b", null, m._metric) : null,
                      fresh ? h("span", { className: "mos__tlfocus-sig-age" }, fresh) : sm.label),
                  ),
                );
              }),
            ),
          )
        : null,
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

// Curated "Jetzt wichtig" zone — the two decisions that matter now (next event +
// current focus), denser than a full card. Concept-badged: these are fixtures
// until a calendar/focus read-model lands, so it must not read as live truth.
function MobileHeute() {
  return h(
    "section",
    { className: "mos__mheute", "aria-label": "Jetzt wichtig" },
    h(
      "div",
      { className: "mos__mheute-head" },
      h("h2", null, "Jetzt wichtig"),
      h("span", { className: "mos__pip mos__pip--konzept" }, h(Icon, { name: "flask-conical", size: 11 }), "Konzept"),
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
  // Home is the reference's calm start surface: the "Heute" summary + the module
  // grid + the command dock. The big Jarvis hero banner and the horizontal
  // Live-Signale rail were removed — both duplicated the grid (a third redundant
  // orb + repeated module metrics) and pushed half the cards below the fold. Each
  // grid card still carries its honest StatePip (live state + freshness), so the
  // read-model provenance is unchanged; voice stays reachable via the dock mic
  // and the persistent Jarvis tab.
  return h(
    "div",
    { className: "mos__m-scroll" },
    // Cockpit stack (UI-SPEC §3) — KPI strip · Jarvis teaser · Heute · Firma ·
    // Approvals — the glanceable command surface, above the module grid.
    h(MobileCockpit, {
      byId: props.byId, workspace: props.workspace || "private", load: props.loadState,
      cockpit: props.cockpit || {}, cockpitLoad: props.cockpitLoad,
      onGoJarvis: props.onGoJarvis, onGoTimeline: props.onGoTimeline,
      onGoApprovals: props.onGoApprovals, onGoFirma: props.onGoFirma,
    }),
    h(
      "div",
      { className: "mos__mgrid-head" },
      h("span", { className: "mos__m-h3" }, h(Icon, { name: "layout-grid", size: 14 }), "Deine Module"),
    ),
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
  const label = jarvisStateText(props.stateIndex);
  const active = st.id !== "ready";
  const quick = [
    { icon: "sun", label: "Wetter", accent: "cyan" },
    { icon: "heart-pulse", label: "Recovery", accent: "emerald" },
    { icon: "clock", label: "Deep Work", accent: "amber" },
  ];
  return h(
    "div",
    { className: "mos__mjarvis" },
    h(
      "header",
      { className: "mos__mjarvis-top" },
      h(
        "span",
        { className: "mos__mjarvis-id" },
        h("span", { className: "mos__mjarvis-name" }, "Mikael"),
        h("span", { className: "mos__mjarvis-date" }, TODAY.long),
      ),
      h("span", { className: "mos__mjarvis-avatar", "aria-hidden": "true" }, h(Icon, { name: "circle-user", size: 22 })),
    ),
    h(
      "div",
      { className: "mos__mjarvis-stage" },
      h("div", { className: "mos__mjarvis-orb" + (active ? " is-active" : "") }, h(Orb, null)),
      // state line is a status region so a reader hears "Ich höre zu" on change
      h("span", { className: "mos__mjarvis-state", role: "status", "aria-live": "polite" }, label),
      h(
        "div",
        { className: "mos__mjarvis-wavewrap" },
        h(WaveForm, null),
        h("span", { className: "mos__mjarvis-query" }, active ? "„Wie ist meine Recovery?“" : "Sage „Jarvis“ …"),
      ),
    ),
    h(
      "button",
      { type: "button", className: "mos__mjarvis-ptt", onClick: props.onSpeak, "aria-label": "Halten zum Sprechen (Demo)" },
      h(Icon, { name: "mic", size: 20 }), "Halten zum Sprechen",
    ),
    h(
      "div",
      { className: "mos__mjarvis-quick" },
      quick.map((q) =>
        h(
          "button",
          { key: q.label, type: "button", className: "mos__mquick mos--" + q.accent, onClick: () => props.onQuick(q.label) },
          h("span", { className: "mos__mquick-icon" }, h(Icon, { name: q.icon, size: 20 })), q.label,
        )),
    ),
    h("span", { className: "mos__mjarvis-note" }, h(Icon, { name: "flask-conical", size: 11 }), "Sprachdemo · schreibt nichts"),
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
    { className: "mos__mtabs", "aria-label": "Hauptnavigation" },
    M_TABS.map((t) => {
      const isJarvis = t.id === "jarvis";
      return h(
        "button",
        {
          key: t.id,
          type: "button",
          className: "mos__mtab" + (props.active === t.id ? " is-active" : "") + (isJarvis ? " mos__mtab--jarvis" : ""),
          "aria-current": props.active === t.id ? "page" : undefined,
          onClick: () => props.onChange(t.id),
        },
        isJarvis
          ? h(
              "span",
              { className: "mos__mtab-orb", "aria-hidden": "true" },
              h("span", { className: "mos__mtab-orb-core" }),
              h(Icon, { name: "mic", size: 20 }),
            )
          : h("span", { className: "mos__mtab-icon" }, h(Icon, { name: t.icon, size: 22 })),
        h("span", { className: "mos__mtab-label" }, t.label),
      );
    }),
  );
}

const SHEET_DETENTS = [46, 76, 100];

function MobileSheet(props) {
  const [dragVh, setDragVh] = useState(null);
  const dragRef = useRef(null);
  // Mirror the live drag height into a ref so the drag listeners don't need
  // `dragVh` in their dependency array — otherwise the effect tore down and
  // re-registered all four window listeners on EVERY drag frame (~240 add/remove
  // per second). Now they register once per open/detent.
  const dragVhRef = useRef(null);
  const sheetRef = useRef(null);
  const restoreRef = useRef(null);
  const setDrag = (v) => { dragVhRef.current = v; setDragVh(v); };
  useEffect(() => {
    function move(ev) {
      const d = dragRef.current;
      if (!d) return;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const vh = Math.max(16, Math.min(100, d.startVh + ((d.startY - cy) / window.innerHeight) * 100));
      setDrag(vh);
    }
    function up() {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      const cur = dragVhRef.current != null ? dragVhRef.current : SHEET_DETENTS[props.detent];
      // pure tap on the grabber (no meaningful drag) → cycle detent upward
      if (Math.abs(cur - d.startVh) < 3) {
        setDrag(null);
        props.onDetent((props.detent + 1) % SHEET_DETENTS.length);
        return;
      }
      if (cur < 30) { setDrag(null); props.onClose(); return; }
      let best = 0, bd = 1e9;
      SHEET_DETENTS.forEach((hh, i) => { const dd = Math.abs(hh - cur); if (dd < bd) { bd = dd; best = i; } });
      setDrag(null);
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
  }, [props.detent, props.open, props.onClose, props.onDetent]);

  // Modal focus management: on open, remember what was focused and move focus
  // into the dialog; on close, restore it. (Escape-to-close is handled by the
  // shell keydown handler.)
  useEffect(() => {
    if (!props.open) return;
    restoreRef.current = (typeof document !== "undefined" && document.activeElement) || null;
    const el = sheetRef.current;
    if (el && el.focus) { try { el.focus(); } catch (_e) {} }
    return () => {
      const r = restoreRef.current;
      if (r && r.focus) { try { r.focus(); } catch (_e) {} }
    };
  }, [props.open]);

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
        ref: sheetRef,
        className: "mos__sheet" + (dragVh != null ? " is-dragging" : ""),
        style: { height: height + "vh" },
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Fokus: " + data.title,
        tabIndex: -1,
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
      (function () {
        // The sheet is a FOCUS surface, not an unbounded list: cap to the same
        // top-N the desktop lens uses and honestly count the rest as "+N weitere"
        // (a real live module can carry 16+ rows — dumping them all turns the
        // focus sheet into a scroll dump).
        const allRows = data.rows || [];
        const rows = allRows.slice(0, LENS_MAX_ROWS);
        const extra = allRows.length - rows.length;
        return h(
          "div",
          { className: "mos__sheet-body" },
          rows.length
            ? [
                ...rows.map((r, i) => h(LensRow, { key: r.title + i, row: r, index: i + 1 })),
                extra > 0
                  ? h("div", { key: "more", className: "mos__lens-more" },
                      h(Icon, { name: "ellipsis", size: 14 }),
                      "+" + extra + " weitere",
                      h("span", { className: "mos__lens-more-src" }, " · " + data.source))
                  : null,
              ]
            : h(
                "div",
                { className: "mos__lens-empty mos--" + stMeta.tone },
                h(Icon, { name: data.state === "unavailable" || data.state === "error" ? "unplug" : "inbox", size: 22 }),
                h("span", { className: "mos__lens-empty-title" }, stMeta.label),
                h("span", { className: "mos__lens-empty-note" }, data.note || "Keine Daten von dieser Quelle."),
              ),
        );
      })(),
      h(
        "footer",
        { className: "mos__sheet-foot" },
        // Phase-3 actions are shown but explicitly NOT wired — no write path
        // exists yet. Buttons are disabled + carry a "Gate" pill so the surface
        // is honest about what it can and cannot do (no gate bypass).
        h(
          "div",
          { className: "mos__sheet-actions", "aria-label": "Aktionen" },
          // "Als Codex-Task" is the ONE wired action (propose-only, gate-led).
          // "Termin vorschlagen" (Kalender) + FSM stay honestly not-connected.
          h(
            "button",
            { key: "propose", type: "button", className: "mos__sheet-act mos__sheet-act--propose",
              onClick: () => props.onPropose && props.onPropose(data.title || ""),
              title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst." },
            h(Icon, { name: "git-branch", size: 15 }), "Als Codex-Task",
            h("span", { className: "mos__sheet-act-gate mos__sheet-act-gate--live" }, h(Icon, { name: "shield-check", size: 10 }), "propose"),
          ),
          // Lernplan gets the wired read-only drill (Vorschau, nichts gespeichert).
          props.onReview && props.focusId === "learning"
            ? h(
                "button",
                { key: "review", type: "button", className: "mos__sheet-act mos__sheet-act--review",
                  onClick: () => props.onReview(),
                  title: "Karten üben (Vorschau) — Bewertung & Speicherung in Anki/AnkiDroid." },
                h(Icon, { name: "play", size: 15 }), "Lernen · Drill",
                h("span", { className: "mos__sheet-act-gate mos__sheet-act-gate--live" }, h(Icon, { name: "eye", size: 10 }), "read-only"),
              )
            : null,
          // L-3: Lern-Coach (Countdown · Feynman via Jarvis · Lernplan-Vorschlag).
          props.onCoach && props.focusId === "learning"
            ? h(
                "button",
                { key: "coach", type: "button", className: "mos__sheet-act mos__sheet-act--coach",
                  onClick: () => props.onCoach(),
                  title: "Countdown, Feynman (von Jarvis bewertet) und Lernplan-Vorschlag (gated)." },
                h(Icon, { name: "graduation-cap", size: 15 }), "Lern-Coach",
                h("span", { className: "mos__sheet-act-gate mos__sheet-act-gate--live" }, h(Icon, { name: "sparkles", size: 10 }), "Jarvis"),
              )
            : null,
          h(
            "button",
            { key: "cal", type: "button", className: "mos__sheet-act", disabled: true, "aria-disabled": "true",
              title: "Noch nicht verbunden — Kalender-Vorschlag folgt (über Gates, propose-only)." },
            h(Icon, { name: "calendar-plus", size: 15 }), "Termin vorschlagen",
            h("span", { className: "mos__sheet-act-gate" }, h(Icon, { name: "lock", size: 10 }), "nicht verbunden"),
          ),
        ),
        h(
          "span",
          { className: "mos__sheet-prov" },
          h(Icon, { name: "git-branch", size: 12 }), "Quelle ", h("b", null, data.source),
          " · Stand ", h("b", null, data.freshness), " · ", data.permission,
        ),
        h("button", { type: "button", className: "mos__sheet-cta mos--" + data.accent }, h(Icon, { name: "panels-top-left", size: 16 }), "Details anzeigen"),
      ),
    ),
  );
}

// Full mobile screen for the two M2 drill-downs (FIRMA · Entscheidungen). Pushed
// ABOVE the tab content — covering the tab bar + command dock — with a top-left
// back-chevron, reusing the tab-suppression precedent rather than a bottom-sheet.
function MobileScreen(props) {
  const isFirma = props.kind === "firma";
  return h("div", { className: "mos__mscreen", role: "region",
      "aria-label": isFirma ? "Firma / Rise-L" : "Entscheidungen" },
    h("header", { className: "mos__mscreen-top" },
      h("button", { type: "button", className: "mos__mscreen-back", onClick: props.onBack, "aria-label": "Zurück zum Cockpit" },
        h(Icon, { name: "chevron-left", size: 22 })),
      h("span", { className: "mos__mscreen-titles" },
        h("span", { className: "mos__mscreen-title" }, isFirma ? "Firma / Rise-L" : "Entscheidungen"),
        h("span", { className: "mos__mscreen-sub" },
          h(Icon, { name: "lock", size: 11 }),
          isFirma ? "read-only Projektion · Deep-Links ins FSM" : "Entscheidung nur durch dich (Operator)"))),
    h("main", { className: "mos__mscreen-body" },
      isFirma
        ? h(FirmaScene, { firma: props.firma, load: props.firmaLoad })
        : h(ApprovalsScene, { approvals: props.approvals, load: props.cockpitLoad,
            details: props.details, detailLoading: props.detailLoading, onLoadDetail: props.onLoadDetail })));
}

function MobileShell(props) {
  const tab = props.mobileTab;
  if (props.mobileScreen) {
    return h(MobileScreen, {
      kind: props.mobileScreen, onBack: props.onScreenBack,
      firma: props.firma, firmaLoad: props.firmaLoad,
      approvals: props.cockpit && props.cockpit.approvals, cockpitLoad: props.cockpitLoad,
      details: props.approvalDetails, detailLoading: props.approvalDetailLoading, onLoadDetail: props.onLoadDetail,
    });
  }
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
    content = h(MobileHome, {
      byId: props.byId, modules: props.modules, onOpen: props.onOpen,
      stateIndex: props.stateIndex, greeting: props.greeting, onGoJarvis: props.onGoJarvis,
      workspace: props.workspace, loadState: props.loadState,
      cockpit: props.cockpit, cockpitLoad: props.cockpitLoad,
      onChip: props.onChip, onGoTimeline: props.onGoTimeline,
      onGoApprovals: props.onGoApprovals, onGoFirma: props.onGoFirma,
    });
  }
  return h(
    "div",
    { className: "mos__m" },
    h("h1", { className: "mos__sr-only" }, "MIKAEL OS — Persönliches System"),
    h(LiveAnnouncer, { message: props.announce }),
    // The Jarvis surface has its own name/date header; the Timeline tab carries a
    // single compact "Living Timeline" header of its own — so the global MIKAEL OS
    // bar is suppressed on both to avoid a stacked double header (and, on Timeline,
    // a second clock that could disagree with the "now" marker).
    (tab === "jarvis" || tab === "timeline") ? null : h(MobileTopBar, { loadState: props.loadState, liveCount: props.liveCount }),
    h("main", { className: "mos__m-main", role: "main" }, content),
    showDock ? h(MobileCommandDock, { command: props.command, onCommand: props.onCommand, onSubmit: props.onSubmit, onSpeak: props.onSpeak }) : null,
    h(MobileTabBar, { active: tab, onChange: props.onMobileTab }),
    h(MobileSheet, {
      open: props.sheetOpen,
      detent: props.sheetDetent,
      onDetent: props.onSheetDetent,
      onClose: props.onSheetClose,
      focusId: props.focusId,
      liveModule: props.byId[props.focusId],
      onPropose: props.onPropose,
      onReview: props.onReview,
      onCoach: props.onCoach,
    }),
  );
}

function SceneSwitcher(props) {
  // Order per UI-SPEC §0: Cockpit (default) · Konstellation · Timeline.
  return h(
    "div",
    { className: "mos__scenes", role: "tablist", "aria-label": "Ansicht wechseln" },
    [{ id: "cockpit", icon: "layout-dashboard", label: "Cockpit" },
     { id: "constellation", icon: "orbit", label: "Konstellation" },
     { id: "timeline", icon: "waypoints", label: "Timeline" }].map((s) =>
      h(
        "button",
        { key: s.id, type: "button", role: "tab", className: "mos__scene-tab",
          "aria-selected": props.scene === s.id ? "true" : "false",
          "aria-pressed": props.scene === s.id ? "true" : "false",
          onClick: () => props.onScene(s.id) },
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
      props.onBack
        ? h("button", { type: "button", className: "mos__topback", onClick: props.onBack,
            "aria-label": "Zurück zum Cockpit" },
            h(Icon, { name: "chevron-left", size: 16 }), "Cockpit")
        : h(SceneSwitcher, { scene: props.scene, onScene: props.onScene }),
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
      // Weather is DROPPED on the M2 drill-down scenes: there is no weather data
      // source in the stack, so a "22° Klar" reading would be a fabricated value —
      // the honesty doctrine forbids it. The clock (real, static) stays.
      props.onBack ? null : h(
        "span",
        { className: "mos__topchip" },
        h(Icon, { name: "cloud-moon", size: 16 }),
        h("strong", null, "22°"),
        " Klar",
      ),
      h(
        "span",
        { className: "mos__topchip mos__topchip-time" },
        // Scene-consistent clock: on the Timeline the bar shows the same "now"
        // the Jarvis marker sits at (16:42), so a single screen never shows two
        // contradicting times; the Konstellation keeps its night reference time.
        h("b", null, props.scene === "timeline" ? TIMELINE_NOW.time : "22:30"),
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

// ===========================================================================
// Phase 3 · PROPOSE LIFECYCLE — the ONE write-adjacent action, propose-only.
// A modal overlay (reused desktop + mobile) that walks: Entwurf → Dry-Run-
// Vorschau → [Nutzer klickt „An Gate senden"] → Wartet auf Freigabe → (Receipt)
// Freigegeben/Ausgeführt bzw. Abgelehnt/Fehler/Auth-ausstehend. The plugin
// never executes and never self-approves; every live step follows a real
// server-side receipt (read via /actions/receipt). Nothing here calls
// /approvals/decide — that is the operator's path, not the plugin's.
// ===========================================================================
function ProposeStatusLine(props) {
  const meta = PROPOSE_META[props.phase] || PROPOSE_META.error;
  const spinning = props.phase === "submitting" || props.phase === "loading";
  return h(
    "div",
    { className: "mos__pp-status mos__pp-status--" + meta.tone, role: "status", "aria-live": "polite" },
    h("span", { className: "mos__pp-status-icon" + (spinning ? " is-spin" : "") }, h(Icon, { name: meta.icon, size: 16 })),
    h("span", { className: "mos__pp-status-label" }, meta.label),
  );
}

function ProposeFlow(props) {
  const st = props.state;
  if (!st) return null;
  const phase = st.phase;
  const prof = proposeProfile(st);
  const meta = PROPOSE_META[phase] || PROPOSE_META.error;
  const cp = st.controlPlane || (st.preview && st.preview.controlPlane);
  const reachable = cp ? cp.reachable : null;
  const plan = st.preview && st.preview.plan;
  const gate = (st.preview && st.preview.predictedGate) || st.gate;
  const isTerminal = !!PROPOSE_TERMINAL[phase];
  const canSend = phase === "preview" && (st.objective || "").trim().length > 0;

  const body = [];
  // Always-on honest banner: propose-only, gate decides. A `lock` (gated
  // boundary) — never a check-mark, which would read as "done/verified".
  body.push(h(
    "div",
    { key: "banner", className: "mos__pp-honest" },
    h(Icon, { name: "lock", size: 13 }),
    "Propose-only — das Plugin führt nicht aus. Dein Gate entscheidet (ALLOW / DENY / Freigabe).",
  ));

  // Status pill in EVERY phase (aria-live) so the flow Entwurf → Vorschau →
  // Wartet-auf-Freigabe → Receipt/Abgelehnt is marked equally strongly for
  // sighted users AND assistive tech (WCAG 4.1.3 Status Messages) — not only
  // from waiting_approval onward.
  body.push(h(ProposeStatusLine, { key: "status", phase: phase }));

  if (phase === "compose" || phase === "loading") {
    body.push(h(
      "label",
      { key: "compose", className: "mos__pp-field" },
      h("span", { className: "mos__pp-field-k" }, prof.fieldLabel),
      h("textarea", {
        className: "mos__pp-textarea",
        rows: 3,
        placeholder: prof.placeholder,
        value: st.objective || "",
        disabled: phase === "loading",
        onChange: (e) => props.onObjective(e.target.value),
        autoFocus: true,
      }),
      h("span", { className: "mos__pp-scope" }, h(Icon, { name: "lock", size: 11 }),
        prof.scopeHint),
    ));
  }

  if (phase === "preview" && plan) {
    body.push(h(
      "div",
      { key: "preview", className: "mos__pp-preview" },
      h("div", { className: "mos__pp-line" },
        h("span", { className: "mos__pp-line-k" }, "Das wird vorgeschlagen"),
        h("span", { className: "mos__pp-line-v mos__pp-objective" }, plan.objective)),
      h("div", { className: "mos__pp-grid" },
        h("div", { className: "mos__pp-cell" },
          h("span", { className: "mos__pp-cell-k" }, h(Icon, { name: "code-xml", size: 12 }), "Workspace"),
          h("span", { className: "mos__pp-cell-v" }, plan.workspaceLabel)),
        h("div", { className: "mos__pp-cell" },
          h("span", { className: "mos__pp-cell-k" }, h(Icon, { name: "git-branch", size: 12 }), "Job-Typ"),
          h("span", { className: "mos__pp-cell-v" }, plan.jobType)),
        h("div", { className: "mos__pp-cell mos__pp-cell--wide" },
          // `clock` (pending), NOT shield-check — a check-mark here would falsely
          // read as "erledigt", while the proposal is still open.
          h("span", { className: "mos__pp-cell-k" }, h(Icon, { name: "clock", size: 12 }), "Braucht Freigabe"),
          h("span", { className: "mos__pp-cell-v mos__pp-gate" }, (gate && gate.human) || plan.gateHuman))),
      h("div", { className: "mos__pp-caps" },
        (plan.capabilities || []).map((c) => h("span", { key: c, className: "mos__pp-cap" }, c))),
      h("div", { className: "mos__pp-cp" + (reachable ? " is-ok" : " is-pending") },
        h(Icon, { name: reachable ? "shield-check" : "triangle-alert", size: 12 }),
        reachable ? "Gate-Anbindung bereit (Control-Plane erreichbar · Loopback-Auth)"
                  : "Freigabe-Anbindung: Auth ausstehend (Control-Plane nicht erreichbar)"),
    ));
  }

  if (isTerminal || phase === "waiting_approval" || phase === "submitting") {
    // (status pill is rendered once, above, for every phase)
    if (st.objective) {
      body.push(h("div", { key: "obj", className: "mos__pp-echo" },
        h(Icon, { name: "git-branch", size: 12 }), st.objective));
    }
    if (st.cardId) {
      // Card-reference glyph tracks the lifecycle icon, so shield-check appears
      // here ONLY when the phase is actually `approved` — never during waiting.
      body.push(h("div", { key: "card", className: "mos__pp-receipt" },
        h(Icon, { name: meta.icon, size: 12 }), "Approval-Card ", h("b", null, st.cardId)));
    }
    if (st.note) body.push(h("p", { key: "note", className: "mos__pp-note" }, st.note));
    if (phase === "denied" || phase === "error" || phase === "auth_pending") {
      body.push(h("p", { key: "hint", className: "mos__pp-note mos__pp-note--muted" },
        "Kein Gate umgangen — dieser Zustand kommt direkt von deinem Gate bzw. der Anbindung."));
    }
  }

  if (st.error && !st.note) body.push(h("p", { key: "err", className: "mos__pp-note" }, st.error));

  // Footer actions per phase.
  const actions = [];
  if (phase === "compose" || phase === "loading") {
    actions.push(h("button", { key: "cancel", type: "button", className: "mos__pp-btn", onClick: props.onClose }, "Abbrechen"));
    actions.push(h("button", {
      key: "prev", type: "button", className: "mos__pp-btn mos__pp-btn--primary",
      disabled: phase === "loading" || !(st.objective || "").trim(),
      onClick: () => props.onPreview(st.objective),
    }, h(Icon, { name: "flask-conical", size: 15 }), "Vorschau erstellen"));
  } else if (phase === "preview") {
    actions.push(h("button", { key: "back", type: "button", className: "mos__pp-btn", onClick: () => props.onPreview(null, true) }, "Zurück"));
    actions.push(h("button", {
      key: "send", type: "button", className: "mos__pp-btn mos__pp-btn--send",
      disabled: !canSend,
      title: "Feuert live an dein Gate — erst dieser Klick sendet etwas.",
      onClick: () => props.onSend(st.objective),
    }, h(Icon, { name: "send-horizontal", size: 15 }), "An Gate senden"));
  } else if (phase === "waiting_approval") {
    actions.push(h("button", { key: "close", type: "button", className: "mos__pp-btn", onClick: props.onClose }, "Schließen"));
    actions.push(h("button", {
      key: "check", type: "button", className: "mos__pp-btn mos__pp-btn--primary",
      onClick: () => props.onPoll(st),
    }, h(Icon, { name: "loader", size: 15 }), "Status prüfen"));
  } else if (phase === "submitting" || phase === "loading") {
    // no actions while in-flight
  } else {
    actions.push(h("button", { key: "done", type: "button", className: "mos__pp-btn mos__pp-btn--primary", onClick: props.onClose }, "Schließen"));
  }

  return h(
    "div",
    { className: "mos__pp-scrim", onClick: props.onClose },
    h(
      "section",
      {
        className: "mos__pp mos__pp--" + meta.tone,
        // The dialog NAME carries the live state so a screen reader announces the
        // real phase (Entwurf / Wartet auf Freigabe / Freigegeben / Abgelehnt …),
        // not a frozen "…vorschlagen" (WCAG 4.1.2 Name/Role/Value, 2.4.6).
        role: "dialog", "aria-modal": "true",
        "aria-label": prof.title + " · " + meta.label,
        onClick: (e) => e.stopPropagation(),
      },
      h(
        "header",
        { className: "mos__pp-head" },
        // Badge glyph tracks the lifecycle icon (form, not colour alone).
        h("span", { className: "mos__pp-badge" }, h(Icon, { name: meta.icon, size: 18 })),
        h(
          "span",
          { className: "mos__pp-titles" },
          h("span", { className: "mos__pp-title" }, prof.title),
          h("span", { className: "mos__pp-sub" }, prof.subKind + " · " + meta.label),
        ),
        h("button", { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Schließen", onClick: props.onClose }, h(Icon, { name: "x", size: 18 })),
      ),
      h("div", { className: "mos__pp-body" }, body),
      h("footer", { className: "mos__pp-foot" }, actions),
    ),
  );
}

// ===========================================================================
// L-2 · REVIEW / DRILL surface — a read-only spaced-repetition drill over the
// Anki-Sync collection. Card Frage → umdrehen → Antwort; four rating buttons
// (Nochmal / Schwer / Gut / Einfach) carry an FSRS interval PREVIEW. It is
// HONEST about what it is: a preview/drill. The grade + persistence happen in
// Anki / AnkiDroid, never here — the plugin only reads (mode=ro). Keyboard:
// Space/Enter = umdrehen, 1–4 = bewerten, Esc = schließen.
// ===========================================================================
const REVIEW_RATING_FALLBACK = [
  { key: "again", label: "Nochmal", accent: "red", icon: "rotate-ccw" },
  { key: "hard", label: "Schwer", accent: "amber", icon: "hourglass" },
  { key: "good", label: "Gut", accent: "emerald", icon: "circle-check-big" },
  { key: "easy", label: "Einfach", accent: "cyan", icon: "fast-forward" },
];

// The honest "not persisted" banner — one source of truth for desktop + mobile.
const REVIEW_HONEST = "Vorschau/Drill — Bewertung & Speicherung in Anki / AnkiDroid. Hier wird nichts gespeichert.";

function ReviewRail(props) {
  const d = props.data || {};
  const retention = d.retentionPct || (d.retention != null ? Math.round(d.retention * 100) + " %" : "—");
  const streak = d.streak != null ? d.streak : null;
  const learned = d.learnedToday != null ? d.learnedToday : null;
  const items = [
    { icon: "target", accent: "violet", k: "Retention", v: retention, sub: "30 T" },
    { icon: "flame", accent: "amber", k: "Streak", v: streak != null ? streak + " T" : "—", sub: "in Folge" },
    { icon: "clock", accent: "cyan", k: "Heute gelernt", v: learned != null ? String(learned) : "—", sub: "Reviews" },
  ];
  return h(
    "aside",
    { className: "mos__rv-rail", "aria-label": "Lern-Kennzahlen" },
    items.map((it) =>
      h(
        "div",
        { key: it.k, className: "mos__rv-stat mos--" + it.accent },
        h("span", { className: "mos__rv-stat-icon" }, h(Icon, { name: it.icon, size: 18 })),
        h("span", { className: "mos__rv-stat-v" }, it.v),
        h("span", { className: "mos__rv-stat-k" }, it.k),
        h("span", { className: "mos__rv-stat-sub" }, it.sub),
      )),
  );
}

function ReviewRatingRow(props) {
  const ratings = (props.data && props.data.ratings && props.data.ratings.length)
    ? props.data.ratings : REVIEW_RATING_FALLBACK;
  const card = props.card || {};
  const previews = card.preview || null;
  return h(
    "div",
    { className: "mos__rv-ratings", role: "group", "aria-label": "Bewertung (Vorschau, nicht gespeichert)" },
    ratings.map((r, i) => {
      const iv = previews && previews[r.key] ? previews[r.key] : null;
      return h(
        "button",
        {
          key: r.key, type: "button",
          className: "mos__rv-rate mos--" + r.accent,
          onClick: () => props.onRate(r.key),
          "aria-label": r.label + (iv ? " · Vorschau " + iv : "") + " (Taste " + (i + 1) + ")",
        },
        h(
          "span",
          { className: "mos__rv-rate-top" },
          h("span", { className: "mos__rv-rate-icon" }, h(Icon, { name: r.icon, size: 16 })),
          h("span", { className: "mos__rv-rate-label" }, r.label),
          h("span", { className: "mos__rv-rate-key", "aria-hidden": "true" }, String(i + 1)),
        ),
        h(
          "span",
          { className: "mos__rv-rate-iv" },
          h("span", { className: "mos__rv-rate-iv-k" }, "Vorschau"),
          h("span", { className: "mos__rv-rate-iv-v" }, iv || "—"),
        ),
      );
    }),
  );
}

function ReviewCard(props) {
  const card = props.card;
  const flipped = props.flipped;
  const reduce = prefersReducedMotion();
  return h(
    "div",
    { className: "mos__rv-card mos--violet" + (flipped ? " is-flipped" : "") + (reduce ? " is-static" : "") },
    h(
      "div",
      { className: "mos__rv-card-head" },
      h("span", { className: "mos__rv-card-deck" }, h(Icon, { name: "graduation-cap", size: 16 }), card.deck || "Deck"),
      h(
        "span",
        { className: "mos__rv-card-face" + (flipped ? " is-back" : "") },
        flipped ? "Antwort" : "Frage",
      ),
    ),
    h("div", { className: "mos__rv-card-q" }, card.front),
    flipped
      ? h(
          "div",
          { className: "mos__rv-card-a" },
          h("span", { className: "mos__rv-card-a-k" }, "Antwort"),
          h("p", { className: "mos__rv-card-a-text" }, card.back),
        )
      : null,
    card.intervalCurrent
      ? h("div", { className: "mos__rv-card-ivl" },
          h(Icon, { name: "clock", size: 12 }), "Aktuelles Intervall: ", h("b", null, card.intervalCurrent))
      : null,
    flipped
      ? h(ReviewRatingRow, { data: props.data, card: card, onRate: props.onRate })
      : h(
          "button",
          { type: "button", className: "mos__rv-flip", onClick: props.onFlip, autoFocus: true },
          h(Icon, { name: "eye", size: 18 }), "Antwort zeigen",
          h("span", { className: "mos__rv-flip-key", "aria-hidden": "true" }, "Leertaste"),
        ),
  );
}

function ReviewBodyReady(props) {
  const st = props.state;
  const d = st.data || {};
  const cards = d.cards || [];
  const card = cards[st.index] || cards[0];
  const total = cards.length;
  const pct = total ? Math.round((st.index / total) * 100) : 0;
  return h(
    "div",
    { className: "mos__rv-stage" },
    h(
      "div",
      { className: "mos__rv-main" },
      // progress
      h(
        "div",
        { className: "mos__rv-progress" },
        h("span", { className: "mos__rv-progress-idx" }, h(Icon, { name: "list", size: 15 }),
          (st.index + 1) + " / " + total),
        h("span", { className: "mos__rv-progress-bar" },
          h("span", { className: "mos__rv-progress-fill", style: { width: pct + "%" } })),
        h("span", { className: "mos__rv-progress-done" }, st.reviewed + " geübt"),
      ),
      h(ReviewCard, { card: card, flipped: st.flipped, data: d, onFlip: props.onFlip, onRate: props.onRate }),
      // honest, always-on: nothing is persisted here
      h(
        "div",
        { className: "mos__rv-honest" },
        h(Icon, { name: "flask-conical", size: 13 }),
        h("span", null, d.honest || REVIEW_HONEST,
          d.previewNote ? h("span", { className: "mos__rv-honest-src" }, " · " + d.previewNote) : null),
      ),
    ),
    h(ReviewRail, { data: d }),
  );
}

function ReviewBodyState(props) {
  // loading / empty / unavailable / error / done
  const st = props.state;
  const d = st.data || {};
  const map = {
    loading: { icon: "loader", tone: "muted", title: "Lädt Drill …", note: "Lese die Anki-Collection (read-only) …", spin: true },
    empty: { icon: "graduation-cap", tone: "muted",
      title: (d.reason === "no_due" ? "Keine fälligen Karten" : "Noch nicht synchronisiert"),
      note: d.note || "Sobald das erste Gerät synchronisiert, erscheinen hier fällige Karten." },
    unavailable: { icon: "unplug", tone: "red", title: d.summary || "Nicht lesbar",
      note: d.note || "Anki-Collection nicht lesbar. Read-only — nichts wird verändert." },
    error: { icon: "triangle-alert", tone: "red", title: "Drill nicht erreichbar",
      note: "Die Lern-Session konnte nicht geladen werden. Es wurde nichts verändert." },
    done: { icon: "party-popper", tone: "verified", title: "Drill beendet",
      note: "Nichts wurde gespeichert — die echte Bewertung machst du in Anki / AnkiDroid." },
  };
  const m = map[st.phase] || map.loading;
  return h(
    "div",
    { className: "mos__rv-panel mos--" + m.tone },
    h("span", { className: "mos__rv-panel-icon" + (m.spin ? " is-spin" : "") }, h(Icon, { name: m.icon, size: 30 })),
    h("span", { className: "mos__rv-panel-title" }, st.phase === "done"
      ? "Drill beendet · " + st.reviewed + " Karten durchgesehen" : m.title),
    h("span", { className: "mos__rv-panel-note" }, m.note),
    st.phase === "done"
      ? h("span", { className: "mos__rv-panel-honest" }, h(Icon, { name: "flask-conical", size: 12 }), REVIEW_HONEST)
      : null,
    st.phase === "done"
      ? h(
          "div",
          { className: "mos__rv-panel-actions" },
          h("button", { type: "button", className: "mos__rv-btn mos__rv-btn--primary", onClick: props.onRestart },
            h(Icon, { name: "rotate-ccw", size: 15 }), "Nochmal drillen"),
          h("button", { type: "button", className: "mos__rv-btn", onClick: props.onClose }, "Schließen"),
        )
      : (st.phase === "empty" || st.phase === "unavailable" || st.phase === "error")
        ? h("div", { className: "mos__rv-panel-actions" },
            h("button", { type: "button", className: "mos__rv-btn", onClick: props.onClose }, "Schließen"))
        : null,
  );
}

function ReviewSurface(props) {
  const st = props.state;
  // Keyboard: Space/Enter flip · 1–4 rate · Esc close. Registered only while
  // open; re-subscribes on phase/flip change (low frequency, not per-frame).
  useEffect(() => {
    if (!st) return undefined;
    function onKey(e) {
      const k = e.key;
      if (k === "Escape") { e.preventDefault(); props.onClose(); return; }
      if (st.phase !== "ready") return;
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!st.flipped) {
        if (k === " " || k === "Spacebar" || k === "Enter") { e.preventDefault(); props.onFlip(); }
        return;
      }
      if (k >= "1" && k <= "4") {
        e.preventDefault();
        props.onRate(["again", "hard", "good", "easy"][parseInt(k, 10) - 1]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [st, props.onFlip, props.onRate, props.onClose]);

  if (!st) return null;
  const d = st.data || {};
  const previewSrc = d.previewSource || "unavailable";
  const srcLabel = { "py-fsrs": "py-fsrs · Vorschau", "anki-cards.data": "cards.data · Intervall", "unavailable": "Vorschau n/a" }[previewSrc] || previewSrc;
  return h(
    "div",
    { className: "mos__rv-scrim", onClick: props.onClose },
    h(
      "section",
      {
        className: "mos__rv",
        role: "dialog", "aria-modal": "true",
        "aria-label": "Lernen · Drill (Vorschau, keine Speicherung)",
        onClick: (e) => e.stopPropagation(),
      },
      h(
        "header",
        { className: "mos__rv-head" },
        h("span", { className: "mos__rv-head-badge" }, h(Icon, { name: "graduation-cap", size: 18 })),
        h(
          "span",
          { className: "mos__rv-head-titles" },
          h("span", { className: "mos__rv-head-title" }, "Lernen · Drill"),
          h("span", { className: "mos__rv-head-sub" }, "Spaced Repetition · Anki (read-only)"),
        ),
        h("span", { className: "mos__pip mos__pip--konzept mos__rv-head-pip", title: d.note || srcLabel },
          h(Icon, { name: previewSrc === "py-fsrs" ? "flask-conical" : "shield-check", size: 11 }), srcLabel),
        h("button", { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Drill schließen", onClick: props.onClose },
          h(Icon, { name: "x", size: 18 })),
      ),
      st.phase === "ready"
        ? h(ReviewBodyReady, { state: st, onFlip: props.onFlip, onRate: props.onRate })
        : h(ReviewBodyState, { state: st, onRestart: props.onRestart, onClose: props.onClose }),
    ),
  );
}

// ===========================================================================
// L-3 · LERN-COACH surface — a violet, read/propose-only coaching modal over the
// SAME Anki collection + a read-only exams.json. Three tabs:
//   1) Countdown  — Klausur-Countdown + Pacing (honest when the collection is
//      empty: no faked Tagesziel).
//   2) Feynman    — pick a concept, explain it; the explanation is graded BY
//      JARVIS (Brain-Gateway). Never faked — if Jarvis is unreachable / no token,
//      the surface says the grade is pending (jarvisDependent), and nothing is
//      persisted (grading lives with Jarvis; SR-truth stays in Anki).
//   3) Lernplan   — a Prüfungsplan MISSION via the SAME gated propose lifecycle
//      (dry-run preview → „An Gate senden“ → Mission), workspace=studium/privat.
// The seven lern-* methods (Priming/Active-Recall/Feynman/Elaboration/Spaced …)
// are mirrored in the copy so the surface teaches the method, not just numbers.
// ===========================================================================
const COACH_TABS = [
  { id: "countdown", icon: "calendar-clock", label: "Countdown" },
  { id: "feynman", icon: "message-square", label: "Feynman" },
  { id: "plan", icon: "list-todo", label: "Lernplan" },
];
const COACH_METHODS_FALLBACK = [
  { key: "priming", icon: "lightbulb", title: "Priming", line: "Erst aus dem Kopf: Was weißt du schon?" },
  { key: "active-recall", icon: "brain", title: "Active Recall", line: "Abrufen statt wiederlesen (Testing-Effekt)." },
  { key: "spaced", icon: "clock", title: "Spaced Repetition", line: "≥3 Abrufe pro Thema vor der Klausur." },
];
const COACH_JARVIS_NOTE = "Bewertung kommt von Jarvis (Brain-Kette) — nicht vom Plugin, nichts wird gespeichert.";

// The objective the Prüfungsplan proposes for one exam — deterministic, honest,
// and explicitly study-only. Mirrors lern-spaced-repetition (rückwärts vom Datum,
// ≥3 Abrufe/Thema) + Active-Recall/Feynman as the drill methods.
function studyObjective(ex) {
  if (!ex) return "";
  const themen = (ex.themen && ex.themen.length) ? " Themen: " + ex.themen.join(", ") + "." : "";
  const inN = (ex.daysLeft != null && ex.daysLeft >= 0) ? " (in " + ex.daysLeft + " Tagen)" : "";
  return ("Erstelle einen Spaced-Repetition-Lernplan bis zur Klausur " + ex.fach +
    " am " + ex.datum + inN + "." + themen +
    " Plane rückwärts vom Klausurdatum, mindestens 3 Abrufe pro Thema, mit Active-Recall- " +
    "und Feynman-Runden und täglichen Kartenzielen aus den Anki-Fälligkeiten. Nur Studium/privat.");
}

function CoachMethods(props) {
  const methods = (props.methods && props.methods.length) ? props.methods : COACH_METHODS_FALLBACK;
  return h(
    "div",
    { className: "mos__co-methods", "aria-label": "Lernmethoden" },
    h("span", { className: "mos__co-methods-k" }, h(Icon, { name: "sparkles", size: 12 }), "Methodik"),
    methods.map((m) =>
      h("span", { key: m.key, className: "mos__co-method", title: m.line },
        h(Icon, { name: m.icon, size: 12 }), m.title)),
  );
}

function CoachJarvisPip(props) {
  const j = props.jarvis || {};
  const ready = !!j.ready;
  return h(
    "span",
    { className: "mos__co-jpip mos--" + (ready ? "verified" : "amber"), title: j.note || "" },
    h(Icon, { name: ready ? "sparkles" : "triangle-alert", size: 11 }),
    ready ? "Jarvis bereit" : "Jarvis-Bewertung ausstehend",
  );
}

function CoachCountdown(props) {
  const st = props.state;
  const plan = st.plan || {};
  const exams = (plan.exams || []).filter((e) => e && e.valid !== false);
  if (st.planState === "loading") {
    return h("div", { className: "mos__co-panel mos--muted" },
      h("span", { className: "mos__co-panel-icon is-spin" }, h(Icon, { name: "loader", size: 28 })),
      h("span", { className: "mos__co-panel-title" }, "Lade Countdown …"),
      h("span", { className: "mos__co-panel-note" }, "exams.json × Anki (read-only)"));
  }
  if (!exams.length) {
    return h("div", { className: "mos__co-panel mos--muted" },
      h("span", { className: "mos__co-panel-icon" }, h(Icon, { name: "calendar-clock", size: 28 })),
      h("span", { className: "mos__co-panel-title" }, plan.summary || "Keine Klausurtermine"),
      h("span", { className: "mos__co-panel-note" }, plan.note ||
        "Lege Klausurtermine in exams.json an (Fach · Datum · Themen · optional Anki-Deck)."));
  }
  return h(
    "div",
    { className: "mos__co-scroll" },
    h("div", { className: "mos__co-exams" },
      exams.map((e) => {
        const tone = { today: "red", critical: "red", tight: "amber", ok: "violet", past: "muted" }[e.tier] || "violet";
        return h(
          "div",
          { key: e.fach + e.datum, className: "mos__co-exam mos--" + tone },
          h("div", { className: "mos__co-exam-top" },
            h("span", { className: "mos__co-exam-fach" }, e.fach),
            h("span", { className: "mos__co-exam-tier mos--" + tone }, e.tierLabel)),
          h("div", { className: "mos__co-exam-days" },
            h("span", { className: "mos__co-exam-n" }, e.daysLeft === 0 ? "heute" : (e.daysLeft < 0 ? "vorbei" : e.daysLeft)),
            e.daysLeft > 0 ? h("span", { className: "mos__co-exam-unit" }, "Tage") : null),
          h("div", { className: "mos__co-exam-meta" },
            h("span", { className: "mos__co-exam-date" }, h(Icon, { name: "calendar-days", size: 12 }), e.datum),
            h("span", { className: "mos__co-exam-goal" }, h(Icon, { name: "target", size: 12 }), e.goalText)),
          e.feynmanHint
            ? h("div", { className: "mos__co-exam-hint" }, h(Icon, { name: "message-square", size: 12 }), e.feynmanHint)
            : (e.themenCount ? h("div", { className: "mos__co-exam-hint mos--soft" },
                h(Icon, { name: "book-open", size: 12 }), e.themenCount + " Themen") : null),
        );
      })),
    h(CoachMethods, { methods: plan.methods }),
    h("div", { className: "mos__co-honest" },
      h(Icon, { name: "eye", size: 13 }),
      h("span", null, plan.note ||
        "Countdown aus exams.json (read-only) × Anki-Fälligkeiten. Tagesziel ehrlich „folgt“, wenn die Collection leer ist. Anki bleibt die SR-Wahrheit — hier wird nichts geschrieben.")),
  );
}

function CoachFeynman(props) {
  const st = props.state;
  const fey = st.fey || {};
  const setup = fey.setup || {};
  const result = fey.result || null;
  const jarvis = (result && result.jarvis) || setup.jarvis || {};
  const concept = setup.concept || "";
  const busy = fey.phase === "evaluating";
  return h(
    "div",
    { className: "mos__co-scroll" },
    // method + priming line (mirrors lern-priming / lern-feynman)
    h("div", { className: "mos__co-fey-method" },
      h(Icon, { name: "message-square", size: 14 }),
      h("span", null, (setup.method && setup.method.hint) ||
        "Erklär frei, ohne Fachjargon; wo du stockst, sitzt die Lücke. Danach bewertet Jarvis.")),
    setup.priming
      ? h("div", { className: "mos__co-fey-prime" }, h(Icon, { name: "lightbulb", size: 12 }), setup.priming)
      : null,
    // concept card
    h("div", { className: "mos__co-fey-concept" },
      h("div", { className: "mos__co-fey-concept-head" },
        h("span", { className: "mos__co-fey-concept-k" }, "Erklär mir"),
        setup.conceptSource && setup.conceptSource !== "none"
          ? h("span", { className: "mos__co-fey-src" }, h(Icon, { name: "book-open", size: 10 }),
              { "anki-karte": "aus Anki-Karte", "exams.json": "aus exams.json", "eigenes": "eigenes" }[setup.conceptSource] || setup.conceptSource)
          : null,
        h("button", { type: "button", className: "mos__co-fey-next", onClick: props.onNextConcept,
            title: "Anderes Konzept" }, h(Icon, { name: "rotate-ccw", size: 12 }), "anderes")),
      h("div", { className: "mos__co-fey-concept-v" }, concept || "(kein Konzept — gib selbst eines ein)")),
    // explanation textarea
    h("label", { className: "mos__co-fey-field" },
      h("span", { className: "mos__co-fey-field-k" }, "Deine Erklärung (frei, in eigenen Worten)"),
      h("textarea", {
        className: "mos__co-fey-textarea", rows: 5,
        placeholder: "Erklär das Konzept so, als würdest du es einer interessierten Laiin erklären …",
        value: fey.explanation || "", disabled: busy,
        onChange: (e) => props.onExplain(e.target.value),
      })),
    // Jarvis dependency banner — honest about what grades this.
    h("div", { className: "mos__co-jbanner mos--" + (jarvis.ready ? "verified" : "amber") },
      h(Icon, { name: jarvis.ready ? "sparkles" : "triangle-alert", size: 13 }),
      h("span", null, jarvis.ready
        ? COACH_JARVIS_NOTE
        : (jarvis.note || "Jarvis-Bewertung ausstehend — die Erklärung wird nicht bewertet, nichts gespeichert."))),
    // result (real Jarvis feedback) or evaluating/pending states
    busy
      ? h("div", { className: "mos__co-panel mos--muted" },
          h("span", { className: "mos__co-panel-icon is-spin" }, h(Icon, { name: "loader", size: 24 })),
          h("span", { className: "mos__co-panel-title" }, "Jarvis bewertet …"),
          h("span", { className: "mos__co-panel-note" }, "Brain-Kette (abo-first) · READ/Coaching"))
      : (result
          ? (result.ok
              ? h("div", { className: "mos__co-fey-result" },
                  h("div", { className: "mos__co-fey-result-head" },
                    h(Icon, { name: "sparkles", size: 14 }), "Jarvis-Feedback",
                    result.model ? h("span", { className: "mos__co-fey-model" }, result.model + (result.routeClass ? " · " + result.routeClass : "")) : null),
                  h("div", { className: "mos__co-fey-feedback" }, result.feedback),
                  h("div", { className: "mos__co-honest" }, h(Icon, { name: "eye", size: 12 }),
                    h("span", null, result.note || COACH_JARVIS_NOTE)))
              : h("div", { className: "mos__co-panel mos--amber" },
                  h("span", { className: "mos__co-panel-icon" }, h(Icon, { name: "triangle-alert", size: 24 })),
                  h("span", { className: "mos__co-panel-title" }, "Bewertung ausstehend"),
                  h("span", { className: "mos__co-panel-note" }, result.note ||
                    "Jarvis-Bewertung nicht möglich — nichts wurde erfunden, nichts gespeichert.")))
          : null),
    // send button
    h("div", { className: "mos__co-fey-actions" },
      h("button", {
        type: "button", className: "mos__co-btn mos__co-btn--primary",
        disabled: busy || !(fey.explanation || "").trim(),
        onClick: props.onEvaluate,
        title: jarvis.ready ? "Erklärung an Jarvis zur Bewertung senden."
          : "Sendet an Jarvis — ist die Anbindung aus, bleibt die Bewertung ehrlich ausstehend.",
      }, h(Icon, { name: "send-horizontal", size: 15 }), "An Jarvis senden")),
  );
}

function CoachPlan(props) {
  const st = props.state;
  const plan = st.plan || {};
  const exams = (plan.exams || []).filter((e) => e && e.valid !== false && (e.daysLeft == null || e.daysLeft >= 0));
  return h(
    "div",
    { className: "mos__co-scroll" },
    h("div", { className: "mos__co-plan-intro" },
      h(Icon, { name: "shield-check", size: 13 }),
      h("span", null, "Ein Lernplan wird als Mission VORGESCHLAGEN: Dry-Run-Vorschau → „An Gate senden“ → Freigabe. ",
        h("b", null, "Studium/privat"), " — kein Geld, keine Firma. Das Plugin führt nichts aus; dein Gate entscheidet.")),
    exams.length
      ? h("div", { className: "mos__co-plan-list" },
          exams.map((e) =>
            h("button", {
              key: e.fach + e.datum, type: "button", className: "mos__co-plan-item",
              onClick: () => props.onPropose(studyObjective(e), "study"),
              title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst.",
            },
              h("span", { className: "mos__co-plan-item-l" },
                h(Icon, { name: "list-todo", size: 15 }),
                h("span", { className: "mos__co-plan-item-fach" }, "Lernplan bis " + e.fach),
                h("span", { className: "mos__co-plan-item-sub" }, (e.daysHuman || ("in " + e.daysLeft + " Tagen")) + " · " + e.themenCount + " Themen")),
              h("span", { className: "mos__co-plan-item-cta" }, h(Icon, { name: "flask-conical", size: 12 }), "Vorschau"))))
      : h("div", { className: "mos__co-panel mos--muted" },
          h("span", { className: "mos__co-panel-icon" }, h(Icon, { name: "list-todo", size: 26 })),
          h("span", { className: "mos__co-panel-title" }, "Keine anstehende Klausur"),
          h("span", { className: "mos__co-panel-note" }, "Lege Termine in exams.json an — dann kannst du je Fach einen Lernplan vorschlagen.")),
    h("div", { className: "mos__co-honest" }, h(Icon, { name: "lock", size: 12 }),
      h("span", null, "Propose-only über den gegateten /actions-Weg (workspace=studium). Nie /approvals/decide, nie Anki-Schreibzugriff.")),
  );
}

function CoachSurface(props) {
  const st = props.state;
  useEffect(() => {
    if (!st) return undefined;
    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); props.onClose(); } }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [st, props.onClose]);
  if (!st) return null;
  const tab = st.tab || "countdown";
  const jarvis = (st.plan && st.plan.jarvis) || (st.fey && st.fey.setup && st.fey.setup.jarvis) || {};
  let body;
  if (tab === "feynman") body = h(CoachFeynman, { state: st, onExplain: props.onExplain, onEvaluate: props.onEvaluate, onNextConcept: props.onNextConcept });
  else if (tab === "plan") body = h(CoachPlan, { state: st, onPropose: props.onPropose });
  else body = h(CoachCountdown, { state: st });
  return h(
    "div",
    { className: "mos__co-scrim", onClick: props.onClose },
    h(
      "section",
      { className: "mos__co", role: "dialog", "aria-modal": "true",
        "aria-label": "Lern-Coach", onClick: (e) => e.stopPropagation() },
      h("header", { className: "mos__co-head" },
        h("span", { className: "mos__co-head-badge" }, h(Icon, { name: "graduation-cap", size: 18 })),
        h("span", { className: "mos__co-head-titles" },
          h("span", { className: "mos__co-head-title" }, "Lern-Coach"),
          h("span", { className: "mos__co-head-sub" }, "Klausur-Countdown · Feynman · Lernplan")),
        h(CoachJarvisPip, { jarvis: jarvis }),
        h("button", { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Coach schließen", onClick: props.onClose },
          h(Icon, { name: "x", size: 18 }))),
      h("div", { className: "mos__co-tabs", role: "tablist" },
        COACH_TABS.map((t) =>
          h("button", {
            key: t.id, type: "button", role: "tab",
            "aria-selected": tab === t.id ? "true" : "false",
            className: "mos__co-tab" + (tab === t.id ? " is-active" : ""),
            onClick: () => props.onTab(t.id),
          }, h(Icon, { name: t.icon, size: 15 }), t.label))),
      h("div", { className: "mos__co-body" }, body),
    ),
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
// ===========================================================================
// COCKPIT — the default scene (Synthese B+C+A). A glanceable 24/7 command-
// center that reads ONLY from the three M1 read routes (/cockpit/kpi,
// /cockpit/jarvis-state, /cockpit/approvals) + the existing /overview modules.
// Every zone carries an honest state (loading·empty·stale·unavailable·error);
// value:null renders the honest Strich „—" — NOTHING is ever fabricated. Chat is
// honest: when the backend reports not-connected the UI says so — never a fake
// answer. The Approval-Center reads only; it never reaches /approvals/decide.
// ===========================================================================

// KPI key → icon + accent (visual identity only; VALUE + STATE come from the
// backend _prov envelope and are never invented here).
const KPI_META = {
  recovery:     { icon: "heart-pulse",    accent: "emerald" },
  next_exam:    { icon: "graduation-cap", accent: "violet" },
  open_gates:   { icon: "shield-check",   accent: "amber" },
  running_jobs: { icon: "rocket",         accent: "cyan" },
};
// KPI/zone state → pip tone (reuse the module STATE_META vocabulary; no new colour).
const ZONE_TONE = {
  fresh: "verified", stale: "amber", partial: "blue",
  empty: "muted", unavailable: "red", error: "red", loading: "muted", gated: "gated",
};

// Workspace id → short tag (used on Agenda rows + Jarvis chips; the "2+1" split
// on the Heute tile is preserved by tagging each row, never blending a sum).
const WS_TAG = {
  private:        { label: "Privat", tone: "cyan" },
  company_signal: { label: "Firma",  tone: "neutral" },
  engineering:    { label: "Eng",    tone: "violet" },
};

// Approval gate-class → CATEGORY. Pure categorisation per UI-SPEC §5/§6 — NEVER
// an action and never a decision path. Geld=amber · Kunde=blue · Personal=violet
// · Restart/destruktiv=red. Falls back to a neutral gated pill.
function gateCategory(gc, gr, text) {
  const s = ((gc || "") + " " + (gr || "") + " " + (text || "")).toLowerCase();
  if (/personal|personnel|\bhr\b|mitarbeiter|lohn|gehalt/.test(s)) return { label: "Personal", tone: "violet", icon: "user" };
  if (/money|billing|invoice|sevdesk|payment|rechnung|buchen|zahlung|geld|betrag/.test(s)) return { label: "Geld", tone: "amber", icon: "banknote" };
  if (/customer|extern|kunde|versand|auftrag|angebot|mail/.test(s)) return { label: "Kunde", tone: "blue", icon: "building-2" };
  if (/restart|prod-restart|neustart/.test(s)) return { label: "Restart", tone: "red", icon: "server" };
  if (/destructive|schema|delete|destruktiv|migration|\bdrop\b/.test(s)) return { label: "Daten", tone: "red", icon: "octagon-alert" };
  return { label: "Gate", tone: "gated", icon: "shield-check" };
}

// Shared honest state pip for a cockpit zone header (loading spins; konzept for
// fixtures; otherwise the STATE_META tone + freshness age + source tooltip).
function ZonePip(props) {
  const st = props.state || "loading";
  if (st === "konzept") {
    return h("span", { className: "mos__pip mos__pip--konzept mos__zone-pip", title: props.note || "Konzeptdaten" },
      h(Icon, { name: "flask-conical", size: 11 }), "Konzept");
  }
  const meta = STATE_META[st] || STATE_META.loading;
  const tone = ZONE_TONE[st] || "muted";
  const fresh = props.observedAt ? freshnessLabel(props.observedAt) : null;
  const tip = [props.source && ("Quelle: " + props.source), fresh && ("Stand: " + fresh), props.note].filter(Boolean).join(" · ");
  return h("span", { className: "mos__pip mos__pip--" + tone + " mos__zone-pip", title: tip || meta.label },
    st === "loading"
      ? h(Icon, { name: "loader", size: 11, className: "is-spin" })
      : h("span", { className: "mos__pip-dot", "aria-hidden": "true" }),
    meta.label,
    fresh && (st === "fresh" || st === "stale" || st === "partial") ? h("span", { className: "mos__pip-age" }, fresh) : null);
}

// Shared honest empty/unavailable block. `unavailable`/`error` read red+unplug
// (a real source is down); everything else reads a calm muted state — a 0 is a
// fact, never an alarm.
function ZoneEmpty(props) {
  const st = props.state || "empty";
  const bad = st === "unavailable" || st === "error";
  return h("div", { className: "mos__zone-empty mos--" + (bad ? "red" : "muted") },
    h(Icon, { name: bad ? "unplug" : (props.icon || "inbox"), size: 20 }),
    h("span", { className: "mos__zone-empty-t" }, props.title || (STATE_META[st] || STATE_META.empty).label),
    props.note ? h("span", { className: "mos__zone-empty-n" }, props.note) : null);
}

// --- KPI bar (top) — 4 glanceable pills, each referencing its own state -------
function KpiPill(props) {
  const k = props.kpi;
  const meta = KPI_META[k.key] || { icon: "circle", accent: "cyan" };
  const st = k.state || "loading";
  const tone = ZONE_TONE[st] || "muted";
  const spinning = st === "loading";
  const hasVal = k.value !== null && k.value !== undefined && k.value !== "";
  const tip = [k.summary, k.note, k.source && ("Quelle: " + k.source)].filter(Boolean).join(" · ");
  return h("button", {
    type: "button",
    className: "mos__kpi mos__kpi--" + tone + " mos--" + meta.accent + (props.onClick ? " is-click" : ""),
    title: tip || k.label,
    onClick: props.onClick,
    "aria-label": k.label + ": " + (hasVal ? (k.value + (k.unit ? " " + k.unit : "")) : "kein Wert (" + (STATE_META[st] || STATE_META.loading).label + ")"),
  },
    h("span", { className: "mos__kpi-ico" }, h(Icon, { name: spinning ? "loader" : meta.icon, size: 18, className: spinning ? "is-spin" : "" })),
    h("span", { className: "mos__kpi-main" },
      h("span", { className: "mos__kpi-label" }, k.label),
      h("span", { className: "mos__kpi-val" },
        hasVal
          ? [String(k.value), k.unit ? h("i", { key: "u", className: "mos__kpi-unit" }, k.unit) : null]
          : h("span", { className: "mos__kpi-dash", title: k.note || k.summary || "" }, "—")),
    ),
    h("span", { className: "mos__kpi-pip mos__pip mos__pip--" + tone }, h("span", { className: "mos__pip-dot", "aria-hidden": "true" })),
  );
}

const KPI_FALLBACK = [
  { key: "recovery", label: "Recovery", unit: "%" },
  { key: "next_exam", label: "Nächste Klausur", unit: "Tage" },
  { key: "open_gates", label: "Offene Freigaben", unit: null },
  { key: "running_jobs", label: "Laufende Jobs", unit: null },
];
function KpiBar(props) {
  const c = props.cockpit || {};
  const load = props.load;
  const real = c.kpi && Array.isArray(c.kpi.kpis) && c.kpi.kpis.length;
  const kpis = real
    ? c.kpi.kpis
    : KPI_FALLBACK.map((f) => ({ ...f, value: null, state: load === "loading" ? "loading" : "unavailable" }));
  return h("div", { className: "mos__kpibar", role: "group", "aria-label": "Kennzahlen" },
    kpis.map((k) => h(KpiPill, { key: k.key, kpi: k, onClick: k.key === "open_gates" ? props.onGates : undefined })));
}

// --- Agenda rail (left) — HEUTE (calendar-evidence) / engineering work-streams -
function AgendaRow(props) {
  const r = props.row;
  const wtag = WS_TAG[r.workspace];
  return h("div", { className: "mos__agrow mos--" + (r.accent || "cyan") + (r.readOnly ? " is-ro" : "") },
    h("span", { className: "mos__agrow-time" }, r.value || "—"),
    h("span", { className: "mos__agrow-ico" }, h(Icon, { name: r.icon || "calendar-days", size: 15 })),
    h("span", { className: "mos__agrow-body" },
      h("span", { className: "mos__agrow-title" }, r.title),
      r.sub ? h("span", { className: "mos__agrow-sub" }, r.sub) : null),
    wtag ? h("span", { className: "mos__wtag mos__wtag--" + wtag.tone, title: r.workspace }, wtag.label) : null);
}

const AGENDA_MAX = 4;
function AgendaRail(props) {
  const ws = props.workspace;
  const eng = ws === "engineering";
  const src = eng ? props.engineeringModule : props.todayModule;
  const st = src ? (src._state || "loading") : (props.load === "loading" ? "loading" : "empty");
  let rows = (src && Array.isArray(src._rows)) ? src._rows.slice() : [];
  // Workspace filter (UI-SPEC §4): private = only private calendar rows;
  // company_signal = private + Dispo rows (never blended, each tagged);
  // engineering = the work-streams instead of the calendar.
  if (!eng && ws === "private") rows = rows.filter((r) => (r.workspace || "private") === "private");
  const head = eng ? "Arbeitsstränge" : "Heute";
  const headIcon = eng ? "git-branch" : "sun";
  const shown = rows.slice(0, AGENDA_MAX);
  const extra = rows.length - shown.length;
  const demo = src && src._demo;
  return h("section", { className: "mos__card mos__agenda" },
    h("header", { className: "mos__card-head" },
      h(Icon, { name: headIcon, size: 16 }),
      h("span", { className: "mos__card-title" }, head),
      h(ZonePip, { state: demo ? "konzept" : st, observedAt: src && src._observedAt, source: src && src._source, note: src && src._note })),
    h("div", { className: "mos__agenda-body" },
      props.load === "loading" && !src
        ? [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" }))
        : shown.length
          ? [
              ...shown.map((r, i) => h(AgendaRow, { key: i, row: r })),
              extra > 0
                ? h("button", { key: "more", type: "button", className: "mos__agenda-more", onClick: props.onMore },
                    h(Icon, { name: "ellipsis", size: 14 }), "+" + extra + " weitere")
                : null,
            ]
          : h(ZoneEmpty, { state: st, icon: "calendar-days", title: eng ? "Keine Arbeitsstränge" : "Keine Termine heute", note: src && src._note })));
}

// --- Jarvis-Live (center) — honest state summary + proactive hints + one Vorschlag
function JarvisBubble(props) {
  const b = props.bubble;
  return h("div", { className: "mos__jbub is-" + (b.tone || "cyan") },
    h("span", { className: "mos__jbub-ava" }, h(Icon, { name: b.icon || "orbit", size: 14 })),
    h("div", { className: "mos__jbub-body" },
      b.title ? h("span", { className: "mos__jbub-title" }, b.title) : null,
      h("span", { className: "mos__jbub-text" }, b.text),
      (b.source || b.workspace) ? h("span", { className: "mos__jbub-meta" },
        b.workspace && WS_TAG[b.workspace] ? h("span", { className: "mos__wtag mos__wtag--" + WS_TAG[b.workspace].tone }, WS_TAG[b.workspace].label) : null,
        b.source ? h("span", { className: "mos__jbub-src" }, b.source) : null) : null));
}

// The proactive Vorschlag — amber PROPOSE look. It only proposes (dry-run); the
// gate decides. Nothing fires from here; the button opens the propose overlay.
function SuggestionCard(props) {
  const hint = props.hint;
  const obj = hint.propose && hint.propose.objective;
  return h("div", { className: "mos__suggest" },
    h("div", { className: "mos__suggest-head" },
      h(Icon, { name: "flask-conical", size: 15 }),
      h("span", { className: "mos__suggest-kind" }, "Vorschlag · propose-only (Dry-Run)"),
      h("span", { className: "mos__suggest-tag" }, h(Icon, { name: "shield-check", size: 12 }), "Gate entscheidet")),
    h("div", { className: "mos__suggest-title" }, hint.title),
    hint.detail ? h("div", { className: "mos__suggest-detail" }, hint.detail) : null,
    h("div", { className: "mos__suggest-foot" },
      h("button", { type: "button", className: "mos__suggest-btn", onClick: () => props.onPropose(obj),
        title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst." },
        h(Icon, { name: "git-branch", size: 15 }), "Als Codex-Aufgabe vorschlagen"),
      h("span", { className: "mos__suggest-note" }, "Nichts wird ausgeführt.")));
}

function JarvisLive(props) {
  const j = props.jarvis;
  const load = props.load;
  const ws = props.workspace;
  const chat = j && j.chat;
  // The right column (FirmaPanel + ApprovalCenter) OWNS the approval signal.
  // Drop the company-signal "gates_pending" hint here so the center stays the
  // Jarvis dialog/suggestion zone — no triple-render of "X Freigabe(n) warten"
  // across middle + right (UI-SPEC §3 3-zone clarity). Backend still projects it
  // honestly (KPI pill + right zone); the center just doesn't restate it.
  const hints = (j && Array.isArray(j.hints)) ? j.hints.filter((x) => x.id !== "gates_pending") : [];
  // Workspace-scoped Vorschlag (UI-SPEC §4): the engineering propose hint offers
  // its action only in the engineering workspace; elsewhere it stays advisory.
  const proposeHint = hints.find((x) => x.propose);
  const showPropose = proposeHint && ws === "engineering";
  const bubbles = [];
  if (chat) {
    bubbles.push(chat.connected
      ? { icon: "orbit", tone: "cyan", title: "Coaching-Chat verbunden", text: chat.scope || chat.note || "Brain-Gateway erreichbar." }
      : { icon: "unplug", tone: "red", title: "Jarvis-Chat nicht verbunden", text: chat.note || "Chat-Backend nicht erreichbar — keine Antwort erfunden." });
  } else if (load === "offline") {
    bubbles.push({ icon: "unplug", tone: "red", title: "Jarvis nicht erreichbar", text: "Read-Modelle offline — der Zustand erscheint, sobald die Quelle wieder antwortet." });
  }
  hints.forEach((x) => {
    if (x === proposeHint && showPropose) return; // rendered as the SuggestionCard
    bubbles.push({ icon: x.icon || "lightbulb", tone: x.severity === "attention" ? "amber" : "cyan",
      title: x.title, text: x.detail, source: x.source, workspace: x.workspace });
  });
  const empty = !chat && load !== "offline" && load !== "loading" && !hints.length;
  const chatOk = chat && chat.connected;
  return h("section", { className: "mos__card mos__jlive" },
    h("header", { className: "mos__jlive-head" },
      h("span", { className: "mos__jlive-orb" }, h(Orb, { label: false })),
      h("span", { className: "mos__jlive-id" },
        h("b", null, "Jarvis"),
        h("span", { className: "mos__jlive-sub" }, jarvisStateText(props.stateIndex))),
      h("span", { className: "mos__jlive-ws mos__wtag mos__wtag--" + ((WS_TAG[ws] || {}).tone || "cyan") }, (WS_TAG[ws] || {}).label || ws),
      chat
        ? h("span", { className: "mos__pip mos__pip--" + (chatOk ? "verified" : "red"), title: chat.note || "" },
            h("span", { className: "mos__pip-dot", "aria-hidden": "true" }), chatOk ? "Chat bereit" : "Chat offline")
        : h("span", { className: "mos__jlive-load" }, h(Icon, { name: load === "loading" ? "loader" : "unplug", size: 14, className: load === "loading" ? "is-spin" : "" })),
      h("button", { type: "button", className: "mos__jlive-mic", title: NOT_WIRED, "aria-label": "Voice-Memo (folgt)" }, h(Icon, { name: "mic", size: 18 }))),
    h("div", { className: "mos__jlive-stream" },
      load === "loading" && !j
        ? [0, 1].map((i) => h("div", { key: i, className: "mos__skbub" }))
        : empty
          ? h("div", { className: "mos__jlive-greet" },
              h("span", { className: "mos__jlive-greet-t" }, (props.greeting || "Hallo") + ", Mikael."),
              h("span", { className: "mos__jlive-greet-s" }, "Kein offener Hinweis. Frag mich etwas oder wähle einen Vorschlag."),
              h("div", { className: "mos__jlive-chips" },
                CHIPS.slice(0, 3).map((c) => h("button", { key: c.label, type: "button", className: "mos__chip", onClick: () => props.onChip(c.label) },
                  h(Icon, { name: c.icon, size: 14 }), c.label))))
          : [
              ...bubbles.map((b, i) => h(JarvisBubble, { key: i, bubble: b })),
              showPropose ? h(SuggestionCard, { key: "sug", hint: proposeHint, onPropose: props.onPropose }) : null,
            ]));
}

// --- Firma / Rise-L panel (right, top) — compact read-only signal list ---------
function FirmaMetric(props) {
  const r = props.row;
  return h("div", { className: "mos__firma-metric mos--" + (r.accent || "cyan") },
    h("span", { className: "mos__firma-metric-ico" }, h(Icon, { name: r.icon || "activity", size: 15 })),
    h("span", { className: "mos__firma-metric-body" },
      h("span", { className: "mos__firma-metric-title" }, r.title),
      r.sub ? h("span", { className: "mos__firma-metric-sub" }, r.sub) : null),
    r.status ? h("span", { className: "mos__status mos__status--" + r.status }, r.statusLabel) : (r.value ? h("span", { className: "mos__firma-metric-val" }, r.value) : null));
}
function FirmaPanel(props) {
  const risel = props.risel, company = props.company, load = props.load;
  const rst = risel ? (risel._state || "loading") : (load === "loading" ? "loading" : "empty");
  const rows = (risel && Array.isArray(risel._rows)) ? risel._rows.slice(0, 3) : [];
  const demo = risel && risel._demo;
  return h("section", { className: "mos__card mos__firma" },
    h("header", { className: "mos__card-head" },
      h(Icon, { name: "server", size: 16 }),
      h("span", { className: "mos__card-title" }, "Firma / Rise-L"),
      props.onOpen
        ? h("button", { type: "button", className: "mos__card-open mos__card-open--icon", onClick: props.onOpen,
            title: "Vollansicht — Firma/Rise-L (read-only Projektion, Deep-Links ins FSM)",
            "aria-label": "Firma-Vollansicht öffnen" },
            h(Icon, { name: "arrow-up-right", size: 15 }))
        : null,
      h(ZonePip, { state: demo ? "konzept" : rst, observedAt: risel && risel._observedAt, source: risel && risel._source, note: risel && risel._note })),
    h("div", { className: "mos__firma-body" },
      load === "loading" && !risel
        ? [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" }))
        : rows.length
          ? rows.map((r, i) => h(FirmaMetric, { key: i, row: r }))
          : h(ZoneEmpty, { state: rst, icon: "server", title: "Keine Signale", note: risel && risel._note })),
    company
      ? h("footer", { className: "mos__firma-foot" },
          h(Icon, { name: "building-2", size: 13 }),
          h("span", { className: "mos__firma-foot-t" }, company.meta || "Firma-Signale"),
          h("span", { className: "mos__firma-foot-ro" }, h(Icon, { name: "lock", size: 11 }), "nur lesen"))
      : null);
}

// --- Approval-Center (right, bottom) — READ-ONLY; Details = inline read details.
// Hard correction to Mockup B: NO Genehmigen/Ablehnen button. Decisions happen
// only in the operator's Hermes approval center — never from this plugin, never
// via /approvals/decide, not even indirectly.
function ApprovalCard(props) {
  const c = props.card;
  const cat = gateCategory(c.gateClass, c.gateReason, c.text);
  const fresh = freshnessLabel(c.createdUtc);
  const shortHash = c.intentSha256 ? c.intentSha256.slice(0, 12) : null;
  const open = props.open;
  return h("div", { className: "mos__appc-card mos__appc-card--" + cat.tone + (open ? " is-open" : "") },
    h("div", { className: "mos__appc-top" },
      h("span", { className: "mos__appc-cat mos__appc-cat--" + cat.tone }, h(Icon, { name: cat.icon, size: 12 }), cat.label),
      h("span", { className: "mos__appc-text" }, c.text),
      fresh ? h("span", { className: "mos__appc-when" }, fresh) : null),
    h("div", { className: "mos__appc-meta" },
      c.mandant ? h("span", { className: "mos__appc-tag" }, c.mandant) : null,
      c.targetSystem ? h("span", { className: "mos__appc-tag" }, c.targetSystem) : null,
      shortHash ? h("span", { className: "mos__appc-hash", title: "Intent-Hash: " + c.intentSha256 }, h(Icon, { name: "hash", size: 11 }), shortHash) : null,
      h("button", { type: "button", className: "mos__appc-details", "aria-expanded": open ? "true" : "false",
        onClick: () => props.onToggle(c.id),
        title: "Nur-Lese-Details. Freigabe/Ablehnung ausschließlich im Operator-Approval-Center (Hermes) — nie aus dem Plugin." },
        h(Icon, { name: "eye", size: 13 }), "Details")),
    open
      ? (props.scene
          // Scene mode (Entscheidungen-Center): full read-only projection from
          // /firma/approvals/detail — BETROFFENE FELDER + Effekt + Hashes + the
          // gated (never-executed) action row. Never calls /approvals/decide.
          ? h(ApprovalDetailRich, { card: c, detail: props.detail, loading: props.detailLoading })
          // Cockpit mode (M1, unchanged): the compact hash <dl>.
          : h("dl", { className: "mos__appc-detail" },
              h("div", null, h("dt", null, "Gate"), h("dd", null, (c.gateClass || "—") + (c.gateReason ? " · " + c.gateReason : ""))),
              c.intentSha256 ? h("div", null, h("dt", null, "Intent-Hash"), h("dd", { className: "mos__mono" }, c.intentSha256)) : null,
              c.idempotencyKey ? h("div", null, h("dt", null, "Idempotenz"), h("dd", { className: "mos__mono" }, c.idempotencyKey)) : null,
              c.payloadSha256 ? h("div", null, h("dt", null, "Payload-Hash"), h("dd", { className: "mos__mono" }, c.payloadSha256)) : null,
              h("div", { className: "mos__appc-decidenote" }, h(Icon, { name: "shield-check", size: 12 }),
                "Entscheidung nur im Operator-Approval-Center. Dieses Cockpit liest ausschließlich.")))
      : null);
}

// Humanize the structuredFields keys the backend emits (proposed_execution /
// route summary) into short German labels. Unknown keys fall back verbatim.
const APPC_FIELD_LABELS = {
  command: "Befehl", device: "Gerät", target: "Ziel",
  execution_path_policy: "Ausführungspfad", agent: "Agent", domain: "Domäne",
  tool: "Werkzeug", sensitivity: "Sensitivität",
  rechnungsbetrag: "Rechnungsbetrag", empfaenger: "Empfänger",
  zahlungsziel: "Zahlungsziel", buchungskonto: "Buchungskonto",
};
function _appcFieldLabel(k) {
  return APPC_FIELD_LABELS[k] || String(k).replace(/_/g, " ");
}

// Full read-only detail of ONE approval card (Entscheidungen-Center scene). Every
// block renders only when the backend actually carried it — a missing field is
// honestly omitted, never inferred from the card text. The action row is gated:
// it renders GENEHMIGEN/ABLEHNEN ONLY as deep-links into the Operator's real
// decide surface IF (and only if) the backend supplies those URLs; it never
// calls /approvals/decide and never fabricates an affordance. The lock caption
// is permanently visible on the expanded card.
function ApprovalDetailRich(props) {
  const d = props.detail;
  if (props.loading || !d) {
    return h("div", { className: "mos__apd" },
      h("div", { className: "mos__skrow" }),
      h("div", { className: "mos__skrow" }));
  }
  if (d.ok === false || d.found === false) {
    return h("div", { className: "mos__apd" },
      h(ZoneEmpty, { state: "unavailable", icon: "inbox",
        title: "Detail nicht verfügbar", note: d.note || "Approval-Card nicht lesbar." }),
      h("div", { className: "mos__apd-lock" }, h(Icon, { name: "lock", size: 13 }),
        h("span", null, "Entscheidung nur durch dich (Operator)")));
  }
  const c = props.card;
  const fields = (d.structuredFields && typeof d.structuredFields === "object")
    ? Object.keys(d.structuredFields).filter((k) => d.structuredFields[k] != null && d.structuredFields[k] !== "")
    : [];
  const affected = Array.isArray(d.affectedObjects) ? d.affectedObjects : [];
  const risks = Array.isArray(d.risks) ? d.risks : [];
  const evidence = Array.isArray(d.evidence) ? d.evidence : [];
  const gateClass = d.gateClass || (c && c.gateClass) || "—";
  const gateReason = d.gateReason || (c && c.gateReason);
  const intent = d.intentSha256 || (c && c.intentSha256);
  // Gated action links — a real decide surface is used ONLY if the backend
  // explicitly supplies it; otherwise the control renders visibly-locked.
  const approveUrl = d.approveUrl || (d.decideUrl && d.decideUrl.approve) || null;
  const rejectUrl = d.rejectUrl || (d.decideUrl && d.decideUrl.reject) || null;
  return h("div", { className: "mos__apd" },
    // Expected effect — the plain-language "what will happen".
    d.expectedEffect
      ? h("div", { className: "mos__apd-effect" },
          h("span", { className: "mos__apd-effect-k" }, h(Icon, { name: "zap", size: 12 }), "Erwarteter Effekt"),
          h("span", { className: "mos__apd-effect-v" }, d.expectedEffect))
      : null,
    // BETROFFENE FELDER — the structured field table (only if the card carried one).
    fields.length
      ? h("div", { className: "mos__apd-sec" },
          h("span", { className: "mos__apd-sec-h" }, "Betroffene Felder"),
          h("dl", { className: "mos__apd-fields" },
            fields.map((k) => h("div", { key: k, className: "mos__apd-field" },
              h("dt", null, _appcFieldLabel(k)),
              h("dd", null, String(d.structuredFields[k]))))))
      : null,
    // Affected objects — chips (adress-first identity where present).
    affected.length
      ? h("div", { className: "mos__apd-sec" },
          h("span", { className: "mos__apd-sec-h" }, "Betroffene Objekte"),
          h("div", { className: "mos__apd-chips" },
            affected.map((o, i) => h("span", { key: i, className: "mos__apd-chip" },
              h(Icon, { name: "building-2", size: 11 }), String(typeof o === "object" ? (o.label || o.id || JSON.stringify(o)) : o)))))
      : null,
    // Risks — honest amber list.
    risks.length
      ? h("div", { className: "mos__apd-sec" },
          h("span", { className: "mos__apd-sec-h" }, "Risiken"),
          h("ul", { className: "mos__apd-list mos__apd-list--risk" },
            risks.map((r, i) => h("li", { key: i },
              h(Icon, { name: "triangle-alert", size: 12 }),
              String(typeof r === "object" ? (r.text || r.detail || JSON.stringify(r)) : r)))))
      : null,
    // Evidence — read-only provenance list.
    evidence.length
      ? h("div", { className: "mos__apd-sec" },
          h("span", { className: "mos__apd-sec-h" }, "Belege / Evidenz"),
          h("ul", { className: "mos__apd-list" },
            evidence.map((e, i) => h("li", { key: i },
              h(Icon, { name: "file-text", size: 12 }),
              String(typeof e === "object" ? (e.text || e.ref || e.source || JSON.stringify(e)) : e)))))
      : null,
    // Proof hashes — the audit of exactly which intent/payload is gated.
    h("dl", { className: "mos__appc-detail mos__apd-hashes" },
      h("div", null, h("dt", null, "Gate"), h("dd", null, gateClass + (gateReason ? " · " + gateReason : ""))),
      d.status ? h("div", null, h("dt", null, "Status"), h("dd", null, d.status + (d.expiresAt ? " · läuft ab " + d.expiresAt : ""))) : null,
      intent ? h("div", null, h("dt", null, "Intent-Hash"), h("dd", { className: "mos__mono" }, intent)) : null,
      d.idempotencyKey ? h("div", null, h("dt", null, "Idempotenz"), h("dd", { className: "mos__mono" }, d.idempotencyKey)) : null,
      d.payloadSha256 ? h("div", null, h("dt", null, "Payload-Hash"), h("dd", { className: "mos__mono" }, d.payloadSha256)) : null,
      d.preconditionsSha256 ? h("div", null, h("dt", null, "Vorbedingungen"), h("dd", { className: "mos__mono" }, d.preconditionsSha256)) : null),
    // Gated action row — ALWAYS visible, so the "gegatete Aktions-Row" pattern is
    // legible (visible-but-locked) exactly as the mockup shows. When the backend
    // supplies a decide surface each button is a NAVIGATION-only deep-link into
    // the Operator's Hermes decide UI (new tab); when absent it renders visibly
    // DISABLED. Never a working control, never /approvals/decide, never a
    // fabricated navigation target.
    h("div", { className: "mos__apd-actions", role: "group", "aria-label": "Entscheidung — nur Operator" },
      h(GatedActionButton, { url: approveUrl, label: "Genehmigen", icon: "circle-check-big", variant: "approve" }),
      h(GatedActionButton, { url: rejectUrl, label: "Ablehnen", icon: "octagon-alert", variant: "reject" })),
    // Permanent lock caption — decision authority is the Operator, always visible.
    h("div", { className: "mos__apd-lock" },
      h(Icon, { name: "lock", size: 13 }),
      h("span", null, d.decisionNote
        || "Entscheidung (genehmigen/ablehnen) nur durch dich (Operator) über das Approval-Center / den Operator-Bot. Dieses Plugin liest nur — es ruft nie /approvals/decide.")));
}

// A pure-navigation deep-link. Renders NOTHING when no URL is supplied (never a
// disabled ghost) — the frontend never synthesizes a target, so an absent URL is
// an honest omission. No onClick side effect beyond navigating a new tab.
function DeepLinkButton(props) {
  const link = props.link;
  if (!link || !link.url) return null;
  return h("a", {
    className: "mos__deeplink" + (props.variant ? " mos__deeplink--" + props.variant : ""),
    href: link.url, target: "_blank", rel: "noopener noreferrer",
    title: link.label || props.label || "Im FSM öffnen",
  },
    props.icon ? h(Icon, { name: props.icon, size: 13 }) : null,
    h("span", null, props.label || link.label || "im FSM öffnen"),
    h(Icon, { name: "arrow-up-right", size: 12 }));
}

// One approval action control (Genehmigen / Ablehnen). If — and only if — the
// backend supplied a real decide URL, it is a NAVIGATION-only deep-link into the
// Operator's Hermes decide surface (new tab, no onClick side effect, never
// /approvals/decide). Without a URL it renders as a visibly DISABLED, locked
// button: the gated action row stays legible (sichtbar-aber-gesperrt) without
// ever becoming a working control or fabricating a target. The permanent lock
// caption below the row names the Operator as the sole decision authority.
function GatedActionButton(props) {
  const cls = "mos__deeplink mos__deeplink--" + props.variant;
  if (props.url) {
    return h("a", {
      className: cls, href: props.url, target: "_blank", rel: "noopener noreferrer",
      title: props.label + " im Operator-Approval-Center (Hermes) öffnen — Entscheidung dort, nie im Plugin.",
    },
      h(Icon, { name: props.icon, size: 13 }),
      h("span", null, props.label),
      h(Icon, { name: "arrow-up-right", size: 12 }));
  }
  return h("button", {
    type: "button", disabled: true, "aria-disabled": "true",
    className: cls + " is-gated",
    title: "Nur der Operator entscheidet — im Approval-Center (Hermes) bzw. über den Operator-Bot. Dieses Plugin kann nicht genehmigen/ablehnen.",
  },
    h(Icon, { name: props.icon, size: 13 }),
    h("span", null, props.label),
    h(Icon, { name: "lock", size: 12 }));
}

const APPC_MAX = 4;
function ApprovalCenter(props) {
  const a = props.approvals, load = props.load, scene = props.scene;
  const [openId, setOpenId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const st = a ? (a.state || "empty") : (load === "loading" ? "loading" : "unavailable");
  const cards = (a && Array.isArray(a.cards)) ? a.cards : [];
  const pending = a ? (a.pending != null ? a.pending : cards.length) : 0;
  // Scene (Entscheidungen-Center): never truncate + auto-expand the most urgent
  // (first) card once on entry, loading its detail. Cockpit (M1): unchanged.
  const initRef = useRef(false);
  const onLoadDetail = props.onLoadDetail;
  useEffect(() => {
    if (!scene || initRef.current || !cards.length) return;
    initRef.current = true;
    const firstId = cards[0].id;
    setOpenId(firstId);
    if (onLoadDetail) onLoadDetail(firstId);
  }, [scene, cards, onLoadDetail]);
  const max = props.compact ? 1 : APPC_MAX;
  const shown = (scene || showAll) ? cards : cards.slice(0, max);
  const extra = cards.length - shown.length;
  const onToggle = useCallback((id) => {
    setOpenId((p) => {
      const next = p === id ? null : id;
      if (next && scene && onLoadDetail) onLoadDetail(next);
      return next;
    });
  }, [scene, onLoadDetail]);
  const body = load === "loading" && !a
    ? [0, 1].map((i) => h("div", { key: i, className: "mos__skrow" }))
    : cards.length
      ? [
          ...shown.map((c) => h(ApprovalCard, { key: c.id, card: c, open: openId === c.id, onToggle: onToggle,
            scene: scene, detail: scene && props.details ? props.details[c.id] : undefined,
            detailLoading: scene && props.detailLoading ? !!props.detailLoading[c.id] : false })),
          (extra > 0 && !scene)
            ? h("button", { key: "more", type: "button", className: "mos__appc-more", onClick: props.compact ? props.onMore : () => setShowAll(true) },
                h(Icon, { name: "ellipsis", size: 14 }), "+" + extra + " weitere")
            : null,
        ]
      : h(ZoneEmpty, { state: st, icon: "inbox",
          title: st === "unavailable" || st === "error" ? "Approval-Quelle nicht erreichbar" : "Keine offenen Freigaben",
          note: a && a.note });
  // In the scene the card list is the whole surface (no card chrome/header — the
  // scene provides its own H1); in the cockpit it stays a bordered zone card.
  if (scene) {
    return h("div", { className: "mos__appc mos__appc--scene", role: "list", "aria-label": "Offene Freigaben" }, body);
  }
  return h("section", { className: "mos__card mos__appc" + (props.flash ? " is-flash" : ""), ref: props.innerRef, id: "mos-approvals" },
    h("header", { className: "mos__card-head" },
      h(Icon, { name: "shield-check", size: 16 }),
      h("span", { className: "mos__card-title" }, "Freigaben"),
      pending > 0 ? h("span", { className: "mos__appc-count" }, pending) : null,
      props.onOpen
        ? h("button", { type: "button", className: "mos__card-open mos__card-open--icon", onClick: props.onOpen,
            title: "Entscheidungen-Center öffnen (Intent-Hash, Effekt-Felder · Entscheidung nur Operator)",
            "aria-label": "Entscheidungen-Center öffnen" },
            h(Icon, { name: "arrow-up-right", size: 15 }))
        : null,
      h(ZonePip, { state: st, observedAt: a && a.observedAt, source: a && a.source, note: a && a.note })),
    h("div", { className: "mos__appc-body" }, body));
}

// --- FIRMA / Rise-L full-card + scene (M2) ---------------------------------
// A full-size read-only projection card for one company-signal domain. Body
// rows reuse the exact FirmaMetric row vocabulary the backend already emits
// ({icon,accent,title,sub,value|status/statusLabel}); footer is the generalized
// mos__firma-foot provenance line ({source,observedAt,permission}); the deep-
// link ("im FSM öffnen") renders ONLY when the backend supplied a URL.
function FirmaDomainCard(props) {
  const card = props.card || {};
  const st = card.state || (props.load === "loading" ? "loading" : "unavailable");
  const rows = Array.isArray(card.rows) ? card.rows : [];
  const bad = st === "unavailable" || st === "error";
  const empty = st === "empty";
  const fresh = card.observedAt ? freshnessLabel(card.observedAt) : null;
  const deep = card.deepLink && card.deepLink.url ? card.deepLink : null;
  return h("section", { className: "mos__card mos__fdcard" },
    h("header", { className: "mos__card-head mos__fdcard-head" },
      h(Icon, { name: card.icon || "server", size: 16 }),
      h("span", { className: "mos__card-title" }, card.title || card.id),
      deep
        ? h(DeepLinkButton, { link: deep, label: deep.label || "im FSM öffnen",
            icon: deep.externalSystem === "paperless" ? "folder-open" : "external-link" })
        : null,
      h(ZonePip, { state: st, observedAt: card.observedAt, source: card.source, note: card.note })),
    h("div", { className: "mos__fdcard-body" },
      card.summary && !bad
        ? h("div", { className: "mos__fdcard-summary" }, card.summary)
        : null,
      props.load === "loading" && !props.card
        ? [0, 1, 2].map((i) => h("div", { key: i, className: "mos__skrow" }))
        : (bad || empty || !rows.length)
          ? h(ZoneEmpty, { state: bad ? st : "empty", icon: card.icon || "inbox",
              title: bad ? (card.summary || "Quelle nicht erreichbar") : (card.summary || "Keine Signale"),
              note: card.note })
          : h("div", { className: "mos__fdcard-rows" },
              rows.map((r, i) => h(FirmaMetric, { key: i, row: r })))),
    h("footer", { className: "mos__firma-foot mos__fdcard-foot" },
      h(Icon, { name: "lock", size: 12 }),
      h("span", { className: "mos__firma-foot-t" },
        (card.source ? "Quelle: " + card.source : "Firma-Signal")
        + (fresh ? " · Stand: " + fresh : "")),
      h("span", { className: "mos__firma-foot-ro" }, card.permission ? "Nur lesen" : "Nur lesen")));
}

// Scene A — FIRMA / Rise-L: the 6-card company-signal projection grid.
const FIRMA_CARD_ORDER = ["auftraege", "billing", "dispo", "wartung", "dokumente", "runtime"];
function FirmaScene(props) {
  const ov = props.firma;
  const load = props.load;
  const raw = (ov && Array.isArray(ov.cards)) ? ov.cards : [];
  const byId = {};
  raw.forEach((c) => { byId[c.id] = c; });
  const ordered = FIRMA_CARD_ORDER.map((id) => byId[id]).filter(Boolean);
  const cards = ordered.length ? ordered : raw;
  const offline = load === "offline" || (!ov && load !== "loading");
  return h("div", { className: "mos__firmascene" },
    offline && !cards.length
      ? h(ZoneEmpty, { state: "unavailable", icon: "server",
          title: "Firma-Projektion nicht erreichbar",
          note: "Read-Modelle offline — die Karten erscheinen, sobald /firma/overview wieder antwortet." })
      : h("div", { className: "mos__firmagrid" },
          (cards.length ? cards : FIRMA_CARD_ORDER.map((id) => ({ id }))).map((c) =>
            h(FirmaDomainCard, { key: c.id, card: (ov ? c : null), load: load }))));
}

// Scene B — Entscheidungen: SummaryRail (category tally) + full card list.
// The tally reuses the existing gateCategory() — zero new categorization logic.
const SUMMARY_BUCKETS = [
  { key: "Geld", icon: "banknote", tone: "amber" },
  { key: "Kunde", icon: "building-2", tone: "blue" },
  { key: "Daten", icon: "octagon-alert", tone: "red" },
  { key: "Personal", icon: "user", tone: "violet" },
];
function SummaryRail(props) {
  const cards = props.cards || [];
  const counts = {};
  cards.forEach((c) => {
    const cat = gateCategory(c.gateClass, c.gateReason, c.text);
    counts[cat.label] = (counts[cat.label] || 0) + 1;
  });
  const total = cards.length;
  return h("aside", { className: "mos__sumrail" },
    h("div", { className: "mos__sumrail-head" },
      h("b", null, total),
      h("span", null, "offen · nach Kategorie")),
    h("div", { className: "mos__sumrail-list" },
      SUMMARY_BUCKETS.map((b) => h("div", { key: b.key, className: "mos__sumrail-row mos__sumrail-row--" + b.tone + ((counts[b.key] || 0) ? "" : " is-zero") },
        h("span", { className: "mos__sumrail-ico" }, h(Icon, { name: b.icon, size: 14 })),
        h("span", { className: "mos__sumrail-k" }, b.key),
        h("span", { className: "mos__sumrail-n" }, counts[b.key] || 0)))));
}

function ApprovalsScene(props) {
  const a = props.approvals;
  const cards = (a && Array.isArray(a.cards)) ? a.cards : [];
  return h("div", { className: "mos__apscene" },
    h(SummaryRail, { cards: cards }),
    h("div", { className: "mos__apscene-main" },
      h(ApprovalCenter, { approvals: a, load: props.load, scene: true,
        details: props.details, detailLoading: props.detailLoading, onLoadDetail: props.onLoadDetail })));
}

// --- Cockpit desktop assembly (3-column grid) ---------------------------------
function CockpitScene(props) {
  return h("div", { className: "mos__ckpt" },
    h("aside", { className: "mos__ckpt-col mos__ckpt-left" },
      h(WorkspaceSwitcher, { active: props.workspace, onChange: props.onWorkspace }),
      h(AgendaRail, { workspace: props.workspace, todayModule: props.byId.today,
        engineeringModule: props.byId.engineering, load: props.load, onMore: props.onAgendaMore })),
    h("section", { className: "mos__ckpt-col mos__ckpt-center" },
      h(JarvisLive, { jarvis: props.cockpit.jarvis, load: props.cockpitLoad, workspace: props.workspace,
        stateIndex: props.stateIndex, greeting: props.greeting, onPropose: props.onPropose, onChip: props.onChip })),
    h("aside", { className: "mos__ckpt-col mos__ckpt-right" },
      h(FirmaPanel, { risel: props.byId.risel, company: props.byId.company, load: props.load, onOpen: props.onFirma }),
      h(ApprovalCenter, { approvals: props.cockpit.approvals, load: props.cockpitLoad,
        flash: props.approvalsFlash, innerRef: props.approvalsRef, onOpen: props.onApprovals })));
}

// --- Mobile cockpit stack (inside the existing home tab) -----------------------
function MobileCockpit(props) {
  const c = props.cockpit || {};
  const j = c.jarvis;
  const chat = j && j.chat;
  // Same dedup as the desktop JarvisLive: the approval zone (KPI pill + the
  // ApprovalCenter card below) owns the "Freigaben" count — the Jarvis teaser
  // does not restate it (UI-SPEC §3).
  const hints = (j && Array.isArray(j.hints)) ? j.hints.filter((x) => x.id !== "gates_pending") : [];
  const topHint = hints[0];
  const chatOk = chat && chat.connected;
  return h("div", { className: "mos__mckpt" },
    // KPI strip — horizontal scroll, 2 visible + fade edge.
    h("div", { className: "mos__mckpt-kpis" },
      h(KpiBar, { cockpit: c, load: props.cockpitLoad, onGates: props.onGoApprovals })),
    // Jarvis teaser → opens the full jarvis tab.
    h("button", { type: "button", className: "mos__mckpt-jarvis", onClick: props.onGoJarvis, "aria-label": "Jarvis öffnen" },
      h("span", { className: "mos__mckpt-orb" }, h(Orb, { label: false })),
      h("span", { className: "mos__mckpt-jbody" },
        h("span", { className: "mos__mckpt-jhead" }, h("b", null, "Jarvis"),
          chat ? h("span", { className: "mos__pip mos__pip--" + (chatOk ? "verified" : "red") },
            h("span", { className: "mos__pip-dot", "aria-hidden": "true" }), chatOk ? "Chat bereit" : "Chat offline") : null),
        h("span", { className: "mos__mckpt-jline" },
          topHint ? topHint.title : (props.cockpitLoad === "loading" ? "Lädt Zustand …" : "Kein offener Hinweis."))),
      h(Icon, { name: "chevron-right", size: 18 })),
    // Agenda (Heute) — max 3.
    h(AgendaRailMobile, { workspace: props.workspace, todayModule: props.byId.today,
      engineeringModule: props.byId.engineering, load: props.load, onMore: props.onGoTimeline }),
    // Firma compact.
    h(FirmaPanel, { risel: props.byId.risel, company: props.byId.company, load: props.load, onOpen: props.onGoFirma }),
    // Approvals — compact (max 1 + counter → deep link).
    h(ApprovalCenter, { approvals: c.approvals, load: props.cockpitLoad, compact: true,
      onMore: props.onGoApprovals, onOpen: props.onGoApprovals }));
}
// Mobile agenda = the desktop AgendaRail capped at 3 rows.
function AgendaRailMobile(props) {
  return h("div", { className: "mos__mckpt-agenda" }, h(AgendaRail, { ...props }));
}

// Idle-Ambient morph (UI-SPEC §0): after `ms` with no interaction AND Jarvis at
// rest, the Cockpit morphs to the Konstellation. Disabled under reduced motion
// (the scene switch is a hard cut, not a skeleton detail). The user returns via
// the SceneSwitcher — never auto-morphed back.
function useIdleTimer(active, ms, onIdle) {
  const cb = useRef(onIdle); cb.current = onIdle;
  useEffect(() => {
    if (!active || prefersReducedMotion() || typeof window === "undefined") return;
    let t = null;
    const reset = () => { if (t) window.clearTimeout(t); t = window.setTimeout(() => { if (cb.current) cb.current(); }, ms); };
    const evs = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { if (t) window.clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, reset)); };
  }, [active, ms]);
}

function MikaelOS() {
  const [workspace, setWorkspace] = useState("private");
  const [modules, setModules] = useState(MODULES);
  const [focusId, setFocusId] = useState("engineering");
  const [stateIndex, setStateIndex] = useState(0);
  const [command, setCommand] = useState("");
  // Phase 4 — desktop scene toggle (Konstellation ⇄ Timeline), iOS shell switch,
  // active mobile tab, and the mobile focus bottom-sheet (open + detent index).
  const [scene, setScene] = useState("cockpit"); // cockpit (default) | constellation | timeline | firma | approvals
  const isMobile = useMediaQuery("(max-width: 430px)");
  const [mobileTab, setMobileTab] = useState("home"); // home | timeline | jarvis | module | profil
  // M2 — mobile full-screen drill-down (null | "firma" | "approvals"), pushed
  // above the tab content (hides tab bar + dock) with a back-chevron.
  const [mobileScreen, setMobileScreen] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDetent, setSheetDetent] = useState(1); // index into SHEET_DETENTS
  // Live read-model overview (null until the plugin adapter responds; a failed
  // or absent fetch simply leaves the concept fixtures in place — the shell
  // must never break because a source is down).
  const [live, setLive] = useState(null);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | offline
  // Cockpit read-model (M1): the three /cockpit/* routes. Each zone stays honest
  // on its own — a missing payload shows unavailable, never a fabricated value.
  const [cockpit, setCockpit] = useState({ kpi: null, jarvis: null, approvals: null });
  const [cockpitLoad, setCockpitLoad] = useState("loading"); // loading | ready | offline
  // M2 — FIRMA/Rise-L overview bundle (/firma/overview) + lazily-loaded per-card
  // approval detail (/firma/approvals/detail?id=). Read-only; a failed fetch
  // leaves the honest offline/unavailable state — never a fabricated value.
  const [firma, setFirma] = useState(null);
  const [firmaLoad, setFirmaLoad] = useState("loading"); // loading | ready | offline
  const [approvalDetails, setApprovalDetails] = useState({});      // id -> detail payload
  const [approvalDetailLoading, setApprovalDetailLoading] = useState({}); // id -> bool
  // Focus flash for the Approval-Center when the Gates-KPI is clicked (§6).
  const [approvalsFlash, setApprovalsFlash] = useState(false);
  const approvalsRef = useRef(null);
  // Phase 3 — the propose lifecycle overlay state (null = closed). Shape:
  // { phase, objective, preview, gate, cardId, controlPlane, note, error }.
  const [propose, setPropose] = useState(null);
  // L-2 — the read-only review/drill overlay (null = closed). Shape:
  // { phase: loading|ready|empty|unavailable|error|done, data, index, flipped, reviewed }.
  const [review, setReview] = useState(null);
  // L-3 — the Lern-Coach overlay (null = closed). Shape:
  // { tab, planState, plan, fey: { phase, setup, explanation, result } }.
  const [coach, setCoach] = useState(null);

  // Fetch the read-only /overview projection. Refactored into a callback so a
  // reconnect (window focus / back online) can re-run it and the UI shows the
  // current state immediately. Any error → `offline` so fixtures remain visible.
  const loadOverview = useCallback(() => {
    setLoadState((p) => (p === "ready" ? "ready" : "loading"));
    sdkGet(PLUGIN_API + "/overview")
      .then((data) => { setLive(data); setLoadState("ready"); })
      .catch(() => { setLoadState((p) => (p === "ready" ? "ready" : "offline")); });
  }, []);
  // Fetch the three Cockpit read routes in parallel. Each is independently
  // honest: a rejected route leaves its zone null (→ unavailable), the batch
  // only flips to "offline" when ALL three fail. Never fabricates a value.
  const loadCockpit = useCallback(() => {
    setCockpitLoad((p) => (p === "ready" ? "ready" : "loading"));
    Promise.allSettled([sdkGet(KPI_API), sdkGet(JARVIS_STATE_API), sdkGet(APPROVALS_API)])
      .then(([k, j, a]) => {
        setCockpit({
          kpi: k.status === "fulfilled" ? k.value : null,
          jarvis: j.status === "fulfilled" ? j.value : null,
          approvals: a.status === "fulfilled" ? a.value : null,
        });
        setCockpitLoad([k, j, a].some((r) => r.status === "fulfilled") ? "ready" : "offline");
      });
  }, []);
  // M2 — read the FIRMA/Rise-L bundle. Same honesty contract: any error → the
  // scene shows an honest offline/unavailable state; never a fabricated value.
  const loadFirma = useCallback(() => {
    setFirmaLoad((p) => (p === "ready" ? "ready" : "loading"));
    sdkGet(FIRMA_OVERVIEW_API)
      .then((data) => { setFirma(data); setFirmaLoad("ready"); })
      .catch(() => { setFirmaLoad((p) => (p === "ready" ? "ready" : "offline")); });
  }, []);
  // Lazily load ONE approval card's full detail (Entscheidungen-Center). Read-
  // only; never decides. Cached per id; a re-open re-uses the cache.
  const loadApprovalDetail = useCallback((id) => {
    if (!id) return;
    setApprovalDetails((prev) => {
      if (prev[id]) return prev; // already loaded — keep cache
      setApprovalDetailLoading((l) => ({ ...l, [id]: true }));
      sdkGet(FIRMA_APPROVAL_DETAIL_API + "?id=" + encodeURIComponent(id))
        .then((data) => {
          setApprovalDetails((p) => ({ ...p, [id]: data }));
          setApprovalDetailLoading((l) => ({ ...l, [id]: false }));
        })
        .catch(() => {
          setApprovalDetails((p) => ({ ...p, [id]: { ok: false, found: false, note: "Detail nicht erreichbar." } }));
          setApprovalDetailLoading((l) => ({ ...l, [id]: false }));
        });
      return prev;
    });
  }, []);
  useEffect(() => { loadOverview(); loadCockpit(); loadFirma(); }, [loadOverview, loadCockpit, loadFirma]);
  // Reconnect: on regained focus / online, re-read the models so a returning
  // session sees the live state at once (no stale snapshot lingering).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reload = () => { loadOverview(); loadCockpit(); loadFirma(); };
    window.addEventListener("online", reload);
    window.addEventListener("focus", reload);
    return () => { window.removeEventListener("online", reload); window.removeEventListener("focus", reload); };
  }, [loadOverview, loadCockpit, loadFirma]);

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
  // Time-of-day greeting for the mobile Jarvis presence — a greeting, not data
  // truth, so it may read the real clock without violating the concept honesty.
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 5) return "Gute Nacht";
    if (hr < 11) return "Guten Morgen";
    if (hr < 17) return "Guten Tag";
    if (hr < 22) return "Guten Abend";
    return "Gute Nacht";
  }, []);
  // Polite screen-reader announcement — recomputed when the Jarvis lifecycle or
  // the read-model load status changes, so non-visual users get the same signal
  // the colour/motion cues carry. Kept terse so it isn't chatty.
  const announce = useMemo(() => {
    const load = loadState === "loading" ? "Read-Modelle werden geladen."
      : loadState === "offline" ? "Quellen offline, Konzeptdaten."
      : (liveCount > 0 ? liveCount + " Module live." : "Konzeptdaten.");
    return "Jarvis: " + jarvisStateText(stateIndex) + ". " + load;
  }, [stateIndex, loadState, liveCount]);
  const goJarvis = useCallback(() => { setMobileTab("jarvis"); }, []);
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

  // "Latest value" refs so the global keydown handler can read current state
  // WITHOUT listing modules/focusId/etc. in its effect deps — otherwise the
  // window keydown listener was detached + re-attached on every drag frame (a
  // node drag mutates `modules` ~60×/s). Assigned during render; always current.
  const modulesRef = useRef(modules); modulesRef.current = modules;
  const focusIdRef = useRef(focusId); focusIdRef.current = focusId;
  const sheetOpenRef = useRef(sheetOpen); sheetOpenRef.current = sheetOpen;
  const isMobileRef = useRef(isMobile); isMobileRef.current = isMobile;
  // While the review/drill overlay is open it owns the keyboard (Space/1–4/Esc);
  // the global shell handler defers to it so digits don't also focus ring nodes.
  const reviewOpenRef = useRef(false); reviewOpenRef.current = !!review;
  // The Lern-Coach overlay likewise owns the keyboard (Esc/typing) while open.
  const coachOpenRef = useRef(false); coachOpenRef.current = !!coach;
  // Current propose state, so the profile survives into preview/send callbacks.
  const proposeRef = useRef(null); proposeRef.current = propose;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  // Demo state-machine — drive Bereit→…→Verifiziert. Explicitly a demonstration:
  // no real receipt exists, so "Ausführung/Verifiziert" here are visual only.
  const runStateSequence = useCallback(() => {
    clearTimers();
    if (prefersReducedMotion()) { setStateIndex(STATES.length - 1); return; }
    const steps = [1, 2, 3, 4, 5, 6];
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

  // --- Phase 3: propose lifecycle handlers (propose-only, gate-led) ---------
  // Open the overlay. With an objective -> straight to the Dry-Run preview;
  // empty -> a compose step so the user names the task first.
  const proposeOpen = useCallback((objective, profile) => {
    const obj = (objective || "").trim();
    const prof = profile || "engineering";
    const api = (PROPOSE_PROFILES[prof] || PROPOSE_PROFILES.engineering).api;
    if (!obj) { setPropose({ phase: "compose", objective: "", profile: prof }); return; }
    setPropose({ phase: "loading", objective: obj, profile: prof });
    sdkPost(api, { objective: obj, dryRun: true })
      .then((r) => {
        if (!r || r.ok === false) {
          setPropose({ phase: "compose", objective: obj, profile: prof,
            error: (r && r.note) || "Vorschau nicht möglich." });
          return;
        }
        setPropose({ phase: "preview", objective: r.plan.objective, preview: r, profile: prof,
          gate: r.predictedGate, controlPlane: r.controlPlane, note: null });
      })
      .catch(() => setPropose({ phase: "compose", objective: obj, profile: prof, error: "Vorschau nicht erreichbar." }));
  }, []);
  const proposeObjective = useCallback((v) => {
    setPropose((prev) => (prev ? { ...prev, objective: v, error: null } : prev));
  }, []);
  // Build/refresh the dry-run preview (NO gate fired). `back=true` returns to
  // compose. The active profile is read off the ref (kept current on render).
  const proposePreview = useCallback((objective, back) => {
    const prof = (proposeRef.current && proposeRef.current.profile) || "engineering";
    if (back) { setPropose({ phase: "compose", objective: (proposeRef.current && proposeRef.current.objective) || "", profile: prof }); return; }
    proposeOpen(objective, prof);
  }, [proposeOpen]);
  // The ONLY live step — an explicit user click. Fires the plugin's gated propose
  // route with dryRun:false; the backend hands it to :18083/actions (gated).
  const proposeSend = useCallback((objective) => {
    const obj = (objective || "").trim();
    if (!obj) return;
    const prof = (proposeRef.current && proposeRef.current.profile) || "engineering";
    const api = (PROPOSE_PROFILES[prof] || PROPOSE_PROFILES.engineering).api;
    setPropose((prev) => ({ ...(prev || {}), phase: "submitting", objective: obj }));
    sdkPost(api, { objective: obj, dryRun: false })
      .then((r) => {
        if (!r || (r.ok === false && r.status !== "auth_pending")) {
          setPropose((prev) => ({ ...(prev || {}), phase: "error", objective: obj,
            note: (r && r.note) || "An das Gate senden fehlgeschlagen." }));
          return;
        }
        const lifecycle = r.lifecycle || (r.status === "auth_pending" ? "auth_pending" : "waiting_approval");
        setPropose((prev) => ({ ...(prev || {}), phase: lifecycle, objective: obj,
          cardId: r.cardId, controlPlane: r.controlPlane, gate: r.gate, note: r.note }));
      })
      .catch(() => setPropose((prev) => ({ ...(prev || {}), phase: "error", objective: obj,
        note: "Control-Plane nicht erreichbar." })));
  }, []);
  // Read the real receipt (Approval-Card / mission.v2) — never decides anything.
  const proposePoll = useCallback((stt) => {
    const s = stt || {};
    const q = s.cardId ? ("cardId=" + encodeURIComponent(s.cardId))
      : ("objective=" + encodeURIComponent(s.objective || ""));
    sdkGet(RECEIPT_API + "?" + q)
      .then((r) => {
        if (!r) return;
        const lifecycle = r.lifecycle || "waiting_approval";
        setPropose((prev) => ({ ...(prev || {}), phase: lifecycle,
          cardId: r.cardId || (prev && prev.cardId), note: r.note }));
      })
      .catch(() => { /* keep waiting; a failed read never fakes a receipt */ });
  }, []);
  const proposeClose = useCallback(() => { setPropose(null); }, []);

  // --- L-2: review/drill handlers (READ-ONLY, nothing persisted) ------------
  // Open the overlay and fetch the read-only session. The plugin never grades
  // and never writes the collection — real grading happens in Anki/AnkiDroid.
  const reviewOpen = useCallback(() => {
    setReview({ phase: "loading", data: null, index: 0, flipped: false, reviewed: 0 });
    sdkGet(REVIEW_API + "?limit=20")
      .then((d) => {
        const cards = (d && Array.isArray(d.cards)) ? d.cards : [];
        let phase;
        if (!d) phase = "error";
        else if (cards.length) phase = "ready";
        else if (d.state === "unavailable" || d.state === "error") phase = "unavailable";
        else phase = "empty";
        setReview({ phase, data: d || null, index: 0, flipped: false, reviewed: 0 });
      })
      .catch(() => setReview({ phase: "error", data: null, index: 0, flipped: false, reviewed: 0 }));
  }, []);
  const reviewFlip = useCallback(() => {
    setReview((p) => (p && p.phase === "ready" && !p.flipped ? { ...p, flipped: true } : p));
  }, []);
  // Rate = advance the drill locally (NO persist). At the end of the deck the
  // surface moves to the honest "done" summary; it never writes a grade.
  const reviewRate = useCallback(() => {
    setReview((p) => {
      if (!p || p.phase !== "ready" || !p.flipped) return p;
      const cards = (p.data && p.data.cards) || [];
      const nextIdx = p.index + 1;
      const reviewed = p.reviewed + 1;
      if (nextIdx >= cards.length) return { ...p, phase: "done", reviewed };
      return { ...p, index: nextIdx, flipped: false, reviewed };
    });
  }, []);
  const reviewRestart = useCallback(() => {
    setReview((p) => {
      if (!p) return p;
      const hasCards = p.data && Array.isArray(p.data.cards) && p.data.cards.length;
      return { ...p, phase: hasCards ? "ready" : p.phase, index: 0, flipped: false, reviewed: 0 };
    });
  }, []);
  const reviewClose = useCallback(() => { setReview(null); }, []);

  // --- L-3: Lern-Coach handlers (READ + gated-propose only) -----------------
  // Open the coach: fetch the read-only Countdown/Pacing plan + stage a Feynman
  // round. Neither call writes; the Feynman grade (later) comes from Jarvis.
  const coachLoadFeynman = useCallback((concept) => {
    const q = concept ? ("?concept=" + encodeURIComponent(concept)) : "";
    setCoach((p) => (p ? { ...p, fey: { ...(p.fey || {}), phase: "loading" } } : p));
    sdkGet(FEYNMAN_API + q)
      .then((d) => setCoach((p) => (p ? { ...p, fey: { phase: "ready", setup: d || {}, explanation: "", result: null } } : p)))
      .catch(() => setCoach((p) => (p ? { ...p, fey: { phase: "ready", setup: {}, explanation: "", result: null } } : p)));
  }, []);
  const coachOpen = useCallback(() => {
    setCoach({ tab: "countdown", planState: "loading", plan: null,
      fey: { phase: "loading", setup: {}, explanation: "", result: null } });
    sdkGet(STUDY_PLAN_API)
      .then((d) => setCoach((p) => (p ? { ...p, planState: (d ? "ready" : "error"), plan: d || null } : p)))
      .catch(() => setCoach((p) => (p ? { ...p, planState: "error" } : p)));
    coachLoadFeynman("");
  }, [coachLoadFeynman]);
  const coachTab = useCallback((t) => { setCoach((p) => (p ? { ...p, tab: t } : p)); }, []);
  const coachExplain = useCallback((v) => {
    setCoach((p) => (p ? { ...p, fey: { ...(p.fey || {}), explanation: v } } : p));
  }, []);
  const coachNextConcept = useCallback(() => { coachLoadFeynman(""); }, [coachLoadFeynman]);
  // Send the explanation to Jarvis for grading. The plugin NEVER fakes a grade:
  // an honest pending/error result is shown if Jarvis is unreachable / no token.
  const coachEvaluate = useCallback(() => {
    const cur = coach && coach.fey;
    const expl = (cur && cur.explanation || "").trim();
    if (!expl) return;
    const concept = (cur && cur.setup && cur.setup.concept) || "";
    setCoach((p) => (p ? { ...p, fey: { ...(p.fey || {}), phase: "evaluating" } } : p));
    sdkPost(FEYNMAN_EVAL_API, { concept: concept, explanation: expl })
      .then((r) => setCoach((p) => (p ? { ...p, fey: { ...(p.fey || {}), phase: "done", result: r || { ok: false, note: "Keine Antwort." } } } : p)))
      .catch(() => setCoach((p) => (p ? { ...p, fey: { ...(p.fey || {}), phase: "done", result: { ok: false, note: "Jarvis nicht erreichbar — nichts bewertet, nichts gespeichert.", jarvisDependent: true } } } : p)));
  }, [coach]);
  const coachClose = useCallback(() => { setCoach(null); }, []);
  // Launching a Prüfungsplan-Vorschlag leaves the coach and opens the gated
  // propose overlay (so it's never stacked behind the coach modal).
  const coachPropose = useCallback((objective, profile) => {
    setCoach(null);
    proposeOpen(objective, profile);
  }, [proposeOpen]);

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
    // Coalesce pointer moves to one state commit per animation frame. Raw
    // pointermove can fire several times per frame; each setModules re-renders
    // all ten ring nodes + rebuilds every connector path, so committing at most
    // once per rAF keeps the drag smooth instead of thrashing.
    let rafId = 0;
    let pending = null;
    const commit = () => {
      rafId = 0;
      if (!pending) return;
      const p = pending; pending = null;
      setModules((prev) => prev.map((m) => (m.id === p.id ? { ...m, pos: { x: p.x, y: p.y } } : m)));
    };
    function onMove(e) {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < 5) return;
      if (!d.moved) { d.moved = true; setDragId(d.id); }
      const nx = Math.max(4, Math.min(96, ((e.clientX - d.rect.left) / d.rect.width) * 100));
      const ny = Math.max(4, Math.min(96, ((e.clientY - d.rect.top) / d.rect.height) * 100));
      pending = { id: d.id, x: nx, y: ny };
      if (!rafId) rafId = window.requestAnimationFrame(commit);
    }
    function onUp() {
      const d = dragRef.current;
      dragRef.current = null;
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
      if (pending) { commit(); }
      if (d && d.moved) { setDragId(null); }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Keyboard: ⌘K/Ctrl-K command mode, 1–9 focus a module, Esc close, arrows cycle.
  useEffect(() => {
    function onKey(e) {
      const k = e.key;
      // The review/drill + coach overlays are modal and own the keyboard while open.
      if (reviewOpenRef.current || coachOpenRef.current) return;
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
      const mods = modulesRef.current;
      if (k === "Escape") { if (sheetOpenRef.current) { setSheetOpen(false); } else { closeFocus(); } return; }
      if (k >= "1" && k <= "9") {
        const idx = parseInt(k, 10) - 1;
        if (mods[idx]) { if (isMobileRef.current) openModule(mods[idx].id); else activate(mods[idx].id); }
        return;
      }
      if (k === "ArrowRight" || k === "ArrowLeft") {
        const ids = mods.map((m) => m.id);
        const cur = ids.indexOf(focusIdRef.current);
        const next = cur === -1
          ? (k === "ArrowRight" ? 0 : ids.length - 1)
          : (cur + (k === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
        activate(ids[next]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activate, closeFocus, openModule]);

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

  // Cockpit → Konstellation idle-morph (§0): only while the Cockpit is showing,
  // Jarvis is at rest (stateIndex 0 / ready), and not on mobile. Disabled under
  // reduced motion inside the hook. 90s of no interaction hands over to the orb.
  useIdleTimer(scene === "cockpit" && stateIndex === 0 && !isMobile, 90000,
    useCallback(() => setScene("constellation"), []));

  // M2 navigation — the Gates-KPI, the FIRMA zone header and the Approval zone
  // header all converge on the dedicated peer scenes (no modal, never a decision).
  const onGates = useCallback(() => setScene("approvals"), []);
  const onFirma = useCallback(() => setScene("firma"), []);
  const onApprovals = useCallback(() => setScene("approvals"), []);
  const onSceneBack = useCallback(() => setScene("cockpit"), []);
  const onChip = useCallback((label) => { setCommand(label); if (inputRef.current) inputRef.current.focus(); }, []);
  const onAgendaMore = useCallback(() => setScene("timeline"), []);
  const onGoTimeline = useCallback(() => { if (isMobile) setMobileTab("timeline"); else setScene("timeline"); }, [isMobile]);
  // Mobile: the FIRMA / Approval entry points push a full mobile screen.
  const onGoApprovals = useCallback(() => { setMobileScreen("approvals"); }, []);
  const onGoFirma = useCallback(() => { setMobileScreen("firma"); }, []);
  const onScreenBack = useCallback(() => { setMobileScreen(null); }, []);

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
        greeting: greeting, onGoJarvis: goJarvis, announce: announce,
        sheetOpen: sheetOpen, sheetDetent: sheetDetent,
        onSheetDetent: setSheetDetent, onSheetClose: closeSheet,
        onPropose: proposeOpen, onReview: reviewOpen, onCoach: coachOpen,
        cockpit: cockpit, cockpitLoad: cockpitLoad,
        onChip: onChip, onGoTimeline: onGoTimeline, onGoApprovals: onGoApprovals, onGoFirma: onGoFirma,
        mobileScreen: mobileScreen, onScreenBack: onScreenBack,
        firma: firma, firmaLoad: firmaLoad,
        approvalDetails: approvalDetails, approvalDetailLoading: approvalDetailLoading, onLoadDetail: loadApprovalDetail,
      }),
      h(ProposeFlow, {
        state: propose, onObjective: proposeObjective, onPreview: proposePreview,
        onSend: proposeSend, onPoll: proposePoll, onClose: proposeClose,
      }),
      h(ReviewSurface, {
        state: review, onFlip: reviewFlip, onRate: reviewRate,
        onRestart: reviewRestart, onClose: reviewClose,
      }),
      h(CoachSurface, {
        state: coach, onTab: coachTab, onExplain: coachExplain,
        onEvaluate: coachEvaluate, onNextConcept: coachNextConcept,
        onPropose: coachPropose, onClose: coachClose,
      }),
    );
  }

  // The command bar + chips and the constellation footer are shared across
  // scenes (Cockpit reuses the command bar under a StateRail; Konstellation/
  // Timeline keep command-bar → footer). Built once, placed per scene below.
  const commandForm = h(
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
      h("button", {
        key: "propose", type: "button", className: "mos__chip mos__chip--propose",
        onClick: () => proposeOpen(command),
        title: "Baut eine Dry-Run-Vorschau — sendet nichts, bis du klickst.",
      }, h(Icon, { name: "git-branch", size: 14 }), "Codex-Aufgabe vorschlagen"),
      CHIPS.map((c) =>
        h("button", { key: c.label, type: "button", className: "mos__chip", onClick: () => { setCommand(c.label); if (inputRef.current) inputRef.current.focus(); } },
          h(Icon, { name: c.icon, size: 14 }), c.label)),
    ),
  );
  const constFooter = h(
    "footer",
    { className: "mos__footer" },
    h(
      "button",
      { type: "button", className: "mos__quick", title: NOT_WIRED },
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
  );

  const isBackScene = scene === "firma" || scene === "approvals";
  return h(
    "div",
    { className: "mos" + (scene === "timeline" ? " mos--timeline" : scene === "cockpit" ? " mos--cockpit" : isBackScene ? " mos--cockpit mos--" + scene : "") },
    h("div", { className: "mos__atmosphere", "aria-hidden": "true" }),
    h("div", { className: "mos__atmosphere-veil", "aria-hidden": "true" }),
    h(LiveAnnouncer, { message: announce }),
    h(
      "main",
      { className: "mos__shell", role: "main" },
      h("h1", { className: "mos__sr-only" }, "MIKAEL OS — Persönliches System"),
      h(TopBar, { loadState: loadState, liveCount: liveCount, total: viewModules.length, scene: scene, onScene: setScene,
        onBack: isBackScene ? onSceneBack : undefined }),
      scene === "cockpit"
        ? h(
            React.Fragment,
            null,
            h(KpiBar, { cockpit: cockpit, load: cockpitLoad, onGates: onGates }),
            h("div", { className: "mos__stagewrap mos__stagewrap--ckpt" },
              h(CockpitScene, {
                byId: enrichedById, workspace: workspace, onWorkspace: setWorkspace,
                cockpit: cockpit, cockpitLoad: cockpitLoad, load: loadState,
                stateIndex: stateIndex, greeting: greeting,
                onPropose: proposeOpen, onChip: onChip, onAgendaMore: onAgendaMore,
                approvalsFlash: approvalsFlash, approvalsRef: approvalsRef,
                onFirma: onFirma, onApprovals: onApprovals,
              })))
        : scene === "firma"
        ? h("div", { className: "mos__stagewrap mos__stagewrap--scene" },
            h("div", { className: "mos__scenehead" },
              h(Icon, { name: "server", size: 20 }),
              h("div", { className: "mos__scenehead-t" },
                h("h2", null, "Firma / Rise-L"),
                h("span", null, "Read-only Projektion · fsm.db/belege.db mode=ro · Paperless nur lesen · Deep-Links ins FSM")),
              h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen")),
            h(FirmaScene, { firma: firma, load: firmaLoad }),
            h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false })))
        : scene === "approvals"
        ? h("div", { className: "mos__stagewrap mos__stagewrap--scene" },
            h("div", { className: "mos__scenehead" },
              h(Icon, { name: "shield-check", size: 20 }),
              h("div", { className: "mos__scenehead-t" },
                h("h2", null, "Entscheidungen"),
                h("span", null, "Approval-Cards inkl. Intent-Hash + Effekt-Felder · Entscheidung nur durch dich (Operator)")),
              h("span", { className: "mos__scenehead-ro" }, h(Icon, { name: "lock", size: 12 }), "Operator-only")),
            h(ApprovalsScene, { approvals: cockpit.approvals, load: cockpitLoad,
              details: approvalDetails, detailLoading: approvalDetailLoading, onLoadDetail: loadApprovalDetail }),
            h("div", { className: "mos__scene-orb", "aria-hidden": "true" }, h(Orb, { label: false })))
        : scene === "timeline"
        ? h("div", { className: "mos__stagewrap mos__stagewrap--tl" },
            h(TimelineScene, { byId: enrichedById, focusId: focusId, onActivate: activate, onClose: closeFocus }))
        : h(
        "div",
        { className: "mos__stagewrap" },
        h(WorkspaceSwitcher, { active: workspace, onChange: setWorkspace }),
        h(
          "div",
          { className: "mos__stage", ref: stageRef },
          // spatial depth field — cheap radial light-fields + a few drifting
          // energy motes (transform/opacity only, GPU-friendly, static under
          // reduced motion). Purely decorative, sits behind the connectors.
          h(
            "div",
            { className: "mos__depth", "aria-hidden": "true" },
            h("span", { className: "mos__depth-field mos__depth-field--a" }),
            h("span", { className: "mos__depth-field mos__depth-field--b" }),
            h("span", { className: "mos__motes" },
              Array.from({ length: 14 }).map((_, i) =>
                h("span", { key: i, className: "mos__mote mos__mote--" + (i % 7) }))),
          ),
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
            h("span", { className: "mos__core-aura", "aria-hidden": "true" }),
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
              h(Orb, { label: true }),
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
              onPropose: () => proposeOpen(command),
              onReview: reviewOpen,
              onCoach: coachOpen,
            }),
          ),
          // add-module affordance (bottom-left of stage)
          h(
            "button",
            { type: "button", className: "mos__addmodule", title: NOT_WIRED },
            h("span", { className: "mos__addmodule-plus" }, h(Icon, { name: "circle-plus", size: 18 })),
            "Modul hinzufügen",
          ),
        ),
      ),
      // Footer (UI-SPEC §1): in the Cockpit the StateRail sits directly ABOVE the
      // command bar; Konstellation/Timeline keep the command bar → footer order.
      (scene === "cockpit" || isBackScene)
        ? h("footer", { className: "mos__ckpt-foot" },
            h(StateRail, { activeIndex: stateIndex }),
            commandForm)
        : h(React.Fragment, null, commandForm, constFooter),
    ),
    h(ProposeFlow, {
      state: propose, onObjective: proposeObjective, onPreview: proposePreview,
      onSend: proposeSend, onPoll: proposePoll, onClose: proposeClose,
    }),
    h(ReviewSurface, {
      state: review, onFlip: reviewFlip, onRate: reviewRate,
      onRestart: reviewRestart, onClose: reviewClose,
    }),
    h(CoachSurface, {
      state: coach, onTab: coachTab, onExplain: coachExplain,
      onEvaluate: coachEvaluate, onNextConcept: coachNextConcept,
      onPropose: coachPropose, onClose: coachClose,
    }),
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
