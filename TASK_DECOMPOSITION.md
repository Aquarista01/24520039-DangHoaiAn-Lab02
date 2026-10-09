
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

- [ ] 3.1. Specify the renderToDOM() contract.
- [ ] 3.2. Implement text node rendering.
- [ ] 3.3. Implement HTML element rendering.
- [ ] 3.4. Handle attributes, className, and style.
- [ ] 3.5. Register event listeners using addEventListener().
- [ ] 3.6. Implement recursive children rendering.
- [ ] 3.7. Mount the application using replaceChildren().
- [ ] 3.8. Verify DOM structure and event behavior.
- [ ] 3.9. Review Git changes and create Commit 2.

**Commit 2:** `feat(core): implement renderToDOM`

## 4. Independent Verification

- [ ] 4.1. Run the required Exercise 1 test case.
- [ ] 4.2. Verify VNode and Real DOM structures.
- [ ] 4.3. Verify semantic HTML.
- [ ] 4.4. Verify button click prints "Ping".
- [ ] 4.5. Verify XSS strings are displayed as plain text.
- [ ] 4.6. Check for JavaScript errors and orphan nodes.
- [ ] 4.7. Verify the test assertion.
- [ ] 4.8. Inspect results using Chrome DevTools.
- [ ] 4.9. Review Git status, diff, and commit history.
- [ ] 4.10. Push the project to GitHub.
- [ ] 4.11. Verify the GitHub repository.
- [ ] 4.12. Prepare the final verification checklist and demo.

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
