import { describe, expect, it } from "vitest";

import { EGreenApiErrorKind, EGreenApiMethod, GreenApiError } from "@/api/greenApi";
import {
  EMessageDirection,
  EMessageStatus,
  ESendFailReason,
  type IMessage,
} from "@/types/messages.types";

import { confirmLocalMessage, createLocalMessage, getSendFailReason } from "../messages.mutations";

const CHAT_ID = "334346886";
const LOCAL_ID = "local-1";
const ID_MESSAGE = "BAE5F4886F6F1D05";

function makeMessage(overrides: Partial<IMessage>): IMessage {
  return {
    id: "id",
    chatId: CHAT_ID,
    direction: EMessageDirection.OUTGOING,
    text: "Привет",
    timestamp: 1_700_000_000,
    status: EMessageStatus.SENT,
    failReason: null,
    replacesId: null,
    deletedMessageId: null,
    isDeleted: false,
    ...overrides,
  };
}

const earlier = makeMessage({ id: "earlier", direction: EMessageDirection.INCOMING });
const local = makeMessage({
  id: LOCAL_ID,
  status: EMessageStatus.SENDING,
  timestamp: 1_700_000_100,
});

describe("createLocalMessage", () => {
  it("исходящее неотправленное с временным id и временем в секундах", () => {
    const message = createLocalMessage(CHAT_ID, "Привет", 1_700_000_000_999);

    expect(message.id).toMatch(/^local-[0-9a-f-]{36}$/);
    expect(message).toEqual({
      id: message.id,
      chatId: CHAT_ID,
      direction: EMessageDirection.OUTGOING,
      text: "Привет",
      timestamp: 1_700_000_000,
      status: EMessageStatus.SENDING,
      failReason: null,
      replacesId: null,
      deletedMessageId: null,
      isDeleted: false,
    });
  });

  it("у каждого сообщения свой id", () => {
    expect(createLocalMessage(CHAT_ID, "a", 0).id).not.toBe(createLocalMessage(CHAT_ID, "a", 0).id);
  });
});

describe("confirmLocalMessage", () => {
  it("локальное получает idMessage и статус «отправлено» на своём месте", () => {
    expect(confirmLocalMessage([earlier, local], LOCAL_ID, ID_MESSAGE)).toEqual([
      earlier,
      { ...local, id: ID_MESSAGE, status: EMessageStatus.SENT },
    ]);
  });

  it("эхо с тем же idMessage уже в ленте — локальное убирается, дубля нет", () => {
    const echo = makeMessage({ id: ID_MESSAGE, timestamp: 1_700_000_101 });

    expect(confirmLocalMessage([earlier, local, echo], LOCAL_ID, ID_MESSAGE)).toEqual([
      earlier,
      echo,
    ]);
  });

  it("локального нет в ленте — лента не меняется", () => {
    expect(confirmLocalMessage([earlier], LOCAL_ID, ID_MESSAGE)).toEqual([earlier]);
  });
});

describe("getSendFailReason", () => {
  it.each([
    {
      error: new GreenApiError(EGreenApiErrorKind.HTTP, EGreenApiMethod.SEND_MESSAGE, 466),
      reason: ESendFailReason.QUOTA,
    },
    {
      error: new GreenApiError(EGreenApiErrorKind.NETWORK, EGreenApiMethod.SEND_MESSAGE, null),
      reason: ESendFailReason.NETWORK,
    },
    {
      error: new GreenApiError(EGreenApiErrorKind.HTTP, EGreenApiMethod.SEND_MESSAGE, 500),
      reason: ESendFailReason.GENERIC,
    },
    {
      error: new GreenApiError(
        EGreenApiErrorKind.INVALID_RESPONSE,
        EGreenApiMethod.SEND_MESSAGE,
        200,
      ),
      reason: ESendFailReason.GENERIC,
    },
    { error: new Error("boom"), reason: ESendFailReason.GENERIC },
  ])("$error.message → $reason", ({ error, reason }) => {
    expect(getSendFailReason(error)).toBe(reason);
  });
});
