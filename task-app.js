
import { createElement } from "./mini-react.js";
import { useState } from "./state.js";

const h = createElement;

export function TaskApp() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review PR", done: false },
    { id: 2, title: "Verify AST", done: false }
  ]);

  const [filter, setFilter] = useState("ALL");
  const [draft, setDraft] = useState("");

  const completedCount = tasks.filter(task => task.done).length;
  const pendingCount = tasks.length - completedCount;

  function addTask() {
    const title = draft.trim();

    if (!title) {
      return;
    }

    setTasks(current => {
      const nextId = Math.max(
        0,
        ...current.map(task => task.id)
      ) + 1;

      return [
        ...current,
        { id: nextId, title, done: false }
      ];
    });

    setDraft("");
  }

  function toggleTask(id) {
    setTasks(current =>
      current.map(task =>
        task.id === id
          ? { ...task, done: !task.done }
          : task
      )
    );
  }

  const visibleTasks = tasks.filter(task => {
    if (filter === "PENDING") return !task.done;
    if (filter === "DONE") return task.done;
    return true;
  });

  const filters = [
    { key: "ALL", label: `All (${tasks.length})` },
    { key: "PENDING", label: `Pending (${pendingCount})` },
    { key: "DONE", label: `Done (${completedCount})` }
  ];

  return h(
    "main",
    { className: "task-app", id: "task-app" },

    h(
      "header",
      { className: "app-header" },

      h("p", { className: "eyebrow" }, "MINI-REACT ENGINE"),

      h("h1", null, "Task Manager"),

      h(
        "p",
        { id: "task-count", className: "summary" },
        `Tasks: ${tasks.length} · Completed: ${completedCount}`
      )
    ),

    h(
      "section",
      { className: "new-task", "aria-label": "Add new task" },

      h(
        "label",
        { htmlFor: "task-input" },
        "New Task"
      ),

      h(
        "div",
        { className: "input-row" },

        h("input", {
          id: "task-input",
          type: "text",
          placeholder: "Enter a task...",
          value: draft,
          "data-focus-key": "task-input",
          onInput: event => setDraft(event.target.value),
          onKeyDown: event => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTask();
            }
          }
        }),

        h(
          "button",
          {
            id: "add-task",
            type: "button",
            onClick: addTask
          },
          "Add Task"
        )
      )
    ),

    h(
      "section",
      { className: "filters-section" },

      h("h2", null, "Filter Tasks"),

      h(
        "nav",
        { className: "filters", "aria-label": "Task filters" },

        filters.map(item =>
          h(
            "button",
            {
              type: "button",
              className: filter === item.key
                ? "filter active"
                : "filter",
              "aria-pressed": String(filter === item.key),
              "data-filter": item.key,
              onClick: () => setFilter(item.key)
            },
            item.label
          )
        )
      )
    ),

    h(
      "section",
      { className: "tasks-section" },

      h(
        "h2",
        null,
        `Visible Tasks: ${visibleTasks.length}`
      ),

      h(
        "ul",
        { id: "task-list", className: "task-list" },

        visibleTasks.map(task =>
          h(
            "li",
            {
              className: task.done
                ? "task-item completed"
                : "task-item",
              "data-task-id": task.id
            },

            h(
              "span",
              { className: "task-title" },
              task.title
            ),

            h(
              "button",
              {
                type: "button",
                className: "toggle-task",
                "data-toggle-id": task.id,
                "aria-pressed": String(task.done),
                onClick: () => toggleTask(task.id)
              },
              task.done ? "Undo" : "Complete"
            )
          )
        )
      ),

      visibleTasks.length === 0
        ? h(
            "p",
            { className: "empty-state" },
            "No tasks in this filter."
          )
        : null
    ),

    h(
      "footer",
      null,
      "Reactive State Machine & Root Event Delegation"
    )
  );
}
