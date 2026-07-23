export function consumeChatSeed(params: URLSearchParams): {
  seed: string;
  next: URLSearchParams;
} {
  const learn = params.get("learn")?.trim() ?? "";
  const prompt = params.get("prompt")?.trim() ?? "";
  const seed = learn ? `/learn ${learn}` : prompt;
  const next = new URLSearchParams(params);
  next.delete("learn");
  next.delete("prompt");
  return { seed, next };
}
