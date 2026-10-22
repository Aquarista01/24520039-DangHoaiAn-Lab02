import test from "node:test";
import assert from "node:assert/strict";
import { getGridView, PAGE_SIZE } from "./grid-model.js";

const data = [
  { id: 10, name: "Trang", department: "Ops" },
  { id: 2, name: "An", department: "Engineering" },
  { id: 7, name: "Binh", department: "Ops" },
  { id: 1, name: "Chi", department: "Finance" },
  { id: 4, name: "Dung", department: "Ops" },
  { id: 8, name: "Giang", department: "Engineering" }
];
const columns = [
  { header: "ID", accessorKey: "id", sortable: true },
  { header: "Name", accessorKey: "name", sortable: true },
  { header: "Department", accessorKey: "department", sortable: false }
];
const view = (overrides = {}) => ({
  query: "", sortKey: null, sortDir: "asc", page: 1, ...overrides
});

test("pagination returns five rows on page one and one on page two", () => {
  const first = getGridView(data, columns, view());
  const second = getGridView(data, columns, view({ page: 2 }));
  assert.equal(PAGE_SIZE, 5);
  assert.equal(first.rows.length, 5);
  assert.equal(first.pages, 2);
  assert.equal(second.rows.length, 1);
  assert.equal(second.first, 6);
});

test("sort numbers in ascending and descending order", () => {
  const asc = getGridView(data, columns, view({ sortKey: "id" }));
  const desc = getGridView(data, columns, view({ sortKey: "id", sortDir: "desc" }));
  assert.deepEqual(asc.rows.map(row => row.item.id), [1, 2, 4, 7, 8]);
  assert.deepEqual(desc.rows.map(row => row.item.id), [10, 8, 7, 4, 2]);
});

test("filter case-insensitively across all displayed columns", () => {
  const result = getGridView(data, columns, view({ query: "OPS" }));
  assert.equal(result.count, 3);
  assert.deepEqual(result.rows.map(row => row.item.name), ["Trang", "Binh", "Dung"]);
});

test("empty results and out-of-range page are safe", () => {
  const empty = getGridView(data, columns, view({ query: "nonexistent" }));
  assert.equal(empty.count, 0);
  assert.equal(empty.page, 1);
  assert.equal(empty.first, 0);
  const clamped = getGridView(data, columns, view({ page: 999 }));
  assert.equal(clamped.page, 2);
});

test("sorting does not change the source array", () => {
  const before = structuredClone(data);
  getGridView(data, columns, view({ sortKey: "name" }));
  assert.deepEqual(data, before);
});
