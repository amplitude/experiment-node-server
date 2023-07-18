class ListNode<T> {
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
  data: T;

  constructor(data: T) {
    this.prev = null;
    this.next = null;
    this.data = data;
  }
}

interface CacheItem<T> {
  key: string;
  value: T;
  createdAt: number;
}

export class Cache<T> {
  private readonly capacity: number;
  private readonly ttlMillis: number;
  private cache: Map<string, ListNode<CacheItem<T>>>;
  private head: ListNode<CacheItem<T>> | null;
  private tail: ListNode<CacheItem<T>> | null;

  constructor(capacity: number, ttlMillis: number) {
    this.capacity = capacity;
    this.ttlMillis = ttlMillis;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  put(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.removeFromList(key);
    } else if (this.cache.size >= this.capacity) {
      this.evictLRU();
    }

    const cacheItem: CacheItem<T> = {
      key,
      value,
      createdAt: Date.now(),
    };

    const node = new ListNode(cacheItem);
    this.cache.set(key, node);
    this.insertToList(node);
  }

  get(key: string): T | undefined {
    const node = this.cache.get(key);
    if (node) {
      const timeElapsed = Date.now() - node.data.createdAt;
      if (timeElapsed > this.ttlMillis) {
        this.remove(key);
        return undefined;
      }

      this.removeFromList(key);
      this.insertToList(node);
      return node.data.value;
    }
    return undefined;
  }

  remove(key: string): void {
    this.removeFromList(key);
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  private evictLRU(): void {
    if (this.head) {
      this.remove(this.head.data.key);
    }
  }

  private removeFromList(key: string): void {
    const node = this.cache.get(key);
    if (node) {
      if (node.prev) {
        node.prev.next = node.next;
      } else {
        this.head = node.next;
      }

      if (node.next) {
        node.next.prev = node.prev;
      } else {
        this.tail = node.prev;
      }
    }
  }

  private insertToList(node: ListNode<CacheItem<T>>): void {
    if (this.tail) {
      this.tail.next = node;
      node.prev = this.tail;
      node.next = null;
      this.tail = node;
    } else {
      this.head = node;
      this.tail = node;
    }
  }
}
