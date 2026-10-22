/**
 * Pure data operations for Homework 1. No DOM and no framework dependencies.
 * @template {Record<string, unknown>} T
 * @typedef {{ header: string, accessorKey: keyof T, sortable?: boolean }} ColumnDef
 */

export const PAGE_SIZE = 5;

/**
 * @template {Record<string, unknown>} T
 * @param {T[]} data
 * @param {ColumnDef<T>[]} columns
 * @param {{query: string, sortKey: keyof T | null, sortDir: 'asc'|'desc', page: number}} view
 * @returns {{rows: Array<{item: T, sourceIndex: number}>, count: number, pages: number, page: number, first: number, last: number}}
 */
export function getGridView(data, columns, view) {
  const query = (view.query ?? "").trim().toLocaleLowerCase();
  let rows = data.map((item, sourceIndex) => ({ item, sourceIndex }));

  if (query) {
    rows = rows.filter(({ item }) =>
      columns.some(column =>
        String(item[column.accessorKey] ?? "")
          .toLocaleLowerCase().includes(query)
      )
    );
  }

  const selectedColumn = columns.find(column =>
    column.accessorKey === view.sortKey && column.sortable
  );

  if (selectedColumn) {
    const collator = new Intl.Collator(undefined, {
      numeric: true, sensitivity: "base"
    });

    rows.sort((a, b) => {
      const left = a.item[selectedColumn.accessorKey];
      const right = b.item[selectedColumn.accessorKey];
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : collator.compare(String(left ?? ""), String(right ?? ""));

      return (view.sortDir === "desc" ? -comparison : comparison) ||
        a.sourceIndex - b.sourceIndex;
    });
  }

  const count = rows.length;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const requestedPage = Number.isFinite(view.page) ? Math.trunc(view.page) : 1;
  const page = Math.min(pages, Math.max(1, requestedPage));
  const offset = (page - 1) * PAGE_SIZE;

  return {
    rows: rows.slice(offset, offset + PAGE_SIZE),
    count,
    pages,
    page,
    first: count === 0 ? 0 : offset + 1,
    last: Math.min(count, offset + PAGE_SIZE)
  };
}
