
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
