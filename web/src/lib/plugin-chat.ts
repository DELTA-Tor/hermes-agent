export const PLUGIN_CHAT_OPEN_EVENT = "hermes:plugin-chat-open";

export interface PluginChatOpenDetail {
  prompt: string;
}

export function normalizePluginChatPrompt(prompt: unknown): string {
  return typeof prompt === "string" ? prompt.trim() : "";
}

export function openPluginChat(prompt: string): void {
  const normalized = normalizePluginChatPrompt(prompt);
  if (!normalized || typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<PluginChatOpenDetail>(PLUGIN_CHAT_OPEN_EVENT, {
      detail: { prompt: normalized },
    }),
  );
}

export function pluginChatPrompt(event: Event): string {
  const detail = (
    event as Event & { detail?: Partial<PluginChatOpenDetail> }
  ).detail;
  return normalizePluginChatPrompt(detail?.prompt);
}
