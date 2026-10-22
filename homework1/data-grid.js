import { createElement } from "../mini-react.js";
import { useState } from "../state.js";
import { getGridView, PAGE_SIZE } from "./grid-model.js";

const h = createElement;

/**
 * @template {Record<string, unknown>} T
 * @typedef {{
 *   header: string,
 *   accessorKey: keyof T,
 *   sortable?: boolean
 * }} ColumnDef
 */

/**
 * @template {Record<string, unknown>} T
 * @typedef {{
 *   data: T[],
 *   columns: ColumnDef<T>[],
 *   onRowSelect?: (item: T) => void,
 *   ariaLabel: string
 * }} DataGridProps
 */

/**
 * A keyboard-accessible, single-select data grid using the Lab 02 Mini-React.
 * @template {Record<string, unknown>} T
 * @param {DataGridProps<T>} props
 * @returns {Object} Mini-React VNode
 */
export function DataGrid({ data, columns, onRowSelect, ariaLabel }) {
  if (!Array.isArray(data) || !Array.isArray(columns) || !columns.length) {
    throw new TypeError("DataGrid requires data and nonempty columns arrays");
  }
  if (typeof ariaLabel !== "string" || !ariaLabel.trim()) {
    throw new TypeError("DataGrid requires an accessible name");
  }

  const [view, setView] = useState({
    query: "",
    sortKey: null,
    sortDir: "asc",
    page: 1,
    selectedIndex: null
  });

  const result = getGridView(data, columns, view);
  const selectable = typeof onRowSelect === "function";
  const chosen = data[view.selectedIndex] ?? null;

  function sortBy(key) {
    setView(current => ({
      ...current,
      sortKey: key,
      sortDir: current.sortKey === key && current.sortDir === "asc"
        ? "desc"
        : "asc",
      page: 1
    }));
  }

  function selectRow(sourceIndex) {
    if (!selectable) return;
    const selecting = view.selectedIndex !== sourceIndex;
    setView(current => ({
      ...current,
      selectedIndex: selecting ? sourceIndex : null
    }));
    if (selecting) onRowSelect(data[sourceIndex]);
  }

  function moveCell(event, row, col, rowStep, colStep) {
    event.preventDefault();
    const table = event.target.closest('[role="grid"]');
    if (!table) return;
    const nextRow = row + rowStep;
    const nextCol = col + colStep;
    if (nextRow < 0 || nextRow >= result.rows.length ||
        nextCol < 0 || nextCol >= columns.length) return;

    const next = [...table.querySelectorAll('[role="gridcell"][data-row]')]
      .find(cell => Number(cell.dataset.row) === nextRow &&
                    Number(cell.dataset.col) === nextCol);
    if (!next) return;
    const active = table.querySelector('[role="gridcell"][tabindex="0"]');
    if (active) active.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  }

  function handleCellKey(event, row, col, sourceIndex) {
    switch (event.key) {
      case "ArrowUp": return moveCell(event, row, col, -1, 0);
      case "ArrowDown": return moveCell(event, row, col, 1, 0);
      case "ArrowLeft": return moveCell(event, row, col, 0, -1);
      case "ArrowRight": return moveCell(event, row, col, 0, 1);
      case "Enter":
      case " ":
        if (selectable) {
          event.preventDefault();
          selectRow(sourceIndex);
        }
        return;
      default: return;
    }
  }

  const header = h("thead", null,
    h("tr", { role: "row", "aria-rowindex": "1" }, columns.map(column => {
      const isSorted = column.accessorKey === view.sortKey;
      const direction = isSorted
        ? view.sortDir === "asc" ? "ascending" : "descending"
        : "none";
      const label = column.header;
      return h("th", {
        scope: "col",
        role: "columnheader",
        ...(column.sortable ? { "aria-sort": direction } : {})
      }, column.sortable
        ? h("button", {
            type: "button",
            className: "sort-button",
            "data-focus-key": `sort:${String(column.accessorKey)}`,
            "aria-label": `Sort by ${label}${isSorted ? `, ${direction}` : ""}`,
            onClick: () => sortBy(column.accessorKey)
          }, label, h("span", { "aria-hidden": "true" }, isSorted
            ? view.sortDir === "asc" ? " ↑" : " ↓"
            : " ↕"))
        : label);
    }))
  );

  const bodyRows = result.rows.map(({ item, sourceIndex }, row) =>
    h("tr", {
      role: "row",
      "aria-rowindex": String((result.page - 1) * PAGE_SIZE + row + 2),
      className: selectable ? "selectable-row" : "",
      ...(selectable ? { "aria-selected": String(view.selectedIndex === sourceIndex) } : {})
    }, columns.map((column, col) =>
      h("td", {
        role: "gridcell",
        tabindex: row === 0 && col === 0 ? "0" : "-1",
        "data-row": String(row),
        "data-col": String(col),
        "data-focus-key": `cell:${sourceIndex}:${String(column.accessorKey)}`,
        onKeyDown: event => handleCellKey(event, row, col, sourceIndex),
        onClick: event => {
          const table = event.target.closest('[role="grid"]');
          const active = table?.querySelector('[role="gridcell"][tabindex="0"]');
          if (active) active.tabIndex = -1;
          event.target.tabIndex = 0;
          event.target.focus();
        }
      }, String(item[column.accessorKey] ?? ""))
    ))
  );

  const body = h("tbody", null,
    result.rows.length
      ? bodyRows
      : h("tr", { role: "row", "aria-rowindex": "2" },
          h("td", {
            role: "gridcell",
            colspan: String(columns.length),
            className: "empty-message"
          }, "No matching records. Clear the search to see all rows.")
        )
  );

  return h("section", { className: "grid-panel", "aria-label": "Directory controls" },
    h("div", { className: "toolbar" },
      h("div", { className: "search-field" },
        h("label", { htmlFor: "grid-search" }, "Search employees"),
        h("input", {
          id: "grid-search",
          type: "search",
          placeholder: "Name, department, status...",
          value: view.query,
          autocomplete: "off",
          "data-focus-key": "search",
          onInput: event => setView(current => ({
            ...current, query: event.target.value, page: 1
          }))
        })
      ),
      h("p", { className: "result-count", role: "status", "aria-live": "polite" },
        `Showing ${result.first}–${result.last} of ${result.count} matching records`
      )
    ),
    h("p", { id: "grid-help", className: "helper-text" },
      "Tab to enter the table. Use arrow keys to move between cells. " +
      (selectable ? "Press Enter to select a row; Space toggles selection. " : "") +
      "Use column-heading buttons to sort."
    ),
    h("div", { className: "table-scroll" },
      h("table", {
        role: "grid",
        "aria-label": ariaLabel,
        "aria-describedby": "grid-help",
        "aria-rowcount": String(Math.max(2, result.count + 1)),
        "aria-colcount": String(columns.length)
      }, header, body)
    ),
    h("div", { className: "grid-footer" },
      h("p", { className: "selection-note", "aria-live": "polite" },
        selectable
          ? chosen ? `Selected: ${String(chosen.name ?? "row " + (view.selectedIndex + 1))}` : "No row selected"
          : "Row selection disabled"
      ),
      h("nav", { className: "pagination", "aria-label": "Table pagination" },
        h("button", {
          type: "button", disabled: result.page <= 1,
          "data-focus-key": "page:prev",
          onClick: () => setView(current => ({
            ...current, page: Math.max(1, result.page - 1)
          }))
        }, "Previous"),
        h("span", { className: "page-label", "aria-live": "polite" },
          `Page ${result.page} of ${result.pages}`
        ),
        h("button", {
          type: "button", disabled: result.page >= result.pages,
          "data-focus-key": "page:next",
          onClick: () => setView(current => ({
            ...current, page: Math.min(result.pages, result.page + 1)
          }))
        }, "Next")
      )
    )
  );
}
