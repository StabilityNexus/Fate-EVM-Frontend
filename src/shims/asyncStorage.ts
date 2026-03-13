type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStore = new Map<string, string>();

const getStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

const AsyncStorage: AsyncStorageLike = {
  async getItem(key) {
    const storage = getStorage();
    if (storage) {
      try {
        return storage.getItem(key);
      } catch {
        return memoryStore.get(key) ?? null;
      }
    }
    return memoryStore.get(key) ?? null;
  },
  async setItem(key, value) {
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(key, value);
        return;
      } catch {
        // Fall through to memory store
      }
    }
    memoryStore.set(key, value);
  },
  async removeItem(key) {
    const storage = getStorage();
    if (storage) {
      try {
        storage.removeItem(key);
        return;
      } catch {
        // Fall through to memory store
      }
    }
    memoryStore.delete(key);
  },
};

export default AsyncStorage;
