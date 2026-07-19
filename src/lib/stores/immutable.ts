export function freezeCopy<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

export function byDateDesc<T extends { date: string }>(
  items: readonly T[],
): readonly T[] {
  return freezeCopy(items.toSorted((a, b) => b.date.localeCompare(a.date)));
}

export function byDateAsc<T extends { date: string }>(
  items: readonly T[],
): readonly T[] {
  return freezeCopy(items.toSorted((a, b) => a.date.localeCompare(b.date)));
}

class ImmutableIndex<K, V> implements ReadonlyMap<K, V> {
  readonly #map: Map<K, V>;

  constructor(entries: Iterable<readonly [K, V]>) {
    this.#map = new Map(entries);
    Object.freeze(this);
  }

  get size(): number {
    return this.#map.size;
  }

  get(key: K): V | undefined {
    return this.#map.get(key);
  }

  has(key: K): boolean {
    return this.#map.has(key);
  }

  entries(): MapIterator<[K, V]> {
    return this.#map.entries();
  }

  keys(): MapIterator<K> {
    return this.#map.keys();
  }

  values(): MapIterator<V> {
    return this.#map.values();
  }

  forEach(
    callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
    thisArg?: unknown,
  ): void {
    this.#map.forEach((value, key) => callbackfn.call(thisArg, value, key, this));
  }

  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }

  get [Symbol.toStringTag](): string {
    return "Map";
  }
}

export function uniqueIndex<T>(
  label: string,
  items: readonly T[],
  keyOf: (item: T) => string,
): ReadonlyMap<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    if (index.has(key)) {
      throw new Error(`Duplicate ${label} key "${key}".`);
    }
    index.set(key, item);
  }
  return new ImmutableIndex(index);
}

export function relationshipIndex<T>(
  items: readonly T[],
  slugsOf: (item: T) => readonly string[] | undefined,
): ReadonlyMap<string, readonly T[]> {
  const mutable = new Map<string, T[]>();
  for (const item of items) {
    for (const slug of new Set(slugsOf(item) ?? [])) {
      const related = mutable.get(slug) ?? [];
      related.push(item);
      mutable.set(slug, related);
    }
  }
  return new ImmutableIndex(
    [...mutable].map(([slug, related]) => [slug, freezeCopy(related)] as const),
  );
}

export function valuesForKeys<T>(
  index: ReadonlyMap<string, T>,
  keys: readonly string[],
): T[] {
  return keys
    .map((key) => index.get(key))
    .filter((item): item is T => item !== undefined);
}

export function requireValue<T>(
  index: ReadonlyMap<string, T>,
  key: string,
  label: string,
  owner: string,
): T {
  const item = index.get(key);
  if (!item) throw new Error(`${owner} references missing ${label} "${key}".`);
  return item;
}

export function requireMany<T>(
  index: ReadonlyMap<string, T>,
  keys: readonly string[],
  label: string,
  owner: string,
): T[] {
  return keys.map((key) => requireValue(index, key, label, owner));
}
