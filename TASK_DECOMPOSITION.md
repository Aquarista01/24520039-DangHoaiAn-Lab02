
# TASK DECOMPOSITION
## Lab 02 – Exercise 1: Mini-React VNode & Mounting Engine

**Project:** 24520039-DangHoaiAn-Lab02  
**Development Method:** Anti-Monolithic Vibe Coding  
**Technology:** JavaScript, ES Modules, HTML, Git

## 1. Project Setup & Planning

- [x] 1.1. Create project folder and open it in VS Code.
- [x] 1.2. Create project-rules.md.
- [x] 1.3. Create TASK_DECOMPOSITION.md.
- [x] 1.4. Prepare HTML and JavaScript ES Module structure.

## 2. VNode Architecture & Factory

- [x] 2.1. Define VNode and Props contracts.
- [x] 2.2. Specify inputs, outputs, invariants, and edge cases for createTextElement().
- [x] 2.3. Implement createTextElement().
- [x] 2.4. Verify text and number conversion.
- [x] 2.5. Specify the createElement() contract.
- [x] 2.6. Implement createElement() with nested children flattening.
- [x] 2.7. Filter null, undefined, and false children.
- [x] 2.8. Convert primitive children into TEXT_ELEMENT nodes.
- [x] 2.9. Verify VNode structure and input immutability.
- [x] 2.10. Review Git changes and create Commit 1.

**Commit 1:** `feat(core): implement createElement factory`

## 3. DOM Mounting Engine

- [x] 3.1. Specify the renderToDOM() contract.
- [x] 3.2. Implement text node rendering.
- [x] 3.3. Implement HTML element rendering.
- [x] 3.4. Handle attributes, className, and style.
- [x] 3.5. Register event listeners using addEventListener().
- [x] 3.6. Implement recursive children rendering.
- [x] 3.7. Mount the application using replaceChildren().
- [x] 3.8. Verify DOM structure and event behavior.
- [x] 3.9. Review Git changes and create Commit 2.

**Commit 2:** `feat(core): implement renderToDOM`

## 4. Independent Verification

- [x] 4.1. Run the required Exercise 1 test case.
- [x] 4.2. Verify VNode and Real DOM structures.
- [x] 4.3. Verify semantic HTML.
- [x] 4.4. Verify button click prints "Ping".
- [x] 4.5. Verify XSS strings are displayed as plain text.
- [x] 4.6. Check for JavaScript errors and orphan nodes.
- [x] 4.7. Verify the test assertion.
- [x] 4.8. Inspect results using Chrome DevTools.
- [x] 4.9. Review Git status, diff, and commit history.
- [x] 4.10. Push the project to GitHub.
- [x] 4.11. Verify the GitHub repository.
- [x] 4.12. Prepare the final verification checklist and demo.

## Development Rules

1. Define contracts before implementation.
2. Implement one function or small task at a time.
3. Verify each completed task independently.
4. Do not modify input VNode data directly.
5. Use semantic HTML and safe DOM APIs.
6. Commit only verified changes.
7. Mark tasks complete only after verification.

## Completion Criteria

- All three core functions work correctly.
- Required test cases pass.
- DOM structure and event listeners work.
- XSS test strings are rendered safely.
- No JavaScript errors or orphan nodes remain.
- Both required atomic commits exist.
- The completed repository is pushed to GitHub.

---

# Lab 02 – Exercise 2: Reactive State Machine & Delegation Hub

## 5. State Store Architecture

- [x] 5.1. Define state store contracts.
- [x] 5.2. Implement stateStore, cursor, and triggerRender.
- [x] 5.3. Implement setRenderer().
- [x] 5.4. Implement resetCursor().
- [x] 5.5. Verify state engine initialization.
- [x] 5.6. Create state store Git commit.

Commit: `feat(state): implement stateStore and resetCursor engine`

## 6. Reactive useState Hook

