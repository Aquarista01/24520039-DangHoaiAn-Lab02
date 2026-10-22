# AI Failure Mode Audit — Homework 3

**Project:** UIT Lab 02, Flash-Sale Engine  
**Date reviewed:** 2026-10-22  
**Scope:** AI-generated draft of `inventory-engine.js`, tested against `inventory-engine.test.mjs`.  
**Evidence:** `audit-evidence/before-fix-node-tests.log` and `audit-evidence/after-fix-node-tests.log`.

These are **three genuine defects observed in an earlier AI-generated draft**, not hypothetical bugs or fabricated screenshots. Three added tests failed against that draft (24 passed, 3 failed). After correcting the source, the same complete suite passed (27 passed, 0 failed). The ZIP contains the corrected version, so reproducing the before-state requires temporarily applying the exact snippets shown below on a throwaway branch/copy. No one should commit intentionally faulty code as working production source. **The fixes below were applied in the prepared artifact by the AI assistant. The student should independently inspect and validate them; this document does not claim they personally authored a manual fix.**

## Finding 1: Expired reservation may be returned as successful after an async pause

- **File:** `inventory-engine.js`, `FlashSaleEngine.reserve()`.
- **Observed issue:** The draft computed the reservation expiry before an awaited microtask, then committed the stale expiry. A clock advance during the yield could cause a `reserve()` result whose deadline had already passed.
- **Old, defective pattern:**
  ```js
  const expiresAt = this.now() + this.ttlMs;
  // build next.holds[token] using expiresAt
  await Promise.resolve();
  if (this.store.compareAndSwap(current.version, next)) {
    return { ok: true, token, expiresAt };
  }
  ```
- **Risk:** An immediately expired lock may be advertised as valid; customer cannot meaningfully checkout. Timing/race bug.
- **Independent test:** `AI audit A: lock TTL must start at successful commit, not before an await`. Use an injected fake clock, call `reserve()`, move clock forward 1100 ms before its microtask resumes, then require a fresh expiry.
- **Observed before:** FAIL with `new lock must not already be expired on success` (see before-fix log).
- **Correction applied:** Recalculate `committedAt` and `committedExpiry` immediately after the await, update the candidate hold, then commit via CAS and return the new expiry.
- **Retest:** PASS (see after-fix log).

## Finding 2: Prototype properties treated as valid lock IDs

- **File:** `inventory-engine.js`, `release()` and `checkout()`.
- **Observed issue:** Reading `current.holds[token]` treated inherited properties like `toString` as existing entries when `holds` was a plain `{}` object.
- **Old, defective pattern:**
  ```js
  if (!current.holds[token]) return { ok: false, reason: 'LOCK_NOT_FOUND' };
  ```
- **Risk:** An invalid token could enter the mutation path and throw an invariant exception instead of being rejected predictably. The same pattern also affected purchase lookups.
- **Independent test:** `AI audit B: unknown prototype-named lock IDs must fail cleanly` checks `release('toString')` and `checkout('constructor')`.
- **Observed before:** FAIL due to inventory conservation invariant exception.
- **Correction applied:** Use `Object.hasOwn(current.holds, token)` and `Object.hasOwn(current.purchases, token)` before accessing keyed entries.
- **Retest:** PASS; both invalid IDs return `{ ok: false, reason: 'LOCK_NOT_FOUND' }`.

## Finding 3: Duplicate generated tokens caused an invariant exception

- **File:** `inventory-engine.js`, `FlashSaleEngine.reserve()`.
- **Observed issue:** The AI draft did not validate uniqueness of a token returned by the injectable token factory. A generator returning the same token twice overwrote the hold map entry while decreasing available stock twice.
- **Old, defective pattern:**
  ```js
  const token = this.tokenFactory();
  // No collision check before next.holds[token] = hold
  ```
- **Risk:** Unhandled exception during reservation and broken user experience. The invariant prevented overselling, but the operation was not safely rejected.
- **Independent test:** `AI audit C: duplicate token factory cannot crash or corrupt inventory` deliberately injects a constant token factory and issues two reservations.
- **Observed before:** FAIL with inventory conservation invariant exception.
- **Correction applied:** Reject empty, non-string, already held or already purchased tokens with `DUPLICATE_OR_INVALID_TOKEN` before preparing the next state.
- **Retest:** PASS; the second reservation fails cleanly and the invariant is preserved.

## Verification and evidence handling

Run from the repository root:

```bash
node --test homework3/*.test.mjs
```

Evidence collected in the prepared artifact:

| Check | Earlier draft | Corrected version |
|---|---|---|
| AI audit A (expiry) | Failed | Passed |
| AI audit B (prototype key) | Failed | Passed |
| AI audit C (duplicate token) | Failed | Passed |
| Full Node suite | 24 passed / 3 failed | 27 passed / 0 failed |

To produce personal submission evidence, run tests on your own laptop and capture Terminal screenshots. Do not substitute the provided logs for your own manual verification. No screenshot is claimed to exist for a test not actually run.

The browser smoke-test details appear in `audit-evidence/chromium-smoke-tests.txt`. True multi-client inventory safety is **not** provided by this frontend-only simulation. Implement a server-side atomic compare-and-swap/transaction over a shared database plus server-issued lock expirations to make that production guarantee.
