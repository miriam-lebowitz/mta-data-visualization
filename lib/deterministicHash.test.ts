import { describe, expect, it } from "vitest";
import { hash32, unitFloat } from "./deterministicHash";

describe("deterministicHash", () => {
  it("unitFloat is stable for the same seed", () => {
    expect(unitFloat("A", "delay")).toBe(unitFloat("A", "delay"));
    expect(unitFloat("A", "delay")).not.toBe(unitFloat("B", "delay"));
  });

  it("hash32 is deterministic", () => {
    expect(hash32("test")).toBe(hash32("test"));
    expect(hash32("a")).not.toBe(hash32("b"));
  });
});
