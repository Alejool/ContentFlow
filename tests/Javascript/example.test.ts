import { describe, expect, it } from "vitest";

describe("Frontend Testing Setup", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have access to JSDOM", () => {
    const element = document.createElement("div");
    element.innerHTML = "Hello Vitest";
    expect(element.innerHTML).toBe("Hello Vitest");
  });
});
