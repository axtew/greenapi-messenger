/** Форма словаря `public/dictionaries/*.json`. */
export interface I18n {
  app: {
    title: string;
  };
  login: {
    title: string;
    subtitle: string;
    idInstanceLabel: string;
    apiTokenLabel: string;
    submitButton: string;
    requiredError: string;
    idInstanceError: string;
    unauthorizedError: string;
    notAuthorizedError: string;
    networkError: string;
    sessionExpired: string;
  };
  sidebar: {
    title: string;
    menuButton: string;
    accountLabel: string;
    logoutButton: string;
    newChatButton: string;
    emptyTitle: string;
    emptyHint: string;
    syncError: string;
  };
  settingsWarning: {
    webhookUrl: string;
    incomingDisabled: string;
    hint: string;
  };
  newChat: {
    title: string;
    backButton: string;
    phoneLabel: string;
    phonePlaceholder: string;
    submitButton: string;
    phoneError: string;
    notFoundError: string;
    rateLimitError: string;
    searchRestrictedError: string;
    genericError: string;
  };
  chat: {
    selectChat: string;
    backButton: string;
    historyError: string;
    retryButton: string;
    emptyHistory: string;
    today: string;
    yesterday: string;
    unsupportedMessage: string;
    failedLabel: string;
    composerPlaceholder: string;
    sendButton: string;
  };
  sendErrors: {
    quota: string;
    network: string;
    generic: string;
  };
}
