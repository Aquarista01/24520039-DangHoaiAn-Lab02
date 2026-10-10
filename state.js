
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

/**
 * Custom useState Hook
 *
 * Input:
 * - initialValue: any supported state value
 *
 * Output:
 * - [currentState, setState]
 *
 * Invariants:
 * - Every Hook uses a stable cursor index.
 * - Existing state is preserved between renders.
 * - Object.is() prevents unnecessary rendering.
 *
 * Edge cases:
 * - 0, false, null, undefined, empty string
 * - Direct updates and functional updates
 */
export function useState(initialValue) {
  const index = cursor;
  cursor++;

  if (!(index in stateStore)) {
    stateStore[index] = initialValue;
  }

  const setState = (nextValue) => {
    const previousValue = stateStore[index];

    const updatedValue =
      typeof nextValue === "function"
        ? nextValue(previousValue)
        : nextValue;

    if (Object.is(previousValue, updatedValue)) {
      return;
    }

    stateStore[index] = updatedValue;
    triggerRender();
  };

  return [stateStore[index], setState];
}
