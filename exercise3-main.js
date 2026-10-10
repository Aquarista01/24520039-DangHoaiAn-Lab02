
import { renderToDOM } from "./mini-react.js";

import {
  setRenderer,
  resetCursor
} from "./state.js";

import {
  setupEventDelegation
} from "./delegation.js";

import {
  DataFeed,
  stopDataFeed
} from "./data-feed.js";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Mount target #app not found");
}

const cleanupDelegation = setupEventDelegation(root);

let disposed = false;

function renderApp() {
  if (disposed) {
    return;
  }

  resetCursor();

  const vnode = DataFeed();

  const dom = renderToDOM(vnode, {
    delegateEvents: true
  });

  root.replaceChildren(dom);
}

export function unmountExercise3() {
  if (disposed) {
    return;
  }

  disposed = true;

  stopDataFeed();
  cleanupDelegation();
  root.replaceChildren();
}

window.addEventListener(
  "pagehide",
  unmountExercise3,
  { once: true }
);

setRenderer(renderApp);

renderApp();

console.assert(
  root.querySelector("#data-feed") !== null,
  "DataFeed mount failed"
);

console.log("Exercise 3 mounted successfully");
