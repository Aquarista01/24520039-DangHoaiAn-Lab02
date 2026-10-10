
import { createElement } from "./mini-react.js";
import { useState } from "./state.js";

import {
  INITIAL_VIEW_STATE,
  transition
} from "./feed-machine.js";

import { fetchFeed } from "./feed-service.js";

const h = createElement;

let latestRequestId = 0;
let mounted = true;
let setViewState = null;

/**
 * Request data and update the view state.
 *
 * Input: { mode, delayMs }
 * Output: Promise<void>
 *
 * Only the newest active request may update the UI.
 */
export async function requestFeed(options = {}) {
  if (!mounted || typeof setViewState !== "function") {
    return;
  }

  const requestId = ++latestRequestId;

  setViewState(current =>
    transition(current, { type: "LOAD" })
  );

  try {
    const items = await fetchFeed(options);

    if (!mounted || requestId !== latestRequestId) {
      return;
    }

    setViewState(current =>
      transition(current, {
        type: "RESOLVE",
        data: items
      })
    );
  } catch (error) {
    if (!mounted || requestId !== latestRequestId) {
      return;
    }

    const message = error instanceof Error
      ? error.message
      : String(error);

    setViewState(current =>
      transition(current, {
        type: "REJECT",
        error: message
      })
    );
  }
}

/**
 * Stop accepting asynchronous results.
 * Called when the DataFeed application is unmounted.
 */
export function stopDataFeed() {
  mounted = false;
  latestRequestId++;
  setViewState = null;
}

/**
 * Render one of four exclusive UI states.
 *
 * IDLE    -> Ready message
 * LOADING -> Skeleton Loader
 * SUCCESS -> Loaded items
 * ERROR   -> Error message and Retry button
 */
export function DataFeed() {
  const [viewState, updateViewState] =
    useState(INITIAL_VIEW_STATE);

  setViewState = updateViewState;

  let panel;

  switch (viewState.status) {
    case "IDLE":
      panel = h(
        "section",
        {
          className: "panel idle",
          "data-panel": "idle"
        },

        h("h2", null, "Ready to load"),

        h(
          "p",
          null,
          "Select Load Data to fetch sample items."
        )
      );
      break;

    case "LOADING":
      panel = h(
        "section",
        {
          className: "panel loading",
          "data-panel": "loading",
          role: "status",
          "aria-busy": "true"
        },

        h("h2", null, "Loading data..."),

        h(
          "ul",
          {
            className: "skeleton-list",
            "aria-label": "Loading placeholders"
          },

          [1, 2, 3].map(() =>
            h(
              "li",
              {
                className: "skeleton-item",
                "aria-hidden": "true"
              },

              h("span", {
                className: "skeleton skeleton-title"
              }),

              h("span", {
                className: "skeleton skeleton-line"
              })
            )
          )
        )
      );
      break;

    case "SUCCESS":
      panel = h(
        "section",
        {
          className: "panel success",
          "data-panel": "success"
        },

        h("h2", null, "Feed loaded successfully"),

        h(
          "ul",
          {
            id: "feed-list",
            className: "feed-list"
          },

          viewState.data.map(item =>
            h(
              "li",
              { "data-item-id": item.id },

              h("h3", null, item.title),
              h("p", null, item.description)
            )
          )
        )
      );
      break;

    case "ERROR":
      panel = h(
        "section",
        {
          className: "panel error",
          "data-panel": "error",
          role: "alert"
        },

        h("h2", null, "Unable to load data"),

        h(
          "p",
          { id: "error-message" },
          viewState.error
        ),

        h(
          "button",
          {
            id: "retry-button",
            type: "button",
            onClick: () =>
              requestFeed({ mode: "success" })
          },
          "Retry Connection"
        )
      );
      break;

    default:
      throw new Error("Unknown view state");
  }

  return h(
    "main",
    {
      id: "data-feed",
      className: "data-feed",
      "data-status": viewState.status
    },

    h(
      "header",
      null,

      h(
        "p",
        { className: "eyebrow" },
        "MINI-REACT ENGINE"
      ),

      h("h1", null, "Resilient Data Feed"),

      h(
        "p",
        { className: "subtitle" },
        "Four-state asynchronous UI with retry and race protection"
      )
    ),

    h(
      "section",
      {
        className: "controls",
        "aria-label": "Load controls"
      },

      h(
        "button",
        {
          id: "load-button",
          type: "button",
          onClick: () =>
            requestFeed({ mode: "success" })
        },
        "Load Data"
      ),

      h(
        "button",
        {
          id: "fail-button",
          type: "button",
          onClick: () =>
            requestFeed({ mode: "error" })
        },
        "Simulate Failure"
      )
    ),

    panel,

    h(
      "footer",
      null,
      "IDLE → LOADING → SUCCESS / ERROR"
    )
  );
}
