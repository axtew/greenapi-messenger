import { describe, expect, it } from "vitest";

import { getMessageToSend } from "../_helpers";

describe("getMessageToSend", () => {
  it("отдаёт текст без пробелов по краям, когда история загружена", () => {
    expect(getMessageToSend("  привет \n", true)).toBe("привет");
  });

  it("не отправляет пустой и состоящий из пробелов текст", () => {
    expect(getMessageToSend("", true)).toBeNull();
    expect(getMessageToSend(" \n\t ", true)).toBeNull();
  });

  it("не отправляет, пока история не загружена", () => {
    expect(getMessageToSend("привет", false)).toBeNull();
  });
});
