export interface StorageDriver {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

const hasChromeStorage = (): boolean => {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
};

const isExtensionContextInvalidated = (error: unknown): boolean => {
  return error instanceof Error && /Extension context invalidated/i.test(error.message);
};

export const chromeLocalStorageDriver: StorageDriver = {
  async get<T>(key: string) {
    if (hasChromeStorage()) {
      try {
        const result = await chrome.storage.local.get(key);
        return result[key] as T | undefined;
      } catch (error) {
        if (!isExtensionContextInvalidated(error)) {
          throw error;
        }
      }
    }

    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  },
  async set<T>(key: string, value: T) {
    if (hasChromeStorage()) {
      try {
        await chrome.storage.local.set({ [key]: value });
        return;
      } catch (error) {
        if (!isExtensionContextInvalidated(error)) {
          throw error;
        }
      }
    }

    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  }
};
