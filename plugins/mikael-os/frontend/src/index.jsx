/**
 * MIKAEL OS — Personal OS dashboard-plugin surface (Phase 0 shell).
 * ================================================================
 *
 * A dedicated full-screen personal operating surface for Mikael, delivered as a
 * Nous Hermes *dashboard plugin* (not inside FSM, not a second task database).
 *
 * Phase 0 goal (per the V3 build handoff): prove a dashboard-plugin route can
 * render a full-screen private "Command Constellation" surface without modifying
 * FSM or the host. All values here are CONCEPT DATA / fixtures — explicitly
 * badged in the UI and never presented as live truth. Real read models
 * (mission.v2 / job_projection / task_priority_preview, WHOOP, calendar, Rise-L,
 * company signals) arrive in Phase 2.
 *
 * Contract with the host (see web/src/plugins/registry.ts::exposePluginSDK and
 * usePlugins.ts): the host injects this bundle as a <script>, having first set
 * window.__HERMES_PLUGIN_SDK__ (React, hooks, UI primitives, auth'd fetch) and
 * window.__HERMES_PLUGINS__ (register). We pull React off the SDK — nothing is
 * bundled — and register the root component under the manifest name "mikael-os".
 * This is the exact pattern the checked-in kanban / hermes-achievements bundles
 * use; this file is compiled to that same IIFE shape by Vite (see vite.config.js).
 *
 * WebGL orb + photographic atmosphere are Phase-1 concerns. Here the Jarvis orb
 * and depth are CSS/SVG placeholders and marked aria-hidden (decorative only).
 */

import { ICONS } from "./icons.js";
import "./styles.css";

