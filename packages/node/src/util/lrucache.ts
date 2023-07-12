// Define an interface for the cache items with key-value pairs
interface CacheItem<T> {
  key: string;
  value: T;
}

export class LRUCache<T> {
  // Define the maximum cache size and the cache data structure
  private readonly maxSize: number;
  private cache: Map<string, CacheItem<T>>;

  // Initialize the LRU cache with a specified maximum size
  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map<string, CacheItem<T>>();
  }

  // Add an item to the cache, evicting the least recently used item if the cache is full
  set(key: string, value: T): void {
    // find the least recently used item and remove it from the cache
    // get the list of keys in the cache and get the first one
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.cache.keys().next().value;
      // remove the least recently used item from the cache
      this.cache.delete(lruKey);
    }
    this.cache.set(key, { key, value });
  }

  // Retrieve an item from the cache, and update its position as the most recently used item
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.cache.set(key, item);
      return item.value;
    }
    return undefined;
  }

  // Remove an item from the cache by its key
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear the cache
  clear(): void {
    this.cache.clear();
  }
}