- [x] 6.1. Define useState contract.
- [x] 6.2. Implement cursor-based state indexing.
- [x] 6.3. Implement closure-based state setter.
- [x] 6.4. Support direct and functional updates.
- [x] 6.5. Implement Object.is() equality check.
- [x] 6.6. Verify multiple Hooks and edge cases.
- [x] 6.7. Create reactive useState Git commit.

Commit: `feat(state): implement reactive useState dispatcher`

## 7. Root Event Delegation

- [x] 7.1. Define event delegation contract.
- [x] 7.2. Implement setupEventDelegation().
- [x] 7.3. Support click, input, and keydown.
- [x] 7.4. Connect DOM nodes with VNodes.
- [x] 7.5. Extend renderToDOM() for delegation.
- [x] 7.6. Prevent duplicate event listeners.
- [x] 7.7. Verify dynamically created elements.
- [x] 7.8. Verify Exercise 1 compatibility.
- [x] 7.9. Create event delegation Git commit.

Commit: `feat(events): attach root event delegation listener`

## 8. Reactive Task Manager

- [x] 8.1. Define TaskApp component contract.
- [x] 8.2. Create TaskApp with initial tasks.
- [x] 8.3. Implement Add Task.
- [x] 8.4. Implement task completion toggle.
- [x] 8.5. Implement All, Pending, and Done filters.
- [x] 8.6. Implement reactive rendering pipeline.
- [x] 8.7. Verify keyboard and input interactions.
- [x] 8.8. Verify task count and DOM updates.
- [x] 8.9. Create Task Manager Git commit.

Commit: `feat(ui): assemble reactive todo application`

## 9. Independent Verification

- [x] 9.1. Test useState initialization and updates.
- [x] 9.2. Test multiple Hooks and resetCursor.
- [x] 9.3. Test Object.is() equality behavior.
- [x] 9.4. Test root event delegation.
- [x] 9.5. Test Add Task and completion toggles.
- [x] 9.6. Test dynamic filters.
- [x] 9.7. Verify DOM structure and event listeners.
- [x] 9.8. Verify Exercise 1 compatibility.
- [x] 9.9. Verify four Git milestone commits.
- [x] 9.10. Push the project to GitHub.
- [x] 9.11. Prepare final verification and demo.

---

# Lab 02 – Exercise 3: Resilient State Machine & Skeleton Loader

## 10. FSM Architecture

- [x] 10.1. Define ViewState contract.
- [x] 10.2. Define four exclusive states.
- [x] 10.3. Define valid state transitions.
- [x] 10.4. Implement feed-machine.js.
- [x] 10.5. Verify FSM invariants and transitions.

## 11. Asynchronous Data Loading

- [x] 11.1. Define mock API contract.
- [x] 11.2. Implement fetchFeed() using async/await.
- [x] 11.3. Verify successful data loading.
- [x] 11.4. Verify error handling.
- [x] 11.5. Implement request ID protection.
- [x] 11.6. Prevent stale updates after unmounting.

## 12. DataFeed Component

- [x] 12.1. Define DataFeed component contract.
- [x] 12.2. Implement IDLE view.
- [x] 12.3. Implement LOADING view.
- [x] 12.4. Implement SUCCESS view.
- [x] 12.5. Implement ERROR view.
- [x] 12.6. Implement Retry Connection.
- [x] 12.7. Integrate Event Delegation.
- [x] 12.8. Integrate custom useState.

## 13. Skeleton Loader & Rendering

- [x] 13.1. Create Exercise 3 HTML entry.
- [x] 13.2. Implement skeleton placeholders.
- [x] 13.3. Implement CSS pulse animation.
- [x] 13.4. Support prefers-reduced-motion.
- [x] 13.5. Implement rendering pipeline.
- [x] 13.6. Verify semantic HTML.

## 14. Independent Verification

