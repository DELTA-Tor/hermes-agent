/*
 * Headless smoke test for the built MIKAEL OS plugin bundle.
 *
 * Loads dist/index.js exactly as the host would (as a <script> that reads
 * window.__HERMES_PLUGIN_SDK__ and calls window.__HERMES_PLUGINS__.register),
 * using a minimal mock SDK (createElement + useState). Then it renders the
 * registered root component to a static HTML string and asserts key content is
 * present and nothing throws. Proves: bundle executes, registers under the
 * manifest name, and the component tree renders against the SDK contract —
 * without bundling or installing React.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.resolve(__dirname, "../../dashboard/dist/index.js");
const code = fs.readFileSync(bundlePath, "utf8");

// --- minimal mock React ---------------------------------------------------
const Fragment = Symbol("Fragment");
function createElement(type, props, ...children) {
  return { type, props: props || {}, children: children.flat(Infinity).filter((c) => c != null && c !== false) };
}
const mockReact = { createElement, Fragment };
// Mock the full hook surface the host SDK exposes (useState/useEffect/useRef/
// useMemo/useCallback). For a single static render pass effects never run,
// refs are inert and memo/callback resolve eagerly — enough to render the tree.
const hooks = {
  useState: (init) => [typeof init === "function" ? init() : init, () => {}],
  useEffect: () => {},
  useRef: (init) => ({ current: init === undefined ? null : init }),
  useMemo: (fn) => (typeof fn === "function" ? fn() : fn),
  useCallback: (fn) => fn,
};

const registered = {};
const win = {
  __HERMES_PLUGIN_SDK__: {
    sdkVersion: "test",
    React: mockReact,
    hooks,
    components: {},
    utils: { cn: (...a) => a.filter(Boolean).join(" "), timeAgo: () => "", isoTimeAgo: () => "" },
    useI18n: () => ({ t: {}, locale: "de" }),
    fetchJSON: async () => ({}),
    authedFetch: async () => ({}),
    buildWsUrl: async () => "",
    buildWsAuthParam: async () => ["token", ""],
  },
  __HERMES_PLUGINS__: {
    register: (name, component) => { registered[name] = component; },
    registerSlot: () => {},
  },
};

const ctx = { window: win, globalThis: {}, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: "index.js" });

// --- assert registration --------------------------------------------------
const Root = registered["mikael-os"];
if (typeof Root !== "function") {
  console.error("FAIL: plugin did not register a 'mikael-os' component");
  process.exit(1);
}

// --- render to a static string --------------------------------------------
function renderNode(node) {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(renderNode).join("");
  const { type, props, children } = node;
  if (typeof type === "function") {
    const merged = Object.assign({}, props, children && children.length ? { children } : {});
    return renderNode(type(merged));
  }
  const kids = (children && children.length ? children : (props.children ? [].concat(props.children) : []));
  let inner = "";
  if (props.dangerouslySetInnerHTML && props.dangerouslySetInnerHTML.__html) {
    inner = props.dangerouslySetInnerHTML.__html;
  } else {
    inner = kids.map(renderNode).join("");
  }
  const tag = type === Fragment ? "" : String(type);
  if (!tag) return inner;
  const cls = props.className ? ` class="${props.className}"` : "";
  const ph = props.placeholder ? ` placeholder="${props.placeholder}"` : "";
  const al = props["aria-label"] ? ` aria-label="${props["aria-label"]}"` : "";
  return `<${tag}${cls}${ph}${al}>${inner}</${tag}>`;
}

let html;
try {
  html = renderNode(createElement(Root, {}));
} catch (err) {
  console.error("FAIL: render threw:", err && err.stack ? err.stack : err);
  process.exit(1);
}

// The default scene is the Cockpit (index.jsx: useState("cockpit")). These
// strings are rendered in the Cockpit's initial static pass (TopBar identity,
// the four KPI labels, the three zone cards, the 7-state rail incl. the new
// FOKUS state, and the shared command bar).
const mustContain = [
  "MIKAEL OS", "Privates System", "Mikael",
  "Kennzahlen", "Recovery", "Nächste Klausur", "Offene Freigaben", "Laufende Jobs",
  "Heute", "Jarvis", "Firma / Rise-L", "Freigaben",
  "Bereit", "Fokus", "Verifiziert",
  'Sage „Jarvis“',
];
const missing = mustContain.filter((s) => !html.includes(s));
if (missing.length) {
  console.error("FAIL: rendered HTML missing:", missing);
  process.exit(1);
}

// Constellation-scene content ships in the SAME bundle but is not in the default
// Cockpit static render (the scene toggle is a real state change the static mock
// cannot flip). Assert on the bundle SOURCE that this content is still present —
// so a regression that drops the Konstellation is still caught.
const constellationMust = [
  "Konzeptdaten", "JARVIS", "Engineering / Codex",
  "Feature: KI Fokus-Modus", "Modul hinzufügen", "Ziehen um neu zu ordnen",
];
const constMissing = constellationMust.filter((s) => !code.includes(s));
if (constMissing.length) {
  console.error("FAIL: bundle missing Konstellation-scene content:", constMissing);
  process.exit(1);
}

// icons rendered as inline <svg>
const svgCount = (html.match(/<svg /g) || []).length;
if (svgCount < 20) {
  console.error(`FAIL: expected many inline lucide <svg> icons, found ${svgCount}`);
  process.exit(1);
}

// --- L-3 Lern-Coach shipped in the bundle ---------------------------------
// The coach overlay is closed in a static render (coach state = null), so we
// assert on the shipped bundle source that the L-3 building blocks exist AND
// stay propose/read-only + honest (no /approvals/decide, no Anki write).
const l3Must = [
  "/study/plan", "/study/feynman/evaluate", "/study/plan/propose",
  "Lern-Coach", "An Jarvis senden", "studyObjective",
  "CoachSurface", "Klausur-Countdown", "Bewertung kommt von Jarvis",
];
const l3Missing = l3Must.filter((s) => !code.includes(s));
if (l3Missing.length) {
  console.error("FAIL: L-3 coach markers missing from bundle:", l3Missing);
  process.exit(1);
}
// Guardrail: the coach's live steps only ever address the plugin's OWN routes.
// The bundle must not build a direct control-plane URL or an /approvals/decide
// fetch target (those strings only ever appear inside honest // comments, never
// as a string literal the code fetches). Assert no decide/18083 STRING LITERAL.
const l3ForbiddenLiterals = ['"/approvals/decide"', "'/approvals/decide'", ":18083", "127.0.0.1:18084"];
const l3Leak = l3ForbiddenLiterals.filter((s) => code.includes(s));
if (l3Leak.length) {
  console.error("FAIL: bundle contains a forbidden endpoint literal:", l3Leak);
  process.exit(1);
}

console.log(`PASS: registered 'mikael-os', rendered ${html.length} chars, ${svgCount} lucide icons, all ${mustContain.length} Cockpit strings + ${constellationMust.length} Konstellation-source strings + ${l3Must.length} L-3 markers present, no forbidden endpoint literals.`);
