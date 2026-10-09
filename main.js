
import {
  createElement,
  renderToDOM
} from "./mini-react.js";

const vApp = createElement(
  "main",
  { id: "root-view", role: "main" },

  createElement(
    "header",
    { className: "hero" },

    createElement(
      "h1",
      null,
      "Mini React Engine"
    ),

    createElement(
      "p",
      null,
      "<img onerror=alert(1)> Safe Text"
    )
  ),

  createElement(
    "section",
    null,

    createElement(
      "p",
      null,
      "<script>alert(1)</script>"
    ),

    createElement(
      "button",
      {
        onClick: () => console.log("Ping")
      },
      "Click"
    )
  )
);

const root = document.getElementById("app");

if (!root) {
  throw new Error("Mount target #app not found");
}

root.replaceChildren(renderToDOM(vApp));

console.assert(
  root.querySelector("button") !== null,
  "Mount Failed"
);

console.log("Mini-React mounted successfully");
