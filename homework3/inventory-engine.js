/**
 * In-browser teaching model. ONE instance is authoritative in ONE JavaScript
 * runtime only. It does not synchronize separate tabs/devices or replace server
 * database transactions. No payment or order processing takes place remotely.
 *
 * Invariant (each committed revision):
 *   available + active reservations + sold === initialStock
 *   all counts >= 0; one token can be checked out at most once.
 */
export class MemoryInventoryStore {
  constructor(initialStock) {
    if (!Number.isSafeInteger(initialStock) || initialStock < 0) {
      throw new RangeError('initialStock must be a non-negative safe integer');
    }
    this.initialStock = initialStock;
    this._state = {
      version: 0, available: initialStock, sold: 0,
      holds: {}, purchases: {}
    };
  }

  read() {
    const state = this._state;
    return {
      version: state.version,
      available: state.available,
      sold: state.sold,
      holds: Object.fromEntries(Object.entries(state.holds).map(([id, hold]) => [id, { ...hold }])),
      purchases: Object.fromEntries(Object.entries(state.purchases).map(([id, receipt]) => [id, { ...receipt }]))
    };
  }

  /** A synchronous compare-and-swap operation within this JS runtime. */
  compareAndSwap(expectedVersion, nextState) {
    if (this._state.version !== expectedVersion) return false;
    if (!Number.isSafeInteger(nextState.available) || nextState.available < 0 ||
        !Number.isSafeInteger(nextState.sold) || nextState.sold < 0) {
      throw new Error('Inventory cannot become negative');
    }
    const active = Object.keys(nextState.holds).length;
    if (nextState.available + active + nextState.sold !== this.initialStock) {
      throw new Error('Inventory conservation invariant violated');
    }
    this._state = { ...nextState, version: expectedVersion + 1 };
    return true;
  }
}

let nextToken = 0;
const defaultTokenFactory = () => `hold-${Date.now().toString(36)}-${++nextToken}`;

export class FlashSaleEngine {
  constructor({ stock = 5, ttlMs = 15000, now = () => Date.now(),
    tokenFactory = defaultTokenFactory, store = new MemoryInventoryStore(stock),
    maxRetries = 256 } = {}) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new RangeError('Invalid lock TTL');
    if (!Number.isSafeInteger(maxRetries) || maxRetries < 1) throw new RangeError('Invalid maxRetries');
    this.store = store;
    this.initialStock = store.initialStock;
    this.ttlMs = ttlMs;
    this.now = now;
    this.tokenFactory = tokenFactory;
    this.maxRetries = maxRetries;
    this.conflictCount = 0;
  }

  // Expire all elapsed locks exactly once. CAS makes expiry safe under retries.
  expireLocks() {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const current = this.store.read();
      const expired = Object.entries(current.holds)
        .filter(([, hold]) => this.now() >= hold.expiresAt)
        .map(([token]) => token);
      if (!expired.length) return 0;
      const next = { ...current, holds: { ...current.holds },
        available: current.available + expired.length };
      for (const token of expired) delete next.holds[token];
      if (this.store.compareAndSwap(current.version, next)) return expired.length;
      this.conflictCount++;
    }
    throw new Error('Expiration retry limit exceeded');
  }

  snapshot() {
    this.expireLocks();
    const state = this.store.read();
    return {
      ...state, reserved: Object.keys(state.holds).length,
      initialStock: this.initialStock
    };
  }

  /** Optimistic reservation: read version, yield, CAS, retry on conflict. */
  async reserve() {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      this.expireLocks();
      const current = this.store.read();
      if (current.available === 0) return { ok: false, reason: 'OUT_OF_STOCK' };
      const token = this.tokenFactory();
      if (typeof token !== 'string' || !token ||
          Object.hasOwn(current.holds, token) || Object.hasOwn(current.purchases, token)) {
        return { ok: false, reason: 'DUPLICATE_OR_INVALID_TOKEN' };
      }
      const expiresAt = this.now() + this.ttlMs;
      const next = {
        ...current,
        available: current.available - 1,
        holds: { ...current.holds, [token]: { expiresAt, reservedAt: this.now() } }
      };
      // Intentionally yield so competing requests can race on the same revision.
      // A failed CAS is retried with a new snapshot; it never oversells.
      await Promise.resolve();
      // A slow dispatch must not commit a lock whose TTL elapsed while waiting.
      const committedAt = this.now();
      const committedExpiry = committedAt + this.ttlMs;
      next.holds[token] = { expiresAt: committedExpiry, reservedAt: committedAt };
      if (this.store.compareAndSwap(current.version, next)) {
        return { ok: true, token, expiresAt: committedExpiry, version: current.version + 1 };
      }
      this.conflictCount++;
    }
    return { ok: false, reason: 'CONFLICT_RETRY_LIMIT' };
  }

  async checkout(token) {
    if (typeof token !== 'string' || !token) return { ok: false, reason: 'INVALID_LOCK' };
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      // Evaluate expiry for THIS token before looking at the active holds map.
      const prior = this.store.read();
      if (Object.hasOwn(prior.purchases, token)) return { ok: true, alreadyCompleted: true, receipt: prior.purchases[token] };
      const previousHold = Object.hasOwn(prior.holds, token) ? prior.holds[token] : undefined;
      if (previousHold && this.now() >= previousHold.expiresAt) {
        this.expireLocks();
        return { ok: false, reason: 'LOCK_EXPIRED' };
      }
      this.expireLocks();
      const current = this.store.read();
      if (Object.hasOwn(current.purchases, token)) return { ok: true, alreadyCompleted: true, receipt: current.purchases[token] };
      const hold = Object.hasOwn(current.holds, token) ? current.holds[token] : undefined;
      if (!hold) return { ok: false, reason: 'LOCK_NOT_FOUND' };
      if (this.now() >= hold.expiresAt) {
        this.expireLocks();
        return { ok: false, reason: 'LOCK_EXPIRED' };
      }
      const receipt = { id: `demo-order-${token}`, purchasedAt: this.now() };
      const { [token]: ignored, ...otherHolds } = current.holds;
      const next = {
        ...current, holds: otherHolds, sold: current.sold + 1,
        purchases: { ...current.purchases, [token]: receipt }
      };
      await Promise.resolve();
      // A lock can expire while waiting: recheck absolute expiry before commit.
      if (this.now() >= hold.expiresAt) {
        this.expireLocks();
        return { ok: false, reason: 'LOCK_EXPIRED' };
      }
      if (this.store.compareAndSwap(current.version, next)) {
        return { ok: true, alreadyCompleted: false, receipt };
      }
      this.conflictCount++;
    }
    return { ok: false, reason: 'CONFLICT_RETRY_LIMIT' };
  }

  release(token) {
    this.expireLocks();
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const current = this.store.read();
      if (!Object.hasOwn(current.holds, token)) return { ok: false, reason: 'LOCK_NOT_FOUND' };
      const { [token]: ignored, ...otherHolds } = current.holds;
      const next = { ...current, holds: otherHolds, available: current.available + 1 };
      if (this.store.compareAndSwap(current.version, next)) return { ok: true };
      this.conflictCount++;
    }
    return { ok: false, reason: 'CONFLICT_RETRY_LIMIT' };
  }
}
