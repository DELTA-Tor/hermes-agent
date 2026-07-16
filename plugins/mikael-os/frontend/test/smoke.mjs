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

const mustContain = [
  "MIKAEL OS", "Konzeptdaten", "Privates System", "JARVIS",
  "Engineering / Codex", "Feature: KI Fokus-Modus", "Modul hinzufügen",
  "Bereit", "Verifiziert", "Ziehen um neu zu ordnen",
  'Sage „Jarvis“',
];
const missing = mustContain.filter((s) => !html.includes(s));
if (missing.length) {
  console.error("FAIL: rendered HTML missing:", missing);
  process.exit(1);
}

// icons rendered as inline <svg>
const svgCount = (html.match(/<svg /g) || []).length;
if (svgCount < 20) {
  console.error(`FAIL: expected many inline lucide <svg> icons, found ${svgCount}`);
  process.exit(1);
}

console.log(`PASS: registered 'mikael-os', rendered ${html.length} chars, ${svgCount} lucide icons, all ${mustContain.length} key strings present.`);
