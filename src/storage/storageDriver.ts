export interface StorageDriver {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

const hasChromeStorage = (): boolean => {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
};

export const chromeLocalStorageDriver: StorageDriver = {
  async get<T>(key: string) {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get(key);
      return result[key] as T | undefined;
    }

    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  },
  async set<T>(key: string, value: T) {
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }

    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  }
};