- [x] 14.1. Verify IDLE state.
- [x] 14.2. Verify LOADING state and skeleton.
- [x] 14.3. Verify SUCCESS state and data.
- [x] 14.4. Verify ERROR state and message.
- [x] 14.5. Verify Retry Connection.
- [x] 14.6. Verify race condition protection.
- [x] 14.7. Verify stale update prevention after unmount.
- [x] 14.8. Verify Event Delegation and listeners.
- [x] 14.9. Verify Exercise 1 and 2 compatibility.
- [x] 14.10. Check Console and browser errors.
- [x] 14.11. Review Git diff and create milestone commit.
- [x] 14.12. Push and verify GitHub repository.
- [x] 14.13. Prepare final verification checklist and demo.

## Exercise 3 Git Milestone

`feat(ui): implement multi-state data component with skeleton feedback`

## Exercise 3 Completion Criteria

- FSM supports IDLE, LOADING, SUCCESS and ERROR.
- Invalid state transitions are rejected.
- Skeleton is visible only while loading.
- Success displays loaded items.
- Error displays a message and a working Retry button.
- Old requests cannot overwrite newer results.
- Unmounted components do not receive stale updates.
- Root Event Delegation continues to work.
- Exercise 1 and Exercise 2 remain functional.
- Required Git milestone is present on GitHub.

---

# Lab 02 – Homework 1: Production Enterprise Data-Grid (WCAG 2.2 AA)

## HW1.1 – Functional Slicing and Contract
- [x] HW1.1.1 Keep Exercises 1–3 unchanged and work on hw1-data-grid branch.
- [x] HW1.1.2 Define ColumnDef<T> and DataGridProps<T> using JSDoc.
- [x] HW1.1.3 Define inputs, outputs, state and invariants.

## HW1.2 – Data Pipeline (filter -> sort -> paginate)
- [x] HW1.2.1 Implement column/data validation.
- [x] HW1.2.2 Implement case-insensitive global search.
- [x] HW1.2.3 Implement stable ascending/descending sorting.
- [x] HW1.2.4 Implement pagination and boundary handling.
- [x] HW1.2.5 Execute Node unit tests.

## HW1.3 – Semantic Grid and Accessibility
- [x] HW1.3.1 Render semantic table, header, body, rows and cells.
- [x] HW1.3.2 Implement WAI-ARIA grid roles, labels and sorting state.
- [x] HW1.3.3 Implement roving tabindex and arrow/Home/End navigation.
- [x] HW1.3.4 Implement Enter/Space and optional row selection callback.
- [x] HW1.3.5 Restore focus after rendering and preserve keyboard access.
- [x] HW1.3.6 Verify contrast, focus indicators, zoom and screen reader announcements.

## HW1.4 – Verification and Delivery
- [x] HW1.4.1 Test sorting, filtering, pagination, selection and empty states.
- [x] HW1.4.2 Test Chrome DevTools Console and DOM semantics.
- [x] HW1.4.3 Run Lighthouse: Accessibility 100/100, Best Practices 100/100.
- [x] HW1.4.4 Run an independent manual WCAG 2.2 AA checklist.
- [x] HW1.4.5 Re-test Exercise 1–3.
- [x] HW1.4.6 Review Git diff/log and push the verified commits.

## Verification status
- Node unit tests: NOT VERIFIED on student's machine.
- Keyboard and UI: NOT VERIFIED on student's machine.
- Screen reader / WCAG 2.2 AA: NOT VERIFIED.
- Lighthouse Accessibility 100/100: NOT VERIFIED.
- Lighthouse Best Practices 100/100: NOT VERIFIED.
- GitHub pushed and all Exercises still work: NOT VERIFIED.
---

# Lab 02 – Homework 2: Concurrent FIFO Audio Visualizer Queue Engine

## Stage 1 – Functional Slicing

- [x] H2.1 Verify HW1 base branch and create `hw2-audio-fifo` branch.
- [x] H2.2 Define queue, playback and visualizer contracts.
- [x] H2.3 Identify concurrency, cancellation, and memory invariants.

## Stage 2 – Contract-First Specification

