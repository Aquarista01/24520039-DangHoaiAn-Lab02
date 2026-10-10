
/**
 * @typedef {Object} VNode
 * @property {string | Function} type
 * @property {VNodeProps} props
 */

/**
 * @typedef {Object} VNodeProps
 * @property {VNode[]} children
 * @property {string} [nodeValue]
 */

/*
VNode Contract:

1. Every VNode is a plain JavaScript object.
2. Every VNode contains type and props.
3. props.children is always an array.
4. Text nodes use type: "TEXT_ELEMENT".
5. Text node values are stored as strings.
6. Existing input objects must not be mutated.
7. HTML attributes and event handlers are stored in props.
*/


/**
 * Contract: createTextElement(text)
 *
 * Input:
 * - text: string | number
 *
 * Output:
 * - A TEXT_ELEMENT VNode object
 *
 * Preconditions:
 * - Input must be a string or number.
 *
 * Postconditions:
 * - type is "TEXT_ELEMENT".
 * - props.nodeValue is String(text).
 * - props.children is an empty array.
 *
 * Invariants:
 * - The VNode structure remains consistent.
 * - No input data is mutated.
 *
 * Edge cases:
 * - Empty string: ""
 * - Zero: 0
 * - Negative number: -5
 *
 * Verification:
 * - Check the returned VNode structure.
 * - Check text and number conversion.
 * - Verify children is an empty array.
 */

export function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: String(text),
      children: []
    }
  };
}

/**
 * Contract: createElement(type, props, ...children)
 *
 * Input:
 * - type: string | Function
 * - props: Object | null | undefined
 * - children: nested arrays, VNodes, strings, numbers,
 *   null, undefined, or false
 *
 * Output:
 * - A new VNode object
 *
 * Preconditions:
 * - type must be a valid element type.
 * - Children must use supported data types.
 *
 * Postconditions:
 * - The returned VNode contains type and props.
 * - props.children is an array of VNodes.
 * - Primitive strings and numbers become TEXT_ELEMENT nodes.
 *
 * Invariants:
 * - Nested children arrays are fully flattened.
 * - null, undefined, and false children are removed.
 * - Existing VNodes are preserved.
 * - Input props and children are not mutated.
 *
 * Edge cases:
 * - null props
 * - No children
 * - Empty children arrays
 * - Deeply nested children arrays
 * - Empty strings and zero
 * - Existing VNode children
 *
 * Verification:
 * - Verify VNode structure.
 * - Verify nested array flattening.
 * - Verify filtering and primitive conversion.
 * - Verify that input data remains unchanged.
 */

export function createElement(type, props, ...children) {
  const normalizedChildren = children
    .flat(Infinity)
    .filter(child => child !== null &&
                     child !== undefined &&
                     child !== false)
    .map(child => {
      if (typeof child === "string" ||
          typeof child === "number") {
        return createTextElement(child);
      }

      if (child && typeof child === "object" &&
          "type" in child && "props" in child) {
        return child;
      }

      throw new TypeError("Unsupported child type");
    });

  return {
    type,
    props: {
      ...(props || {}),
      children: normalizedChildren
    }
  };
}

/**
 * Contract: renderToDOM(vnode)
 *
 * Input:
 * - vnode: a valid VNode object
 *
 * Output:
 * - A real DOM Node
 *
 * Preconditions:
 * - vnode contains type and props.
 * - props.children is an array.
 * - The vnode type is supported by the renderer.
 *
 * Postconditions:
 * - TEXT_ELEMENT creates a Text node.
 * - HTML element types create HTML elements.
 * - Supported attributes are applied correctly.
 * - Event listeners are registered.
 * - All child nodes are rendered recursively.
 * - The resulting DOM node is returned.
 *
 * Invariants:
 * - Input VNodes are not mutated.
 * - Child nodes preserve their original order.
 * - Text content is never interpreted as HTML.
 *
 * Edge cases:
 * - Empty children array
 * - Nested VNodes
 * - Text-only VNode
 * - No attributes
 * - className and style attributes
 * - Event handlers
 * - Malformed VNodes
 * - Potential XSS text
 *
 * Verification:
 * - Verify text rendering.
 * - Verify HTML element rendering.
 * - Verify attributes and style.
 * - Verify recursive child rendering.
 * - Verify event listeners.
 * - Verify XSS prevention.
 * - Verify that VNodes remain unchanged.
 */


export function renderToDOM(vnode, options = {}) {
  const { delegateEvents = false } = options;

  if (
    !vnode ||
    typeof vnode !== "object" ||
    !vnode.props ||
    !Array.isArray(vnode.props.children)
  ) {
    throw new TypeError("Invalid VNode");
  }

  if (vnode.type === "TEXT_ELEMENT") {
    if (typeof vnode.props.nodeValue !== "string") {
      throw new TypeError("Invalid text node value");
    }

    return document.createTextNode(vnode.props.nodeValue);
  }

  if (typeof vnode.type !== "string") {
    throw new TypeError("Unsupported VNode type");
  }

  const dom = document.createElement(vnode.type);

  if (delegateEvents) {
    dom.__vnode = vnode;
  }

  Object.entries(vnode.props).forEach(([key, value]) => {
    if (key === "children" || key === "nodeValue") {
      return;
    }

    if (/^on/i.test(key)) {
      if (
        value === null ||
        value === undefined ||
        value === false
      ) {
        return;
      }

      if (typeof value !== "function") {
        throw new TypeError("Event handler must be a function");
      }

      const eventName = key.slice(2).toLowerCase();

      if (!eventName) {
        throw new TypeError("Invalid event name");
      }

      if (delegateEvents) {
        if (!["click", "input", "keydown"].includes(eventName)) {
          throw new TypeError("Unsupported delegated event");
        }
      } else {
        dom.addEventListener(eventName, value);
      }

      return;
    }

    if (
      value === null ||
      value === undefined ||
      value === false
    ) {
      return;
    }

    if (key === "className") {
      dom.setAttribute("class", String(value));
    } else if (key === "style") {
      if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
      ) {
        throw new TypeError("Invalid style object");
      }

      Object.assign(dom.style, value);
    } else if (
      key === "innerHTML" ||
      key === "outerHTML" ||
      key === "srcdoc"
    ) {
      return;
    } else if (
      ["href", "src", "xlink:href"].includes(key) &&
      /^\s*javascript:/i.test(String(value))
    ) {
      throw new TypeError("Unsafe URL attribute");
    } else {
      dom.setAttribute(key, String(value));
    }
  });

  vnode.props.children.forEach(child => {
    const childDOM = renderToDOM(child, options);
    dom.appendChild(childDOM);
  });

  return dom;
}
