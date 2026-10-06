import { expect, type Locator, test } from "@playwright/test";

import ru from "../public/dictionaries/ru.json" with { type: "json" };
import { installGreenApiStub, STUB_CONTACT, STUB_CREDENTIALS } from "./greenApiStub";

async function getBox(locator: Locator) {
  const box = await locator.boundingBox();

  if (box === null) {
    throw new Error("Элемент не отображается");
  }

  return box;
}

/** Середина колонки переписки по горизонтали — по правой колонке (`main`), в которой лента отцентрирована. */
async function getChatColumnCenterX(chatScreen: Locator): Promise<number> {
  const box = await getBox(chatScreen);

  return box.x + box.width / 2;
}

test("вход, новый чат, отправка и получение сообщения, выход", async ({ page, baseURL }) => {
  const stub = await installGreenApiStub(page, new URL(baseURL ?? "").origin);
  const chatScreen = page.getByRole("main");

  let pageLoads = 0;
  page.on("load", () => {
    pageLoads += 1;
  });

  await test.step("неверный токен — ошибка под формой", async () => {
    await page.goto("/login");
    await page.getByLabel(ru.login.idInstanceLabel).fill(STUB_CREDENTIALS.idInstance);
    await page.getByLabel(ru.login.apiTokenLabel).fill("wrong-token");
    await page.getByRole("button", { name: ru.login.submitButton }).click();

    await expect(page.getByRole("alert")).toHaveText(ru.login.unauthorizedError);
    await expect(page).toHaveURL(/\/login$/);
  });

  await test.step("вход — пустой список чатов", async () => {
    await page.getByLabel(ru.login.apiTokenLabel).fill(STUB_CREDENTIALS.apiTokenInstance);
    await page.getByRole("button", { name: ru.login.submitButton }).click();

    await expect(page.getByText(ru.sidebar.emptyTitle)).toBeVisible();
    await expect(page.getByText(ru.chat.selectChat)).toBeVisible();
  });

  await test.step("новый чат по номеру — экран чата с шапкой", async () => {
    await page.getByRole("button", { name: ru.sidebar.newChatButton }).click();
    await page.getByLabel(ru.newChat.phoneLabel).fill(`+${STUB_CONTACT.phone}`);
    await page.getByRole("button", { name: ru.newChat.submitButton }).click();

    await expect(page).toHaveURL(new RegExp(`/chat/${STUB_CONTACT.chatId}$`));
    await expect(chatScreen.getByRole("heading", { name: STUB_CONTACT.name })).toBeVisible();
    await expect(chatScreen.getByText(`@${STUB_CONTACT.username}`)).toBeVisible();
    await expect(chatScreen.getByText(ru.chat.emptyHistory)).toBeVisible();
  });

  await test.step("отправка — пузырь справа", async () => {
    const text = "Привет из e2e";

    const composer = page.getByRole("textbox", { name: ru.chat.composerPlaceholder });
    const sendButton = page.getByRole("button", { name: ru.chat.sendButton });

    await composer.fill(text);
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    const bubble = chatScreen.getByText(text);
    await expect(bubble).toBeVisible();
    await expect(composer).toHaveValue("");
    expect((await getBox(bubble)).x).toBeGreaterThan(await getChatColumnCenterX(chatScreen));
  });

  await test.step("входящее в открытый чат — пузырь слева без перезагрузки", async () => {
    const text = "Ответ собеседника";

    const loadsBefore = pageLoads;
    stub.pushIncoming(STUB_CONTACT.chatId, text);

    const bubble = chatScreen.getByText(text);
    await expect(bubble).toBeVisible();
    expect(pageLoads).toBe(loadsBefore);

    const box = await getBox(bubble);
    expect(box.x + box.width).toBeLessThan(await getChatColumnCenterX(chatScreen));
  });

  await test.step("выход — экран входа", async () => {
    await page.getByRole("button", { name: ru.sidebar.menuButton }).click();
    await page.getByRole("button", { name: ru.sidebar.logoutButton }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: ru.login.submitButton })).toBeVisible();
  });

  expect(stub.unexpectedRequests).toEqual([]);
});
