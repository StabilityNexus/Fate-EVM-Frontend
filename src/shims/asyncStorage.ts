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
      return storage.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  },
  async setItem(key, value) {
    const storage = getStorage();
    if (storage) {
      storage.setItem(key, value);
      return;
    }
    memoryStore.set(key, value);
  },
  async removeItem(key) {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(key);
      return;
    }
    memoryStore.delete(key);
  },
};

export default AsyncStorage;
