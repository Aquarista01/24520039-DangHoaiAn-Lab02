import { createElement, renderToDOM } from "../mini-react.js";
import { setRenderer, resetCursor } from "../state.js";
import { setupEventDelegation } from "../delegation.js";
import { DataGrid } from "./data-grid.js";

const h = createElement;
const root = document.getElementById("app");
if (!root) throw new Error("#app mount target missing");

const staff = [
  { id: 101, name: "An Nguyen", department: "Engineering", role: "Developer", city: "Da Nang", status: "Active" },
  { id: 102, name: "Binh Tran", department: "Operations", role: "Analyst", city: "Ho Chi Minh City", status: "Active" },
  { id: 103, name: "Chi Le", department: "Finance", role: "Accountant", city: "Ha Noi", status: "Inactive" },
  { id: 104, name: "Dung Pham", department: "Engineering", role: "Tester", city: "Da Nang", status: "Active" },
  { id: 105, name: "Giang Ho", department: "Marketing", role: "Designer", city: "Ha Noi", status: "Active" },
  { id: 106, name: "Hanh Vo", department: "Human Resources", role: "Recruiter", city: "Can Tho", status: "Inactive" },
  { id: 107, name: "Khanh Do", department: "Operations", role: "Coordinator", city: "Da Nang", status: "Active" },
  { id: 108, name: "Linh Bui", department: "Finance", role: "Controller", city: "Ha Noi", status: "Active" },
  { id: 109, name: "Minh Vu", department: "Engineering", role: "Developer", city: "Ho Chi Minh City", status: "Active" },
  { id: 110, name: "Nam Dang", department: "Marketing", role: "Specialist", city: "Can Tho", status: "Inactive" },
  { id: 111, name: "Oanh Ngo", department: "Engineering", role: "Architect", city: "Da Nang", status: "Active" },
  { id: 112, name: "Phuc Ly", department: "Human Resources", role: "Manager", city: "Ha Noi", status: "Active" },
  { id: 113, name: "Quynh Mai", department: "Operations", role: "Planner", city: "Ho Chi Minh City", status: "Active" }
];

const columns = [
  { header: "ID", accessorKey: "id", sortable: true },
  { header: "Full name", accessorKey: "name", sortable: true },
  { header: "Department", accessorKey: "department", sortable: true },
  { header: "Role", accessorKey: "role", sortable: false },
  { header: "City", accessorKey: "city", sortable: true },
  { header: "Status", accessorKey: "status", sortable: true }
];

const cleanupEvents = setupEventDelegation(root);

function App() {
  return h("main", { className: "page-shell" },
    h("header", { className: "page-header" },
      h("p", { className: "eyebrow" }, "UIT • LAB 02 • HOMEWORK 1"),
      h("h1", null, "Enterprise Data Grid"),
      h("p", { className: "lead" },
        "Accessible employee directory with sorting, search, pagination and keyboard selection."
      )
    ),
    DataGrid({ data: staff, columns,
      ariaLabel: "Employee directory data grid",
      onRowSelect: item => console.info("Row selected:", item)
    }),
    h("footer", { className: "page-footer" },
      "Built with Vanilla JavaScript and the Lab 02 Mini-React engine."
    )
  );
}

/** Replace DOM safely while retaining text-input caret and roving grid focus. */
function renderApp() {
  const focused = document.activeElement;
  const wasInside = !!focused && root.contains(focused);
  const oldKey = wasInside ? focused.dataset.focusKey : null;
  const oldRoving = root.querySelector('[role="gridcell"][tabindex="0"]')?.dataset.focusKey;
  let start = null;
  let end = null;
  if (focused && typeof focused.selectionStart === "number") {
    start = focused.selectionStart;
    end = focused.selectionEnd;
  }

  resetCursor();
  root.replaceChildren(renderToDOM(App(), { delegateEvents: true }));

  const focusables = [...root.querySelectorAll("[data-focus-key]")];
  const byKey = key => focusables.find(el => el.dataset.focusKey === key);
  const firstCell = root.querySelector('[role="gridcell"][data-row="0"][data-col="0"]');
  const newRoving = byKey(oldRoving) || firstCell;
  if (newRoving) {
    const defaultCell = root.querySelector('[role="gridcell"][tabindex="0"]');
    if (defaultCell) defaultCell.tabIndex = -1;
    newRoving.tabIndex = 0;
  }

  if (wasInside) {
    const replacement = byKey(oldKey);
    const target = replacement && !replacement.disabled ? replacement : newRoving;
    if (target) {
      target.focus();
      if (start !== null && end !== null &&
          typeof target.setSelectionRange === "function") {
        target.setSelectionRange(start, end);
      }
    }
  }
}

setRenderer(renderApp);
renderApp();

window.addEventListener("pagehide", event => {
  // A BFCache restore reuses this page, so do not dismantle it.
  if (event.persisted) return;
  cleanupEvents();
  root.replaceChildren();
});
console.info("HW1 data grid mounted successfully");
