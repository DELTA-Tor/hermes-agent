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
    "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />',
    "x": '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
    "chevron-right": '<path d="m9 18 6-6-6-6" />',
    "arrow-right": '<path d="M5 12h14" /> <path d="m12 5 7 7-7 7" />',
    "activity": '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />',
    "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />',
    "map": '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /> <path d="M15 5.764v15" /> <path d="M9 3.236v15" />',
    "utensils": '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /> <path d="M7 2v20" /> <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />',
    "keyboard": '<path d="M10 8h.01" /> <path d="M12 12h.01" /> <path d="M14 8h.01" /> <path d="M16 12h.01" /> <path d="M18 8h.01" /> <path d="M6 8h.01" /> <path d="M7 16h10" /> <path d="M8 12h.01" /> <rect width="20" height="16" x="2" y="4" rx="2" />',
    "audio-lines": '<path d="M2 10v3" /> <path d="M6 6v11" /> <path d="M10 3v18" /> <path d="M14 8v7" /> <path d="M18 5v13" /> <path d="M22 10v3" />'
  };
  const SDK = typeof window !== "undefined" ? window.__HERMES_PLUGIN_SDK__ : void 0;
  const React = SDK && SDK.React;
  const H = SDK && SDK.hooks || {};
  const useState = H.useState || (() => [void 0, () => {
  }]);
  const useEffect = H.useEffect || (() => {
  });
  const useRef = H.useRef || (() => ({ current: null }));
  const useCallback = H.useCallback || ((fn) => fn);
  H.useMemo || ((fn) => typeof fn === "function" ? fn() : fn);
  const h = React ? React.createElement : () => null;
  function Icon(props) {
    const { name, size = 20, className = "", label } = props;
    const inner = ICONS[name] || ICONS.circle;
    const decorative = !label;
    return h("span", {
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
    { id: "journal", title: "Journal", icon: "notebook-pen", accent: "cyan", meta: "1 Eintrag heute", pos: { x: 13, y: 68 } }
  ];
  const LENS = {
    engineering: {
      icon: "code-xml",
      accent: "cyan",
      title: "Engineering / Codex",
      sub: "Fokus-Linse · 4 Missionen",
      source: "GitHub",
      freshness: "vor 7 Min",
      permission: "Lesen & Schreiben",
      rows: [
        { icon: "rocket", accent: "emerald", title: "Feature: KI Fokus-Modus", sub: "Sprint 42 · Frontend", status: "running", statusLabel: "Läuft", value: "68 %" },
        { icon: "lock", accent: "amber", title: "API: Permissions Service", sub: "Backend · Sicherheit", status: "waiting", statusLabel: "Wartet auf Review", value: "—" },
        { icon: "circle-check-big", accent: "cyan", title: "Refactor: Workspace Core", sub: "Architektur", status: "verified", statusLabel: "Verifiziert", value: "100 %" },
        { icon: "flask-round", accent: "emerald", title: "Test Suite: E2E Stabilität", sub: "Qualitätssicherung", status: "running", statusLabel: "Läuft", value: "24 %" }
      ]
    },
    today: {
      icon: "sun",
      accent: "cyan",
      title: "Heute",
      sub: "Tagesplan · 9 Ereignisse",
      source: "Kalender",
      freshness: "vor 2 Min",
      permission: "Nur lesen",
      rows: [
        { icon: "sun", accent: "cyan", title: "Morning Light & Bewegung", sub: "20 Min · Tagesstart", value: "07:30" },
        { icon: "brain", accent: "emerald", title: "Strategy Deep Work", sub: "90 Min · Fokus", value: "09:00" },
        { icon: "target", accent: "violet", title: "Leadership Sync", sub: "45 Min · Team", value: "12:30" },
        { icon: "plane", accent: "cyan", title: "Kunden-Call · Projekt A", sub: "60 Min", value: "16:30" }
      ]
    },
    tasks: {
      icon: "target",
      accent: "emerald",
      title: "Aufgaben & Ziele",
      sub: "7 aktiv · 3 heute fällig",
      source: "Personal OS",
      freshness: "vor 5 Min",
      permission: "Lesen & Schreiben",
      rows: [
        { icon: "circle-check-big", accent: "emerald", title: "Strategie Review", sub: "Diese Woche", status: "running", statusLabel: "Läuft", value: "60 %" },
        { icon: "circle-check-big", accent: "amber", title: "Team Alignment", sub: "Diese Woche", status: "waiting", statusLabel: "Wartet", value: "30 %" },
        { icon: "circle-check-big", accent: "violet", title: "Produkt Roadmap", sub: "Nächste Woche", value: "10 %" }
      ]
    },
    learning: {
      icon: "graduation-cap",
      accent: "violet",
      title: "Lernplan",
      sub: "3 Lektionen fällig",
      source: "Lern-Skills",
      freshness: "vor 1 Std",
      permission: "Nur lesen",
      rows: [
        { icon: "book-open", accent: "violet", title: "Deep Work Playbook", sub: "Fortschritt", status: "running", statusLabel: "Läuft", value: "68 %" },
        { icon: "graduation-cap", accent: "cyan", title: "Nächste Lektion", sub: "Heute · 20 Min", value: "—" },
        { icon: "sparkles", accent: "violet", title: "Wiederholung: Systemdenken", sub: "Fällig", value: "—" }
      ]
    },
    risel: {
      icon: "server",
      accent: "amber",
      title: "Rise-L Prozesse",
      sub: "5 Workflows aktiv",
      source: "systemd --user",
      freshness: "07:15",
      permission: "Nur lesen",
      rows: [
        { icon: "server", accent: "emerald", title: "Systeme online", sub: "Alle Kernsysteme stabil", status: "verified", statusLabel: "Verifiziert", value: "OK" },
        { icon: "activity", accent: "amber", title: "Mail-Sync · Dispatch-Pulse", sub: "Letzter Lauf heute", value: "5" },
        { icon: "clock", accent: "cyan", title: "Letzter Check", sub: "Heute", value: "07:15" }
      ]
    },
    travel: {
      icon: "plane",
      accent: "cyan",
      title: "Reisen",
      sub: "Nächste Reise · Rom",
      source: "Reiseplan",
      freshness: "vor 3 Std",
      permission: "Nur lesen",
      rows: [
        { icon: "plane", accent: "cyan", title: "Rom · Städtereise", sub: "Abflug 18. Jun · 08:20", value: "3 T" },
        { icon: "map", accent: "emerald", title: "Hotel bestätigt", sub: "Trastevere", status: "verified", statusLabel: "Verifiziert", value: "OK" },
        { icon: "clock", accent: "amber", title: "Check-in öffnet", sub: "17. Jun", value: "—" }
      ]
    },
    nutrition: {
      icon: "leaf",
      accent: "emerald",
      title: "Ernährung",
      sub: "Heute · 2.105 kcal",
      source: "Ernährungs-Log",
      freshness: "vor 40 Min",
      permission: "Lesen & Schreiben",
      rows: [
        { icon: "utensils", accent: "emerald", title: "Protein", sub: "Ziel 160 g", status: "running", statusLabel: "Läuft", value: "142 g" },
        { icon: "leaf", accent: "cyan", title: "Wasser", sub: "Ziel 3 L", value: "2,1 L" },
        { icon: "activity", accent: "amber", title: "Koffein", sub: "Letzte Tasse 14:00", value: "2×" }
      ]
    },
    company: {
      icon: "building-2",
      accent: "neutral",
      title: "Firma-Signale",
      sub: "Nur lesen · Approval-Cards",
      source: "Delta-Tor",
      freshness: "vor 12 Min",
      permission: "Nur lesen",
      rows: [
        { icon: "activity", accent: "emerald", title: "Team Momentum", sub: "Auslastung stabil", status: "verified", statusLabel: "Stark", value: "" },
        { icon: "message-square", accent: "cyan", title: "Stakeholder Feedback", sub: "360 Feedback", value: "Positiv" },
        { icon: "shield-check", accent: "amber", title: "Risiko Radar", sub: "Keine Eskalation", value: "Niedrig" }
      ]
    },
    kalender: {
      icon: "calendar-days",
      accent: "cyan",
      title: "Kalender / Route",
      sub: "Nächster Termin · 10:30",
      source: "Kalender",
      freshness: "vor 2 Min",
      permission: "Nur lesen",
      rows: [
        { icon: "target", accent: "cyan", title: "Leadership Sync", sub: "Team-Update", value: "10:30" },
        { icon: "brain", accent: "emerald", title: "Strategie Review", sub: "Q2 Planung", value: "14:00" },
        { icon: "plane", accent: "amber", title: "Kunden-Call · Projekt A", sub: "Anfahrt 36 Min · Leichtverkehr", value: "16:30" }
      ]
    },
    body: {
      icon: "heart-pulse",
      accent: "emerald",
      title: "Körper / WHOOP",
      sub: "Recovery 82% · Gut",
      source: "WHOOP",
      freshness: "Stand 06:12",
      permission: "Nur lesen",
      rows: [
        { icon: "heart-pulse", accent: "emerald", title: "Recovery", sub: "Bereit für hohe Belastung", status: "verified", statusLabel: "Gut", value: "82 %" },
        { icon: "moon", accent: "cyan", title: "Schlaf", sub: "Erholsam", value: "7 h 26 m" },
        { icon: "activity", accent: "amber", title: "Ruhepuls · Belastung", sub: "48 bpm · Strain 32", value: "+12 %" }
      ]
    },
    journal: {
      icon: "notebook-pen",
      accent: "cyan",
      title: "Journal",
      sub: "1 Eintrag heute",
      source: "Journal",
      freshness: "vor 6 Std",
      permission: "Lesen & Schreiben",
      rows: [
        { icon: "notebook-pen", accent: "cyan", title: "Wie fühlt sich Fokus heute an?", sub: "Sprach- oder Text-Eintrag", value: "—" },
        { icon: "audio-lines", accent: "violet", title: "Voice-Memo", sub: "Heute 06:40", value: "0:48" }
      ]
    }
  };
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
    { id: "ready", icon: "circle", label: "Bereit", tone: "ready" },
    { id: "listening", icon: "ear", label: "Hört zu", tone: "ready" },
    { id: "thinking", icon: "brain", label: "Denkt", tone: "ready" },
    { id: "suggest", icon: "lightbulb", label: "Vorschlag", tone: "amber" },
    { id: "executing", icon: "zap", label: "Ausführung", tone: "amber" },
    { id: "verified", icon: "circle-check-big", label: "Verifiziert", tone: "verified" }
  ];
  const WORKSPACES = [
    { id: "private", label: "Privat" },
    { id: "engineering", label: "Engineering" },
    { id: "company_signal", label: "Firma-Signale" }
  ];
  function prefersReducedMotion() {
    try {
      return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }
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
      const particles = [];
      for (let i = 0; i < 46; i++) {
        particles.push({
          ang: Math.random() * Math.PI * 2,
          rad: 0.55 + Math.random() * 0.5,
          spd: (0.15 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1),
          size: 0.6 + Math.random() * 1.6,
          tilt: 0.32 + Math.random() * 0.22
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
        const pulse = reduce ? 0 : Math.sin(t * 11e-4) * 0.5 + 0.5;
        const R = w / 2 * (0.9 + pulse * 0.02);
        ctx.clearRect(0, 0, w, hgt);
        const aura = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R);
        aura.addColorStop(0, "rgba(56,150,230,0.28)");
        aura.addColorStop(0.6, "rgba(40,110,200,0.12)");
        aura.addColorStop(1, "rgba(8,20,40,0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
        const core = ctx.createRadialGradient(cx, cy - R * 0.14, R * 0.06, cx, cy, R * 0.82);
        core.addColorStop(0, "rgba(180,240,255,0.98)");
        core.addColorStop(0.32, "rgba(70,175,240,0.62)");
        core.addColorStop(0.7, "rgba(24,80,150,0.4)");
        core.addColorStop(1, "rgba(6,16,34,0.05)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.82, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.82, 0, Math.PI * 2);
        ctx.clip();
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const a = p.ang + (reduce ? 0 : t * 4e-4 * p.spd);
          const rx = R * 0.78 * p.rad;
          const px = cx + Math.cos(a) * rx;
          const py = cy + Math.sin(a) * rx * p.tilt;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(150,225,255," + (0.25 + p.rad * 0.35) + ")";
          ctx.fill();
        }
        for (let b = 0; b < 3; b++) {
          const amp = R * 0.13 * (1 - b * 0.22);
          const yoff = cy + (b - 1) * R * 0.14;
          const freq = 2.1 + b * 0.5;
          const phase = reduce ? 0.6 : t * 16e-4 * (1 + b * 0.35);
          ctx.beginPath();
          for (let x = -R; x <= R; x += 4) {
            const nx = x / R;
            const y = yoff + Math.sin(nx * Math.PI * freq + phase) * amp * Math.cos(nx * 1.15);
            if (x === -R) ctx.moveTo(cx + x, y);
            else ctx.lineTo(cx + x, y);
          }
          ctx.strokeStyle = "rgba(130,225,255," + (0.55 - b * 0.14) + ")";
          ctx.lineWidth = 2.1 - b * 0.5;
          ctx.shadowColor = "rgba(90,205,255,0.85)";
          ctx.shadowBlur = 14;
          ctx.stroke();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.82, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(120,205,255," + (0.32 + pulse * 0.18) + ")";
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 0;
        ctx.stroke();
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
      function onResize() {
        size = resize();
        if (reduce) draw(600);
      }
      if (reduce) {
        draw(600);
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
      h(
        "button",
        { type: "button", className: "mos__orb-mic", "aria-label": "Sprachbefehl starten (Demo)", tabIndex: -1 },
        h(Icon, { name: "mic", size: 18 })
      )
    );
  }
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
          fill: "none"
        });
      })
    );
  }
  function ModuleNode(props) {
    const m = props.module;
    return h(
      "div",
      {
        className: "mos__nodewrap mos--" + m.accent + (props.active ? " is-active" : "") + (props.dragging ? " is-dragging" : ""),
        style: { left: m.pos.x + "%", top: m.pos.y + "%" }
      },
      h("span", { className: "mos__orbitring", "aria-hidden": "true" }),
      h("span", { className: "mos__orbitring mos__orbitring--2", "aria-hidden": "true" }),
      h(
        "button",
        {
          type: "button",
          className: "mos__node",
          "aria-current": props.active ? "true" : void 0,
          "aria-label": m.title + " öffnen",
          onPointerDown: (e) => props.onPointerDown(e, m.id),
          onClick: () => props.onActivate(m.id)
        },
        h("span", { className: "mos__node-orbit" }, h(Icon, { name: m.icon, size: 22 })),
        h(
          "span",
          { className: "mos__node-body" },
          h("span", { className: "mos__node-title" }, m.title),
          h("span", { className: "mos__node-meta" }, m.meta),
          m.readOnly && h("span", { className: "mos__node-readonly" }, h(Icon, { name: "lock", size: 12 }), "Nur lesen")
        ),
        h("span", { className: "mos__node-grip", "aria-hidden": "true" }, h(Icon, { name: "grip-vertical", size: 14 }))
      )
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
        h("span", { className: "mos__mission-sub" }, r.sub)
      ),
      r.status ? h(
        "span",
        { className: "mos__status mos__status--" + r.status },
        r.status === "verified" && h(Icon, { name: "circle-check-big", size: 13 }),
        r.status === "waiting" && h(Icon, { name: "clock", size: 13 }),
        r.statusLabel
      ) : h("span", { className: "mos__status-spacer" }),
      h("span", { className: "mos__mission-pct" }, r.value)
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
          h("span", { className: "mos__lens-sub" }, data.sub)
        ),
        h(
          "span",
          { className: "mos__lens-actions" },
          h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Anheften" }, h(Icon, { name: "pin", size: 18 })),
          h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Einklappen" }, h(Icon, { name: "chevron-up", size: 18 })),
          h("button", { type: "button", className: "mos__iconbtn", "aria-label": "Weitere Optionen" }, h(Icon, { name: "ellipsis", size: 18 })),
          closable && h(
            "button",
            { type: "button", className: "mos__iconbtn mos__iconbtn--close", "aria-label": "Fokus schließen", onClick: props.onClose },
            h(Icon, { name: "x", size: 18 })
          )
        )
      ),
      h(
        "div",
        { className: "mos__lens-body" },
        data.rows.map((r, i) => h(LensRow, { key: r.title, row: r, index: i + 1 }))
      ),
      h(
        "footer",
        { className: "mos__lens-foot" },
        h("span", { className: "mos__meta" }, h(Icon, { name: "git-branch", size: 14 }), "Quelle: ", h("b", null, data.source)),
        h("span", { className: "mos__meta" }, h(Icon, { name: "clock", size: 14 }), "Aktualität: ", h("b", null, data.freshness)),
        h("span", { className: "mos__meta" }, h(Icon, { name: "shield-check", size: 14 }), "Berechtigung: ", h("b", null, data.permission)),
        h("span", { className: "mos__lens-foot-shield" }, h(Icon, { name: "shield-check", size: 18, label: "Berechtigungen geprüft" }))
      ),
      h(
        "div",
        { className: "mos__lens-tools" },
        LENS_TOOLS.map((tl) => h("button", { key: tl.label, type: "button", className: "mos__tool" }, h(Icon, { name: tl.icon, size: 15 }), tl.label))
      )
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
          h("span", { className: "mos__identity-sub" }, "Privates System")
        )
      ),
      h("div", { className: "mos__wordmark" }, "MIKAEL OS"),
      h(
        "div",
        { className: "mos__topright" },
        h(
          "span",
          { className: "mos__concept", title: "Alle angezeigten Werte sind Konzeptdaten (Phase 1). Keine Live-Wahrheit." },
          h(Icon, { name: "flask-conical", size: 14 }),
          "Konzeptdaten"
        ),
        h(
          "span",
          { className: "mos__topchip" },
          h(Icon, { name: "cloud-moon", size: 16 }),
          h("strong", null, "22°"),
          " Klar"
        ),
        h(
          "span",
          { className: "mos__topchip mos__topchip-time" },
          h("b", null, "22:30"),
          h("span", null, "Do, 22. Mai · Berliner Zeit")
        ),
        h("button", { type: "button", className: "mos__shieldbtn", "aria-label": "Privatsphäre & Berechtigungen" }, h(Icon, { name: "shield-check", size: 20 }))
      )
    );
  }
  function WorkspaceSwitcher(props) {
    return h(
      "div",
      { className: "mos__workspace", role: "group", "aria-label": "Workspace wechseln" },
      h("span", { className: "mos__workspace-label" }, "Workspace"),
      WORKSPACES.map((w) => h(
        "button",
        {
          key: w.id,
          type: "button",
          className: "mos__ws-tab",
          "aria-pressed": props.active === w.id ? "true" : "false",
          onClick: () => props.onChange(w.id)
        },
        w.label
      ))
    );
  }
  function StateRail(props) {
    return h(
      "div",
      { className: "mos__states", role: "list", "aria-label": "Jarvis-Zustand" },
      STATES.map((s, i) => h(
        "span",
        {
          key: s.id,
          className: "mos__state",
          role: "listitem",
          "data-active": i === props.activeIndex ? "true" : "false",
          "data-passed": i < props.activeIndex ? "true" : "false",
          "data-tone": s.tone
        },
        h("span", { className: "mos__state-dot", "aria-hidden": "true" }),
        s.label
      ))
    );
  }
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
    const runStateSequence = useCallback(() => {
      clearTimers();
      if (prefersReducedMotion()) {
        setStateIndex(STATES.length - 1);
        return;
      }
      const steps = [1, 2, 3, 4, 5];
      steps.forEach((s, i) => {
        timersRef.current.push(window.setTimeout(() => setStateIndex(s), (i + 1) * 750));
      });
      timersRef.current.push(window.setTimeout(() => setStateIndex(0), (steps.length + 2) * 750));
    }, [clearTimers]);
    const activate = useCallback((id) => {
      setFocusId(id);
      setStateIndex(1);
    }, []);
    const closeFocus = useCallback(() => {
      setFocusId("engineering");
      setStateIndex(0);
    }, []);
    const onNodePointerDown = useCallback((e, id) => {
      if (e.button != null && e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      dragRef.current = { id, startX: e.clientX, startY: e.clientY, rect, moved: false };
      try {
        e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_e) {
      }
    }, []);
    useEffect(() => {
      function onMove(e) {
        const d = dragRef.current;
        if (!d) return;
        const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
        if (!d.moved && Math.hypot(dx, dy) < 5) return;
        if (!d.moved) {
          d.moved = true;
          setDragId(d.id);
        }
        const nx = Math.max(4, Math.min(96, (e.clientX - d.rect.left) / d.rect.width * 100));
        const ny = Math.max(4, Math.min(96, (e.clientY - d.rect.top) / d.rect.height * 100));
        setModules((prev) => prev.map((m) => m.id === d.id ? { ...m, pos: { x: nx, y: ny } } : m));
      }
      function onUp() {
        const d = dragRef.current;
        dragRef.current = null;
        if (d && d.moved) {
          setDragId(null);
        }
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }, []);
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
        if (k === "Escape") {
          closeFocus();
          return;
        }
        if (k >= "1" && k <= "9") {
          const idx = parseInt(k, 10) - 1;
          if (modules[idx]) activate(modules[idx].id);
          return;
        }
        if (k === "ArrowRight" || k === "ArrowLeft") {
          const ids = modules.map((m) => m.id);
          const cur = ids.indexOf(focusId);
          const next = cur === -1 ? k === "ArrowRight" ? 0 : ids.length - 1 : (cur + (k === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
          activate(ids[next]);
        }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [modules, focusId, activate, closeFocus]);
    useEffect(() => {
      if (prefersReducedMotion()) return;
      const root = stageRef.current && stageRef.current.closest(".mos");
      if (!root) return;
      function onMove(e) {
        const px = e.clientX / window.innerWidth - 0.5;
        const py = e.clientY / window.innerHeight - 0.5;
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
            h(Connectors, { modules, focusId }),
            // orbiting module nodes
            modules.map((m) => h(ModuleNode, {
              key: m.id,
              module: m,
              active: focusId === m.id,
              dragging: dragId === m.id,
              onActivate: activate,
              onPointerDown: onNodePointerDown
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
                  h("b", null, "Jarvis")
                ),
                h(Orb, null),
                h(
                  "span",
                  { className: "mos__handoff" },
                  h("span", { className: "mos__handoff-k" }, "Übergabe an"),
                  h(Icon, { name: "git-branch", size: 16 }),
                  h("b", null, "Codex / Claude")
                )
              )
            ),
            // focus lens
            h(
              "div",
              { className: "mos__lens-slot" },
              h(FocusLens, { focusId, onClose: closeFocus })
            ),
            // add-module affordance (bottom-left of stage)
            h(
              "button",
              { type: "button", className: "mos__addmodule" },
              h("span", { className: "mos__addmodule-plus" }, h(Icon, { name: "circle-plus", size: 18 })),
              "Modul hinzufügen"
            )
          )
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
              placeholder: "Sage „Jarvis“ oder schreibe einen Befehl …",
              value: command,
              onChange: (e) => setCommand(e.target.value)
            }),
            h("button", { type: "submit", className: "mos__send", "aria-label": "Senden" }, h(Icon, { name: "send-horizontal", size: 18 }))
          ),
          h(
            "div",
            { className: "mos__chips" },
            CHIPS.map((c) => h(
              "button",
              { key: c.label, type: "button", className: "mos__chip", onClick: () => {
                setCommand(c.label);
                if (inputRef.current) inputRef.current.focus();
              } },
              h(Icon, { name: c.icon, size: 14 }),
              c.label
            ))
          )
        ),
        // footer: quick access · state rail · reorder hint
        h(
          "footer",
          { className: "mos__footer" },
          h(
            "button",
            { type: "button", className: "mos__quick" },
            h(Icon, { name: "layout-grid", size: 16 }),
            "Schnellzugriffe",
            h(Icon, { name: "chevron-up", size: 14 })
          ),
          h(StateRail, { activeIndex: stateIndex }),
          h(
            "span",
            { className: "mos__reorder" },
            h(Icon, { name: "grip-vertical", size: 14 }),
            "Ziehen um neu zu ordnen",
            h("span", { className: "mos__kbd" }, h(Icon, { name: "command", size: 12 }), "K · Kurzbefehle")
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
