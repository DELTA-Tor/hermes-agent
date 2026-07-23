import { describe, expect, it } from "vitest";

import {
  normalizePluginChatPrompt,
  pluginChatPrompt,
} from "./plugin-chat";

describe("plugin chat bridge", () => {
  it("normalizes a prompt from the host event", () => {
    const event = Object.assign(new Event("hermes:plugin-chat-open"), {
      detail: { prompt: "  Prüfe meine Macs  " },
    });
    expect(pluginChatPrompt(event)).toBe("Prüfe meine Macs");
  });

  it("does not open an empty turn", () => {
    expect(normalizePluginChatPrompt("   ")).toBe("");
    expect(normalizePluginChatPrompt(null)).toBe("");
  });
});
