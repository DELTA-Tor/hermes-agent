var MikaelOSPlugin = function() {
  "use strict";
  const ICONS = {
    "sparkles": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /> <path d="M20 3v4" /> <path d="M22 5h-4" /> <path d="M4 17v2" /> <path d="M5 18H3" />',
    "orbit": '<circle cx="12" cy="12" r="3" /> <circle cx="19" cy="5" r="2" /> <circle cx="5" cy="19" r="2" /> <path d="M10.4 21.9a10 10 0 0 0 9.941-15.416" /> <path d="M13.5 2.1a10 10 0 0 0-9.841 15.416" />',
    "sun": '<circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" />',
    "calendar-days": '<path d="M8 2v4" /> <path d="M16 2v4" /> <rect width="18" height="18" x="3" y="4" rx="2" /> <path d="M3 10h18" /> <path d="M8 14h.01" /> <path d="M12 14h.01" /> <path d="M16 14h.01" /> <path d="M8 18h.01" /> <path d="M12 18h.01" /> <path d="M16 18h.01" />',
    "circle-check-big": '<path d="M21.801 10A10 10 0 1 1 17 3.335" /> <path d="m9 11 3 3L22 4" />',
    "target": '<circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" />',
    "code-xml": '<path d="m18 16 4-4-4-4" /> <path d="m6 8-4 4 4 4" /> <path d="m14.5 4-5 16" />',
    "server": '<rect width="20" height="8" x="2" y="2" rx="2" ry="2" /> <rect width="20" height="8" x="2" y="14" rx="2" ry="2" /> <line x1="6" x2="6.01" y1="6" y2="6" /> <line x1="6" x2="6.01" y1="18" y2="18" />',
    "notebook-pen": '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" /> <path d="M2 6h4" /> <path d="M2 10h4" /> <path d="M2 14h4" /> <path d="M2 18h4" /> <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />',
    "radio-tower": '<path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9" /> <path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" /> <circle cx="12" cy="9" r="2" /> <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47" /> <path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1" /> <path d="M9.5 18h5" /> <path d="m8 22 4-11 4 11" />',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    "mic": '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /> <path d="M19 10v2a7 7 0 0 1-14 0v-2" /> <line x1="12" x2="12" y1="19" y2="22" />',
    "circle-plus": '<circle cx="12" cy="12" r="10" /> <path d="M8 12h8" /> <path d="M12 8v8" />',
    "grip-vertical": '<circle cx="9" cy="12" r="1" /> <circle cx="9" cy="5" r="1" /> <circle cx="9" cy="19" r="1" /> <circle cx="15" cy="12" r="1" /> <circle cx="15" cy="5" r="1" /> <circle cx="15" cy="19" r="1" />',
    "clock": '<circle cx="12" cy="12" r="10" /> <polyline points="12 6 12 12 16 14" />',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /> <circle cx="12" cy="7" r="4" />',
    "chevron-down": '<path d="m6 9 6 6 6-6" />',
    "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" />',
    "flask-conical": '<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" /> <path d="M6.453 15h11.094" /> <path d="M8.5 2h7" />',
    "cloud-moon": '<path d="M10.188 8.5A6 6 0 0 1 16 4a1 1 0 0 0 6 6 6 6 0 0 1-3 5.197" /> <path d="M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z" />',
    "plane": '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />',
    "leaf": '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /> <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />',
    "heart-pulse": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /> <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />',
    "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /> <path d="M22 10v6" /> <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />',
    "book-open": '<path d="M12 7v14" /> <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />',
    "settings": '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /> <circle cx="12" cy="12" r="3" />',
    "brain": '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /> <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /> <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /> <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /> <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /> <path d="M3.477 10.896a4 4 0 0 1 .585-.396" /> <path d="M19.938 10.5a4 4 0 0 1 .585.396" /> <path d="M6 18a4 4 0 0 1-1.967-.516" /> <path d="M19.967 17.484A4 4 0 0 1 18 18" />',
    "lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /> <path d="M9 18h6" /> <path d="M10 22h4" />',
    "zap": '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />',
    "ear": '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" /> <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />',
    "circle": '<circle cx="12" cy="12" r="10" />',
    "send-horizontal": '<path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" /> <path d="M6 12h16" />',
    "command": '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />',
    "pin": '<path d="M12 17v5" /> <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />',
    "chevron-up": '<path d="m18 15-6-6-6 6" />',
    "ellipsis": '<circle cx="12" cy="12" r="1" /> <circle cx="19" cy="12" r="1" /> <circle cx="5" cy="12" r="1" />',
    "git-branch": '<line x1="6" x2="6" y1="3" y2="15" /> <circle cx="18" cy="6" r="3" /> <circle cx="6" cy="18" r="3" /> <path d="M18 9a9 9 0 0 1-9 9" />',
    "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />',
    "share-2": '<circle cx="18" cy="5" r="3" /> <circle cx="6" cy="12" r="3" /> <circle cx="18" cy="19" r="3" /> <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /> <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />',
    "panels-top-left": '<rect width="18" height="18" x="3" y="3" rx="2" /> <path d="M3 9h18" /> <path d="M9 21V9" />',
    "building-2": '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /> <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /> <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /> <path d="M10 6h4" /> <path d="M10 10h4" /> <path d="M10 14h4" /> <path d="M10 18h4" />',
    "wifi": '<path d="M12 20h.01" /> <path d="M2 8.82a15 15 0 0 1 20 0" /> <path d="M5 12.859a10 10 0 0 1 14 0" /> <path d="M8.5 16.429a5 5 0 0 1 7 0" />',
    "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1" /> <rect width="7" height="7" x="14" y="3" rx="1" /> <rect width="7" height="7" x="14" y="14" rx="1" /> <rect width="7" height="7" x="3" y="14" rx="1" />',
    "rocket": '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /> <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /> <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /> <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />',
    "flask-round": '<path d="M10 2v6.292a7 7 0 1 0 4 0V2" /> <path d="M5 15h14" /> <path d="M8.5 2h7" />',
    "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />'
  };
  const SDK = typeof window !== "undefined" ? window.__HERMES_PLUGIN_SDK__ : void 0;
  const React = SDK && SDK.React;
  const { useState } = SDK && SDK.hooks || {};
  function Icon(props) {
    const { name, size = 20, className = "", label } = props;
    const inner = ICONS[name] || ICONS.circle;
    const decorative = !label;
    return React.createElement("span", {
      className: "mos__icon " + className,
      style: { width: size, height: size },
      role: decorative ? void 0 : "img",
      "aria-label": decorative ? void 0 : label,
      "aria-hidden": decorative ? "true" : void 0,
      dangerouslySetInnerHTML: {
        __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>"
      }
    });
  }
  const LEFT_MODULES = [
    { id: "today", title: "Heute", icon: "sun", accent: "cyan", meta: "9 Ereignisse" },
    { id: "calendar", title: "Kalender", icon: "calendar-days", accent: "cyan", meta: "Nächster · 10:30" },
    { id: "body", title: "Körper / WHOOP", icon: "heart-pulse", accent: "emerald", meta: "Recovery 82% · Stand 06:12" },
    { id: "journal", title: "Journal", icon: "notebook-pen", accent: "cyan", meta: "1 Eintrag heute" }
  ];
  const RIGHT_MODULES = [
    { id: "tasks", title: "Aufgaben & Ziele", icon: "target", accent: "emerald", meta: "7 aktiv · 3 heute" },
    { id: "learning", title: "Lernplan", icon: "graduation-cap", accent: "violet", meta: "3 Lektionen fällig" },
    { id: "risel", title: "Rise-L Prozesse", icon: "server", accent: "amber", meta: "5 Workflows aktiv" },
    { id: "travel", title: "Reisen", icon: "plane", accent: "cyan", meta: "Rom · 18. Jun" },
    { id: "nutrition", title: "Ernährung", icon: "leaf", accent: "emerald", meta: "Heute · 2.105 kcal" },
    { id: "company", title: "Firma-Signale", icon: "building-2", accent: "neutral", meta: "Approval-Cards", readOnly: true }
  ];
  const MISSIONS = [
    { icon: "rocket", accent: "emerald", title: "Feature: KI Fokus-Modus", sub: "Sprint 42 · Frontend", status: "running", statusLabel: "Läuft", pct: "68 %" },
    { icon: "lock", accent: "amber", title: "API: Permissions Service", sub: "Backend · Sicherheit", status: "waiting", statusLabel: "Wartet auf Review", pct: "—" },
    { icon: "circle-check-big", accent: "cyan", title: "Refactor: Workspace Core", sub: "Architektur", status: "verified", statusLabel: "Verifiziert", pct: "100 %" },
    { icon: "flask-round", accent: "emerald", title: "Test Suite: E2E Stabilität", sub: "Qualitätssicherung", status: "running", statusLabel: "Läuft", pct: "24 %" }
  ];
  const LENS_TOOLS = [
    { icon: "folder-open", label: "Öffnen" },
    { icon: "panels-top-left", label: "Details" },
    { icon: "message-square", label: "Kommentare" },
    { icon: "share-2", label: "Handover" },
    { icon: "ellipsis", label: "Mehr" }
  ];
  const CHIPS = [
    { icon: "sparkles", label: "Beispiele" },
    { icon: "target", label: "Öffne Fokus-Modus" },
    { icon: "clock", label: "Plane Deep Work um 09:00" },
    { icon: "graduation-cap", label: "Zeige meinen Lernplan" }
  ];
  const STATES = [
    { icon: "circle", label: "Bereit", tone: "ready", active: true },
    { icon: "ear", label: "Hört zu", tone: "ready" },
    { icon: "brain", label: "Denkt", tone: "ready" },
    { icon: "lightbulb", label: "Vorschlag", tone: "ready" },
    { icon: "zap", label: "Ausführung", tone: "ready" },
    { icon: "circle-check-big", label: "Verifiziert", tone: "verified" }
  ];
  const WORKSPACES = [
    { id: "private", label: "Privat" },
    { id: "engineering", label: "Engineering" },
    { id: "company_signal", label: "Firma-Signale" }
  ];
  function ModuleNode(props) {
    const m = props.module;
    return React.createElement(
      "button",
      { type: "button", className: "mos__node mos--" + m.accent, "aria-current": props.active ? "true" : void 0 },
      React.createElement("span", { className: "mos__node-orbit" }, React.createElement(Icon, { name: m.icon, size: 22 })),
      React.createElement(
        "span",
        { className: "mos__node-body" },
        React.createElement("span", { className: "mos__node-title" }, m.title),
        React.createElement("span", { className: "mos__node-meta" }, m.meta),
        m.readOnly && React.createElement(
          "span",
          { className: "mos__node-readonly" },
          React.createElement(Icon, { name: "lock", size: 13 }),
          "Nur lesen"
        )
      )
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
        React.createElement("span", { className: "mos__mission-sub" }, mi.sub)
      ),
      React.createElement(
        "span",
        { className: "mos__status mos__status--" + mi.status },
        mi.status === "verified" && React.createElement(Icon, { name: "circle-check-big", size: 13 }),
        mi.status === "waiting" && React.createElement(Icon, { name: "clock", size: 13 }),
        mi.statusLabel
      ),
      React.createElement("span", { className: "mos__mission-pct" }, mi.pct)
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
          React.createElement("span", { className: "mos__lens-sub" }, "Fokus-Linse · 4 Missionen")
        ),
        React.createElement(
          "span",
          { className: "mos__lens-actions" },
          React.createElement("button", { type: "button", className: "mos__iconbtn", "aria-label": "Anheften" }, React.createElement(Icon, { name: "pin", size: 18 })),
          React.createElement("button", { type: "button", className: "mos__iconbtn", "aria-label": "Einklappen" }, React.createElement(Icon, { name: "chevron-up", size: 18 })),
          React.createElement("button", { type: "button", className: "mos__iconbtn", "aria-label": "Weitere Optionen" }, React.createElement(Icon, { name: "ellipsis", size: 18 }))
        )
      ),
      React.createElement(
        "div",
        { className: "mos__lens-body" },
        MISSIONS.map((mi, i) => React.createElement(Mission, { key: mi.title, mission: mi, index: i + 1 }))
      ),
      React.createElement(
        "footer",
        { className: "mos__lens-foot" },
        React.createElement("span", { className: "mos__meta" }, React.createElement(Icon, { name: "git-branch", size: 14 }), "Quelle: ", React.createElement("b", null, "GitHub")),
        React.createElement("span", { className: "mos__meta" }, React.createElement(Icon, { name: "clock", size: 14 }), "Aktualität: ", React.createElement("b", null, "vor 7 Min")),
        React.createElement("span", { className: "mos__meta" }, React.createElement(Icon, { name: "shield-check", size: 14 }), "Berechtigung: ", React.createElement("b", null, "Lesen & Schreiben")),
        React.createElement("span", { className: "mos__lens-foot-shield" }, React.createElement(Icon, { name: "shield-check", size: 18, label: "Berechtigungen geprüft" }))
      ),
      React.createElement(
        "div",
        { className: "mos__lens-tools" },
        LENS_TOOLS.map(
          (t) => React.createElement("button", { key: t.label, type: "button", className: "mos__tool" }, React.createElement(Icon, { name: t.icon, size: 15 }), t.label)
        )
      )
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
          React.createElement("span", { className: "mos__identity-sub" }, "Privates System")
        )
      ),
      React.createElement("div", { className: "mos__wordmark" }, "MIKAEL OS"),
      React.createElement(
        "div",
        { className: "mos__topright" },
        React.createElement(
          "span",
          { className: "mos__concept", title: "Alle angezeigten Werte sind Konzeptdaten (Phase 0). Keine Live-Wahrheit." },
          React.createElement(Icon, { name: "flask-conical", size: 14 }),
          "Konzeptdaten"
        ),
        React.createElement(
          "span",
          { className: "mos__topchip" },
          React.createElement(Icon, { name: "cloud-moon", size: 16 }),
          React.createElement("strong", null, "22°"),
          " Klar"
        ),
        React.createElement(
          "span",
          { className: "mos__topchip mos__topchip-time" },
          React.createElement("span", null, React.createElement("b", null, "22:30"), "Do, 22. Mai · Berliner Zeit")
        ),
        React.createElement("button", { type: "button", className: "mos__shieldbtn", "aria-label": "Privatsphäre & Berechtigungen" }, React.createElement(Icon, { name: "shield-check", size: 20 }))
      )
    );
  }
  function WorkspaceSwitcher(props) {
    return React.createElement(
      "div",
      { className: "mos__workspace", role: "group", "aria-label": "Workspace wechseln" },
      React.createElement("span", { className: "mos__workspace-label" }, "Workspace"),
      WORKSPACES.map(
        (w) => React.createElement(
          "button",
          {
            key: w.id,
            type: "button",
            className: "mos__ws-tab",
            "aria-pressed": props.active === w.id ? "true" : "false",
            onClick: () => props.onChange(w.id)
          },
          w.label
        )
      )
    );
  }
  function StateRail() {
    return React.createElement(
      "div",
      { className: "mos__states", role: "list", "aria-label": "Jarvis-Zustand" },
      STATES.map(
        (s) => React.createElement(
          "span",
          { key: s.label, className: "mos__state", role: "listitem", "data-active": s.active ? "true" : "false", "data-tone": s.tone },
          React.createElement("span", { className: "mos__state-dot", "aria-hidden": "true" }),
          s.label
        )
      )
    );
  }
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
            LEFT_MODULES.map((m) => React.createElement(ModuleNode, { key: m.id, module: m }))
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
                React.createElement("b", null, "Jarvis")
              ),
              React.createElement(
                "div",
                { className: "mos__orb", "aria-hidden": "true" },
                React.createElement("span", { className: "mos__orb-label" }, "JARVIS")
              ),
              React.createElement(
                "span",
                { className: "mos__handoff" },
                React.createElement("span", null, "Übergabe an"),
                React.createElement(Icon, { name: "git-branch", size: 16 }),
                React.createElement("b", null, "Codex / Claude")
              )
            ),
            React.createElement(FocusLens, null),
            React.createElement(
              "button",
              { type: "button", className: "mos__addmodule" },
              React.createElement("span", { className: "mos__addmodule-plus" }, React.createElement(Icon, { name: "circle-plus", size: 18 })),
              "Modul hinzufügen"
            )
          ),
          React.createElement(
            "nav",
            { className: "mos__rail mos__rail--right", "aria-label": "Module (rechts)" },
            RIGHT_MODULES.map((m) => React.createElement(ModuleNode, { key: m.id, module: m }))
          )
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
              placeholder: "Sage „Jarvis“ oder schreibe einen Befehl …"
            }),
            React.createElement("button", { type: "button", className: "mos__send", "aria-label": "Senden" }, React.createElement(Icon, { name: "send-horizontal", size: 18 }))
          ),
          React.createElement(
            "div",
            { className: "mos__chips" },
            CHIPS.map(
              (c) => React.createElement("button", { key: c.label, type: "button", className: "mos__chip" }, React.createElement(Icon, { name: c.icon, size: 14 }), c.label)
            )
          )
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
            React.createElement("span", { className: "mos__kbd" }, React.createElement(Icon, { name: "command", size: 12 }), "K · Kurzbefehle")
          )
        )
      )
    );
  }
  if (SDK && React && typeof window !== "undefined" && window.__HERMES_PLUGINS__ && typeof window.__HERMES_PLUGINS__.register === "function") {
    window.__HERMES_PLUGINS__.register("mikael-os", MikaelOS);
  }
  return MikaelOS;
}();
