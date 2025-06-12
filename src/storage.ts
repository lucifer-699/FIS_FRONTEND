// src/utils/storage.ts

const DEFAULT_TTL_MINUTES = 60; // increase this default value as needed

export const storage = {
  set: (key: string, value: any, ttl?: number) => {
    const now = new Date();
    const item = {
      value,
      expiry: (ttl ?? DEFAULT_TTL_MINUTES) ? now.getTime() + (ttl ?? DEFAULT_TTL_MINUTES) * 60 * 1000 : undefined,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  get: (key: string) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (item.expiry && now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
  clear: () => {
    localStorage.clear();
  },
};
