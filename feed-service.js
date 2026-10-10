
/**
 * Mock asynchronous data service.
 *
 * mode: "success" or "error"
 * delayMs: non-negative number (milliseconds)
 *
 * Returns: Promise<Item[]>
 */

export async function fetchFeed({
  mode = "success",
  delayMs = 1500
} = {}) {
  if (!["success", "error"].includes(mode)) {
    throw new TypeError("Unsupported request mode");
  }

  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new RangeError("Invalid request delay");
  }

  await new Promise(resolve => {
    setTimeout(resolve, delayMs);
  });

  if (mode === "error") {
    throw new Error(
      "Connection failed. Please try again."
    );
  }

  return [
    {
      id: 1,
      title: "Review PR",
      description: "Review pending code changes."
    },
    {
      id: 2,
      title: "Verify AST",
      description: "Validate the generated syntax tree."
    },
    {
      id: 3,
      title: "Check Event Delegation",
      description: "Confirm root listeners work correctly."
    }
  ];
}
