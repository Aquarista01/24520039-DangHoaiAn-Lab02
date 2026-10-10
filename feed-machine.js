/**
 * ViewState:
 * IDLE    -> { status: "IDLE" }
 * LOADING -> { status: "LOADING" }
 * SUCCESS -> { status: "SUCCESS", data: Item[] }
 * ERROR   -> { status: "ERROR", error: string }
 *
 * Events:
 * LOAD, RESOLVE, REJECT
 */

export const INITIAL_VIEW_STATE = Object.freeze({
  status: "IDLE"
});

const validStatuses = new Set([
  "IDLE",
  "LOADING",
  "SUCCESS",
  "ERROR"
]);

export function transition(state, event) {
  if (!state || !validStatuses.has(state.status)) {
    throw new TypeError("Invalid current state");
  }

  if (!event || typeof event.type !== "string") {
    throw new TypeError("Invalid state event");
  }

  switch (event.type) {
    case "LOAD":
      return { status: "LOADING" };

    case "RESOLVE":
      if (state.status !== "LOADING") {
        throw new Error("RESOLVE requires LOADING state");
      }

      if (!Array.isArray(event.data)) {
        throw new TypeError("Success data must be an array");
      }

      return {
        status: "SUCCESS",
        data: event.data
      };

    case "REJECT":
      if (state.status !== "LOADING") {
        throw new Error("REJECT requires LOADING state");
      }

      return {
        status: "ERROR",
        error: String(event.error ?? "Unknown error")
      };

    default:
      throw new Error("Unsupported state event");
  }
}
