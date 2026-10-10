
/**
 * Root Event Delegation Hub
 *
 * Input: rootContainer - DOM Element
 * Output: cleanup function
 *
 * Events: click, input, keydown
 *
 * Invariants:
 * - One listener per event type at each root.
 * - No direct child listeners in delegation mode.
 * - Dynamic children use the same root listeners.
 */

const rootListeners = new WeakMap();

export function setupEventDelegation(rootContainer) {
  if (!(rootContainer instanceof Element)) {
    throw new TypeError("Root must be a DOM Element");
  }

  if (rootListeners.has(rootContainer)) {
    return rootListeners.get(rootContainer);
  }

  const eventTypes = {
    click: "onClick",
    input: "onInput",
    keydown: "onKeyDown"
  };

  function dispatchEvent(event) {
    const handlerName = eventTypes[event.type];
    let current = event.target;

    while (current && current !== rootContainer) {
      if (current instanceof Element) {
        const vnode = current.__vnode;
        const handler = vnode?.props?.[handlerName];

        if (typeof handler === "function") {
          handler(event);
          return;
        }
      }

      current = current.parentNode;
    }
  }

  Object.keys(eventTypes).forEach(eventType => {
    rootContainer.addEventListener(eventType, dispatchEvent);
  });

  const cleanup = () => {
    Object.keys(eventTypes).forEach(eventType => {
      rootContainer.removeEventListener(eventType, dispatchEvent);
    });

    rootListeners.delete(rootContainer);
  };

  rootListeners.set(rootContainer, cleanup);

  return cleanup;
}
