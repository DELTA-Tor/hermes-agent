import { describe, expect, it } from "vitest";

import { consumeChatSeed } from "./chat-seed";

describe("consumeChatSeed", () => {
  it("hands a MIKAEL OS prompt to the real chat and consumes it once", () => {
    const { seed, next } = consumeChatSeed(
      new URLSearchParams("prompt=Pr%C3%BCfe+meine+Macs&profile=default"),
    );

    expect(seed).toBe("Prüfe meine Macs");
    expect(next.get("prompt")).toBeNull();
    expect(next.get("profile")).toBe("default");
  });

  it("keeps the existing learn command precedence", () => {
    const { seed, next } = consumeChatSeed(
      new URLSearchParams("learn=PDFs+sortieren&prompt=ignorieren"),
    );

    expect(seed).toBe("/learn PDFs sortieren");
    expect(next.has("learn")).toBe(false);
    expect(next.has("prompt")).toBe(false);
  });
});
