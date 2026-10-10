
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

- [ ] 7.1. Define event delegation contract.
- [ ] 7.2. Implement setupEventDelegation().
- [ ] 7.3. Support click, input, and keydown.
- [ ] 7.4. Connect DOM nodes with VNodes.
- [ ] 7.5. Extend renderToDOM() for delegation.
- [ ] 7.6. Prevent duplicate event listeners.
- [ ] 7.7. Verify dynamically created elements.
- [ ] 7.8. Verify Exercise 1 compatibility.
- [ ] 7.9. Create event delegation Git commit.

Commit: `feat(events): attach root event delegation listener`

## 8. Reactive Task Manager

- [ ] 8.1. Define TaskApp component contract.
- [ ] 8.2. Create TaskApp with initial tasks.
- [ ] 8.3. Implement Add Task.
- [ ] 8.4. Implement task completion toggle.
- [ ] 8.5. Implement All, Pending, and Done filters.
- [ ] 8.6. Implement reactive rendering pipeline.
- [ ] 8.7. Verify keyboard and input interactions.
- [ ] 8.8. Verify task count and DOM updates.
- [ ] 8.9. Create Task Manager Git commit.

Commit: `feat(ui): assemble reactive todo application`

## 9. Independent Verification

- [ ] 9.1. Test useState initialization and updates.
- [ ] 9.2. Test multiple Hooks and resetCursor.
- [ ] 9.3. Test Object.is() equality behavior.
- [ ] 9.4. Test root event delegation.
- [ ] 9.5. Test Add Task and completion toggles.
- [ ] 9.6. Test dynamic filters.
- [ ] 9.7. Verify DOM structure and event listeners.
- [ ] 9.8. Verify Exercise 1 compatibility.
- [ ] 9.9. Verify four Git milestone commits.
- [ ] 9.10. Push the project to GitHub.
- [ ] 9.11. Prepare final verification and demo.
