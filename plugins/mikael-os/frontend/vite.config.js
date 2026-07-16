import { defineConfig } from "vite";

/**
 * MIKAEL OS dashboard-plugin bundle build.
 *
 * Emits a single self-executing IIFE (`../dashboard/dist/index.js`) plus an
 * extracted stylesheet (`../dashboard/dist/style.css`), in the exact contract
 * the Nous Hermes dashboard host expects for a plugin bundle (see
 * `web/src/plugins/usePlugins.ts` + `registry.ts::exposePluginSDK`):
 *
 *   - React / hooks / UI primitives are pulled from the host global
 *     `window.__HERMES_PLUGIN_SDK__` at runtime — NOTHING is bundled. We use
 *     the classic JSX runtime with `React.createElement` where `React` is a
 *     local const read off the SDK, so `react` never enters the module graph
 *     (identical strategy to the checked-in kanban / hermes-achievements
 *     template bundles, which are hand-authored `React.createElement` IIFEs).
 *   - The bundle registers itself via
 *     `window.__HERMES_PLUGINS__.register("mikael-os", MikaelOS)`.
 *
 * Output is intentionally NOT minified so the register call and SDK reads are
 * greppable and diff-comparable against the template bundles.
 */
export default defineConfig({
  esbuild: {
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
  },
  build: {
    outDir: "../dashboard/dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    target: "es2020",
    // Inline the photographic atmosphere (and any other asset) as a base64
    // data: URI directly into style.css, so the shipped plugin stays exactly
    // two files (index.js + style.css) — the host loads nothing else.
    assetsInlineLimit: 10_000_000,
    lib: {
      entry: "src/index.jsx",
      formats: ["iife"],
      name: "MikaelOSPlugin",
      fileName: () => "index.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "style.css",
      },
    },
  },
});
