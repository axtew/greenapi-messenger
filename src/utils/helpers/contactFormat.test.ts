import { describe, expect, it } from "vitest";

import { formatContactHandle } from "./contactFormat";

describe("formatContactHandle", () => {
  it("username важнее телефона", () => {
    expect(formatContactHandle({ username: "ivan", phone: "79001234567" })).toBe("@ivan");
  });

  it("без username — телефон с плюсом", () => {
    expect(formatContactHandle({ username: null, phone: "79001234567" })).toBe("+79001234567");
  });

  it("ни того, ни другого — null", () => {
    expect(formatContactHandle({ username: null, phone: null })).toBeNull();
  });
});