const SDK = typeof window !== "undefined" ? window.__HERMES_PLUGIN_SDK__ : undefined;
const React = SDK && SDK.React;
const { useState } = (SDK && SDK.hooks) || {};

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
  return React.createElement("span", {
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
// contract (id/workspace/title/icon/accent/summary) so Phase 2 can swap fixtures
// for typed read-model projections without touching the renderer.
// ---------------------------------------------------------------------------
const LEFT_MODULES = [
  { id: "today", title: "Heute", icon: "sun", accent: "cyan", meta: "9 Ereignisse" },
  { id: "calendar", title: "Kalender", icon: "calendar-days", accent: "cyan", meta: "Nächster · 10:30" },
  { id: "body", title: "Körper / WHOOP", icon: "heart-pulse", accent: "emerald", meta: "Recovery 82% · Stand 06:12" },
  { id: "journal", title: "Journal", icon: "notebook-pen", accent: "cyan", meta: "1 Eintrag heute" },
];

const RIGHT_MODULES = [
  { id: "tasks", title: "Aufgaben & Ziele", icon: "target", accent: "emerald", meta: "7 aktiv · 3 heute" },
  { id: "learning", title: "Lernplan", icon: "graduation-cap", accent: "violet", meta: "3 Lektionen fällig" },
  { id: "risel", title: "Rise-L Prozesse", icon: "server", accent: "amber", meta: "5 Workflows aktiv" },
  { id: "travel", title: "Reisen", icon: "plane", accent: "cyan", meta: "Rom · 18. Jun" },
  { id: "nutrition", title: "Ernährung", icon: "leaf", accent: "emerald", meta: "Heute · 2.105 kcal" },
  { id: "company", title: "Firma-Signale", icon: "building-2", accent: "neutral", meta: "Approval-Cards", readOnly: true },
];

const MISSIONS = [
  { icon: "rocket", accent: "emerald", title: "Feature: KI Fokus-Modus", sub: "Sprint 42 · Frontend", status: "running", statusLabel: "Läuft", pct: "68 %" },
  { icon: "lock", accent: "amber", title: "API: Permissions Service", sub: "Backend · Sicherheit", status: "waiting", statusLabel: "Wartet auf Review", pct: "—" },
  { icon: "circle-check-big", accent: "cyan", title: "Refactor: Workspace Core", sub: "Architektur", status: "verified", statusLabel: "Verifiziert", pct: "100 %" },
  { icon: "flask-round", accent: "emerald", title: "Test Suite: E2E Stabilität", sub: "Qualitätssicherung", status: "running", statusLabel: "Läuft", pct: "24 %" },
];

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

const STATES = [
  { icon: "circle", label: "Bereit", tone: "ready", active: true },
  { icon: "ear", label: "Hört zu", tone: "ready" },
  { icon: "brain", label: "Denkt", tone: "ready" },
  { icon: "lightbulb", label: "Vorschlag", tone: "ready" },
  { icon: "zap", label: "Ausführung", tone: "ready" },
  { icon: "circle-check-big", label: "Verifiziert", tone: "verified" },
];

const WORKSPACES = [
  { id: "private", label: "Privat" },
  { id: "engineering", label: "Engineering" },
  { id: "company_signal", label: "Firma-Signale" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ModuleNode(props) {
  const m = props.module;
  return React.createElement(
    "button",
    { type: "button", className: "mos__node mos--" + m.accent, "aria-current": props.active ? "true" : undefined },
    React.createElement("span", { className: "mos__node-orbit" }, React.createElement(Icon, { name: m.icon, size: 22 })),
    React.createElement(
      "span",
      { className: "mos__node-body" },
      React.createElement("span", { className: "mos__node-title" }, m.title),
      React.createElement("span", { className: "mos__node-meta" }, m.meta),
      m.readOnly &&
        React.createElement(
          "span",
          { className: "mos__node-readonly" },
          React.createElement(Icon, { name: "lock", size: 13 }),
          "Nur lesen",
        ),
    ),
  );
}

function Mission(props) {
  const mi = props.mission;
  return React.createElement(
    "div",
    { className: "mos__mission mos--" + mi.accent },
    React.createElement("span", { className: "mos__mission-idx" }, String(props.index)),
    React.createElement("span", { className: "mos__mission-icon" }, React.createElement(Icon, { name: mi.icon, size: 18 })),
    React.createElement(
      "span",
      { className: "mos__mission-body" },
      React.createElement("span", { className: "mos__mission-title" }, mi.title),
      React.createElement("span", { className: "mos__mission-sub" }, mi.sub),
    ),
    React.createElement(
      "span",
      { className: "mos__status mos__status--" + mi.status },
      mi.status === "verified" && React.createElement(Icon, { name: "circle-check-big", size: 13 }),
      mi.status === "waiting" && React.createElement(Icon, { name: "clock", size: 13 }),
      mi.statusLabel,
    ),
    React.createElement("span", { className: "mos__mission-pct" }, mi.pct),
  );
}

function FocusLens() {
  return React.createElement(
    "section",
    { className: "mos__lens", "aria-label": "Fokus-Linse: Engineering / Codex" },
    React.createElement(
      "header",
      { className: "mos__lens-head" },
      React.createElement("span", { className: "mos__lens-badge" }, React.createElement(Icon, { name: "code-xml", size: 22 })),
      React.createElement(
        "span",
        { className: "mos__lens-titles" },
        React.createElement("span", { className: "mos__lens-title" }, "Engineering / Codex"),
        React.createElement("span", { className: "mos__lens-sub" }, "Fokus-Linse · 4 Missionen"),
      ),
      React.createElement(
        "span",
        { className: "mos__lens-actions" },
        React.createElement("button", { type: "button", className: "mos__iconbtn", "aria-label": "Anheften" }, React.createElement(Icon, { name: "pin", size: 18 })),
        React.createElement("button", { type: "button", className: "mos__iconbtn", "aria-label": "Einklappen" }, React.createElement(Icon, { name: "chevron-up", size: 18 })),
        React.createElement("button", { type: "button", className: "mos__iconbtn", "aria-label": "Weitere Optionen" }, React.createElement(Icon, { name: "ellipsis", size: 18 })),
      ),
    ),
    React.createElement(
      "div",
      { className: "mos__lens-body" },
      MISSIONS.map((mi, i) => React.createElement(Mission, { key: mi.title, mission: mi, index: i + 1 })),
    ),
    React.createElement(
      "footer",
      { className: "mos__lens-foot" },
      React.createElement("span", { className: "mos__meta" }, React.createElement(Icon, { name: "git-branch", size: 14 }), "Quelle: ", React.createElement("b", null, "GitHub")),
      React.createElement("span", { className: "mos__meta" }, React.createElement(Icon, { name: "clock", size: 14 }), "Aktualität: ", React.createElement("b", null, "vor 7 Min")),
      React.createElement("span", { className: "mos__meta" }, React.createElement(Icon, { name: "shield-check", size: 14 }), "Berechtigung: ", React.createElement("b", null, "Lesen & Schreiben")),
      React.createElement("span", { className: "mos__lens-foot-shield" }, React.createElement(Icon, { name: "shield-check", size: 18, label: "Berechtigungen geprüft" })),
    ),
    React.createElement(
      "div",
      { className: "mos__lens-tools" },
      LENS_TOOLS.map((t) =>
        React.createElement("button", { key: t.label, type: "button", className: "mos__tool" }, React.createElement(Icon, { name: t.icon, size: 15 }), t.label),
      ),
    ),
  );
}

function TopBar() {
  return React.createElement(
    "header",
    { className: "mos__topbar" },
    React.createElement(
      "div",
      { className: "mos__identity" },
      React.createElement("span", { className: "mos__avatar", "aria-hidden": "true" }, "M"),
      React.createElement(
        "span",
        null,
        React.createElement("span", { className: "mos__identity-name", style: { display: "block" } }, "Mikael"),
        React.createElement("span", { className: "mos__identity-sub" }, "Privates System"),
      ),
    ),
    React.createElement("div", { className: "mos__wordmark" }, "MIKAEL OS"),
    React.createElement(
      "div",
      { className: "mos__topright" },
      React.createElement(
        "span",
        { className: "mos__concept", title: "Alle angezeigten Werte sind Konzeptdaten (Phase 0). Keine Live-Wahrheit." },
        React.createElement(Icon, { name: "flask-conical", size: 14 }),
        "Konzeptdaten",
      ),
      React.createElement(
        "span",
        { className: "mos__topchip" },
        React.createElement(Icon, { name: "cloud-moon", size: 16 }),
        React.createElement("strong", null, "22°"),
        " Klar",
      ),
      React.createElement(
        "span",
        { className: "mos__topchip mos__topchip-time" },
        React.createElement("span", null, React.createElement("b", null, "22:30"), "Do, 22. Mai · Berliner Zeit"),
      ),
      React.createElement("button", { type: "button", className: "mos__shieldbtn", "aria-label": "Privatsphäre & Berechtigungen" }, React.createElement(Icon, { name: "shield-check", size: 20 })),
    ),
  );
}

function WorkspaceSwitcher(props) {
  return React.createElement(
    "div",
    { className: "mos__workspace", role: "group", "aria-label": "Workspace wechseln" },
    React.createElement("span", { className: "mos__workspace-label" }, "Workspace"),
    WORKSPACES.map((w) =>
      React.createElement(
        "button",
        {
          key: w.id,
          type: "button",
          className: "mos__ws-tab",
          "aria-pressed": props.active === w.id ? "true" : "false",
          onClick: () => props.onChange(w.id),
        },
        w.label,
      ),
    ),
  );
}

function StateRail() {
  return React.createElement(
    "div",
    { className: "mos__states", role: "list", "aria-label": "Jarvis-Zustand" },
    STATES.map((s) =>
      React.createElement(
        "span",
        { key: s.label, className: "mos__state", role: "listitem", "data-active": s.active ? "true" : "false", "data-tone": s.tone },
        React.createElement("span", { className: "mos__state-dot", "aria-hidden": "true" }),
        s.label,
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
function MikaelOS() {
  const [workspace, setWorkspace] = useState("private");

  return React.createElement(
    "div",
    { className: "mos" },
    React.createElement("div", { className: "mos__atmosphere", "aria-hidden": "true" }),
    React.createElement(
      "div",
      { className: "mos__shell" },
      React.createElement(TopBar, null),
      React.createElement(WorkspaceSwitcher, { active: workspace, onChange: setWorkspace }),
      React.createElement(
        "div",
        { className: "mos__stage" },
        React.createElement(
          "nav",
          { className: "mos__rail mos__rail--left", "aria-label": "Module (links)" },
          LEFT_MODULES.map((m) => React.createElement(ModuleNode, { key: m.id, module: m })),
        ),
        React.createElement(
          "div",
          { className: "mos__center" },
          React.createElement(
            "div",
            { className: "mos__core-row" },
            React.createElement(
              "span",
              { className: "mos__handoff" },
              React.createElement("span", null, "Übergabe von"),
              React.createElement(Icon, { name: "orbit", size: 16 }),
              React.createElement("b", null, "Jarvis"),
            ),
            React.createElement(
              "div",
              { className: "mos__orb", "aria-hidden": "true" },
              React.createElement("span", { className: "mos__orb-label" }, "JARVIS"),
            ),
            React.createElement(
              "span",
              { className: "mos__handoff" },
              React.createElement("span", null, "Übergabe an"),
              React.createElement(Icon, { name: "git-branch", size: 16 }),
              React.createElement("b", null, "Codex / Claude"),
            ),
          ),
          React.createElement(FocusLens, null),
          React.createElement(
            "button",
            { type: "button", className: "mos__addmodule" },
            React.createElement("span", { className: "mos__addmodule-plus" }, React.createElement(Icon, { name: "circle-plus", size: 18 })),
            "Modul hinzufügen",
          ),
        ),
        React.createElement(
          "nav",
          { className: "mos__rail mos__rail--right", "aria-label": "Module (rechts)" },
          RIGHT_MODULES.map((m) => React.createElement(ModuleNode, { key: m.id, module: m })),
        ),
      ),
      React.createElement(
        "div",
        { className: "mos__command" },
        React.createElement(
          "div",
          { className: "mos__command-bar" },
          React.createElement("button", { type: "button", className: "mos__mic", "aria-label": "Sprachbefehl starten" }, React.createElement(Icon, { name: "mic", size: 22 })),
          React.createElement("input", {
            className: "mos__command-input",
            type: "text",
            "aria-label": "Befehl eingeben",
            placeholder: 'Sage „Jarvis“ oder schreibe einen Befehl …',
          }),
          React.createElement("button", { type: "button", className: "mos__send", "aria-label": "Senden" }, React.createElement(Icon, { name: "send-horizontal", size: 18 })),
        ),
        React.createElement(
          "div",
          { className: "mos__chips" },
          CHIPS.map((c) =>
            React.createElement("button", { key: c.label, type: "button", className: "mos__chip" }, React.createElement(Icon, { name: c.icon, size: 14 }), c.label),
          ),
        ),
      ),
      React.createElement(
        "footer",
        { className: "mos__footer" },
        React.createElement("button", { type: "button", className: "mos__quick" }, React.createElement(Icon, { name: "layout-grid", size: 16 }), "Schnellzugriffe", React.createElement(Icon, { name: "chevron-up", size: 14 })),
        React.createElement(StateRail, null),
        React.createElement(
          "span",
          { className: "mos__reorder" },
          React.createElement(Icon, { name: "grip-vertical", size: 14 }),
          "Ziehen um neu zu ordnen",
          React.createElement("span", { className: "mos__kbd" }, React.createElement(Icon, { name: "command", size: 12 }), "K · Kurzbefehle"),
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