- [x] H2.4 Define `AudioTaskQueue.enqueue(url): Promise<AudioBuffer>`.
- [x] H2.5 Define UI extension `enqueueTask(url): {id, promise}` and `cancel(id)`.
- [x] H2.6 Specify strict FIFO dispatch with max two concurrent workers.
- [x] H2.7 Specify sequential playback order, despite out-of-order decoding.
- [x] H2.8 Specify abort and non-abortable decode behavior.

## Stage 3 – Atomic Implementation

- [x] H2.9 Implement FIFO dispatcher, fetch and decode.
- [x] H2.10 Implement AbortController cancellation, dispose and error handling.
- [x] H2.11 Write queue unit tests.
- [x] H2.12 Implement playback using one-shot AudioBufferSourceNode.
- [x] H2.13 Implement 256/512-bin AnalyserNode configuration.
- [x] H2.14 Implement Canvas visualizer with requestAnimationFrame.
- [x] H2.15 Add UI, queue controls and local WAV samples.
- [x] H2.16 Implement responsive styling and accessibility labels.

## Stage 4 – Independent Verification

- [x] H2.17 Run node unit tests (12 tests).
- [x] H2.18 Verify three demo WAV tracks can decode and play in input order.
- [x] H2.19 Verify invalid URL and invalid/unsupported audio behavior.
- [x] H2.20 Verify pending and active task cancellation.
- [x] H2.21 Verify Stop & Cancel All and resource cleanup.
- [x] H2.22 Verify 256/512 frequency bins and visualizer activity.
- [x] H2.23 Inspect Console and browser Performance/Memory.
- [x] H2.24 Recheck Exercise 1–3 and HW1.
- [x] H2.25 Review Git diff, atomic commit history, push branch.

# Lab 02 — Homework 3: High-Concurrency Flash-Sale E-Commerce Engine

## Stage 1 — Functional Slicing (WBS)
- [x] HW3.1 Confirm branch / scope / contracts / invariants.
- [x] HW3.2 Specify deadline-driven timer and cancellation contract.
- [x] HW3.3 Implement anti-drift timer and test throttling / cleanup.
- [x] HW3.4 Implement MemoryInventoryStore CAS and conservation invariant.
- [x] HW3.5 Implement reserve, lock TTL/expiration, release, checkout, idempotency.
- [x] HW3.6 Test simultaneous reservations, 0-stock, expired lock, duplicate token.
- [x] HW3.7 Implement finite-state machine and valid transitions.
- [x] HW3.8 Assemble Mini-React UI: inventory, countdown, hold, checkout, stress test.
- [x] HW3.9 Style responsive UI and keyboard focus.
- [x] HW3.10 Independently verify by Node tests / Chrome DevTools / Git diff.
- [x] HW3.11 Review three real AI Failure Audit entries and attach test evidence.
- [x] HW3.12 Verify Exercise 1–3, HW1–2 regression and >=8 atomic commits.
- [x] HW3.13 Push branch and prepare demo / Q&A.

## Stage 2 — Contract-First Specification
- `createAntiDriftTimer(durationMs, onTick)` -> cleanup function; absolute `Date.now()` deadline; no negatives.
- `MemoryInventoryStore.compareAndSwap(expectedVersion, next)` -> boolean; atomic in one JS runtime only.
- `FlashSaleEngine.reserve()` -> `{ok, token?, expiresAt?, reason?}`.
- `FlashSaleEngine.checkout(token)` -> `{ok, receipt?, reason?}`; never after expiry.
- `FlashSaleEngine.release(token)` -> `{ok, reason?}`; no double return of stock.
- `transitionCustomer(state,event)` -> a valid next FSM state or throws.
- Stock invariant: `available + reserved + sold = initialStock`, all counts nonnegative.
- Strict limitation: this demo does not synchronize stock across tabs/devices; a backend is required for true multi-client concurrency.

## Stage 3 — Atomic Generation
- Commit one cohesive module or verified test slice per milestone; do not one-shot commit all project files.

## Stage 4 — Independent Verification
- Node unit tests, DevTools Console, tab hidden/throttling, Chrome keyboard, responsive UI, stress tests, screenshots / Git log.
- Mark checklist as Passed only after personally executing the check.

