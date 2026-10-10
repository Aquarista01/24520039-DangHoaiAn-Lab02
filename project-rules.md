
# Project Rules – Lab 02 Exercise 1

## 1. Project Scope

- Project: Mini-React VNode & Mounting Engine.
- Use vanilla JavaScript with ES Modules.
- Do not use React or other Virtual DOM libraries.
- Implement only Exercise 1.
- Avoid unnecessary dependencies and files.

## 2. VNode Architecture

- Represent VNodes as plain JavaScript objects.
- Each VNode must contain `type` and `props`.
- Store children in `props.children`.
- Represent text nodes with `type: "TEXT_ELEMENT"`.
- Store text values in `props.nodeValue`.
- Do not mutate input props or children arrays.

## 3. Core Functions

### createTextElement(text)
- Accept text or numeric values.
- Convert values using `String(text)`.
- Return a TEXT_ELEMENT VNode with an empty children array.

### createElement(type, props, ...children)
- Use `props || {}` for missing props.
- Flatten nested children with `.flat(Infinity)`.
- Remove null, undefined, and false children.
- Convert primitive text and numbers into TEXT_ELEMENT VNodes.
- Preserve existing VNodes.
- Create a new props object without mutating the original.

### renderToDOM(vnode)
- Create text nodes using `document.createTextNode()`.
- Create HTML elements using `document.createElement()`.
- Handle HTML attributes, className, and style.
- Register events using `addEventListener()`.
- Recursively render children.
- Return the created DOM node.
- Mount the application using `replaceChildren()`.

## 4. JavaScript Standards

- Use `const` and `let`, never `var`.
- Use ES Modules with import/export.
- Avoid deprecated keyboard event properties.
- Do not use inline HTML event handlers.
- Keep functions small and readable.
- Use clear and consistent naming conventions.

## 5. HTML and Security

- Use semantic HTML elements.
- Avoid unnecessary div elements.
- Never insert untrusted text using innerHTML.
- Render text content using createTextNode().
- Verify that script and image injection strings remain plain text.
- Ensure the DOM contains no orphan nodes.

## 6. Development Workflow

Follow the four stages:

1. Functional Slicing
2. Contract-First Specification
3. Atomic Generation
4. Independent Verification

Before implementing each function:
- Define inputs and outputs.
- Identify data types and expected behavior.
- Specify invariants and edge cases.
- Define verification criteria.

Implement and test one function at a time.

## 7. Verification Rules

- Test VNode structures.
- Test nested children and filtering.
- Test recursive DOM rendering.
- Test HTML attributes and event listeners.
- Test XSS prevention.
- Inspect the DOM using Chrome DevTools.
- Check browser Console for errors.
- Review changes using Git diff.
- Do not mark unverified requirements as Passed.

## 8. Git Rules

Use two required atomic commits:

1. feat(core): implement createElement factory
2. feat(core): implement renderToDOM

- Check git status before staging.
- Review git diff before committing.
- Stage only files relevant to each milestone.
- Verify commit history using git log.
- Push the completed project to GitHub.

---

## 9. Exercise 2 - Reactive State Engine

- Preserve all Exercise 1 functionality.
- Implement custom useState using a stateStore and cursor.
- Reset the cursor before each component render.
- Store setters as closures over their Hook indices.
- Use Object.is() to skip unchanged state updates.
- Follow the Rules of Hooks.
- Use root event delegation for Exercise 2.
- Delegate click, input, and keydown events.
- Do not attach child event listeners in delegation mode.
- Prevent duplicate root event listeners.
- Use unidirectional data flow.
- Use replaceChildren() for the simple rendering pipeline.
- Verify Exercise 1 and Exercise 2 independently.
- Commit each Exercise 2 milestone separately.
