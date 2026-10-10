
/**
 * State Store Contract
 *
 * stateStore: stores Hook values by index.
 * cursor: identifies the current Hook position.
 * triggerRender: callback that rerenders the application.
 */

let stateStore = [];
let cursor = 0;
let triggerRender = () => {};

/**
 * Input: rerenderFn - function
 * Output: undefined
 * Behavior: registers the application renderer.
 */
export function setRenderer(rerenderFn) {
  if (typeof rerenderFn !== "function") {
    throw new TypeError("Renderer must be a function");
  }

  triggerRender = rerenderFn;
}

/**
 * Input: none
 * Output: undefined
 * Behavior: resets the Hook index before rendering.
 */
export function resetCursor() {
  cursor = 0;
}
