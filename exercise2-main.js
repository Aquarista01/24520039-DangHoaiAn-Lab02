
import { renderToDOM } from "./mini-react.js";
import { setRenderer, resetCursor } from "./state.js";
import { setupEventDelegation } from "./delegation.js";
import { TaskApp } from "./task-app.js";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Mount target #app not found");
}

setupEventDelegation(root);

function renderApp() {
  const active = document.activeElement;

  const focusKey =
    active && root.contains(active)
      ? active.dataset.focusKey
      : null;

  const selectionStart =
    focusKey && typeof active.selectionStart === "number"
      ? active.selectionStart
      : null;

  const selectionEnd =
    focusKey && typeof active.selectionEnd === "number"
      ? active.selectionEnd
      : null;

  resetCursor();

  const vnode = TaskApp();

  const newDOM = renderToDOM(vnode, {
    delegateEvents: true
  });

  root.replaceChildren(newDOM);

  if (focusKey) {
    const replacement = root.querySelector(
      `[data-focus-key="${focusKey}"]`
    );

    if (replacement) {
      replacement.focus();

      if (
        selectionStart !== null &&
        selectionEnd !== null &&
        typeof replacement.setSelectionRange === "function"
      ) {
        replacement.setSelectionRange(
          selectionStart,
          selectionEnd
        );
      }
    }
  }
}

setRenderer(renderApp);
renderApp();

console.assert(
  root.querySelector("#task-app") !== null,
  "TaskApp mount failed"
);

console.log("Exercise 2 mounted successfully");
