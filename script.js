
"use strict";

const STORAGE_KEY = "taskflow_student_tasks_v1";

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyDescription = document.getElementById("emptyDescription");
const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");
const formMessage = document.getElementById("formMessage");

let tasks = loadTasks();
let currentFilter = "all";
let currentCategory = null;

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      task =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean"
    );
  } catch (error) {
    console.error("Could not load saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Could not save tasks:", error);
    showMessage("Could not save tasks. Check browser storage settings.", true);
    return false;
  }
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function initializePage() {
  const today = new Date();

  document.getElementById("currentDate").textContent =
    today.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  document.getElementById("footerYear").textContent =
    today.getFullYear();

  taskDate.min = getLocalDateString();

  renderTasks();
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? "#ff91a1" : "#55d6a1";
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = taskTitle.value.trim();

  if (!title) {
    showMessage("Please enter a task name.", true);
    taskTitle.focus();
    return;
  }

  const task = {
    id: createId(),
    title: title,
    category: taskCategory.value,
    priority: taskPriority.value,
    dueDate: taskDate.value,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);

  if (!saveTasks()) {
    tasks.shift();
    return;
  }

  // Show the newly created task immediately.
  currentFilter = "all";
  currentCategory = null;
  searchInput.value = "";
  priorityFilter.value = "all";

  updateActiveNavigation();
  renderTasks();

  taskForm.reset();
  taskDate.min = getLocalDateString();

  showMessage("Task added successfully!");
  taskTitle.focus();
});

function createId() {
  if (typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function formatDate(dateString) {
  if (!dateString) return "";

  const parts = dateString.split("-").map(Number);

  if (
    parts.length !== 3 ||
    !parts[0] ||
    parts[1] < 1 ||
    parts[1] > 12 ||
    parts[2] < 1 ||
    parts[2] > 31
  ) {
    return "";
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2]);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getDueDateInfo(task) {
  if (!task.dueDate) return null;

  const today = getLocalDateString();
  const isOverdue = !task.completed && task.dueDate < today;

  return {
    label: isOverdue
      ? "Overdue · " + formatDate(task.dueDate)
      : "Due " + formatDate(task.dueDate),
    overdue: isOverdue
  };
}

function getVisibleTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedPriority = priorityFilter.value;
  const today = getLocalDateString();

  return tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(query);

    const matchesPriority =
      selectedPriority === "all" ||
      task.priority === selectedPriority;

    let matchesView = true;

    if (currentFilter === "today") {
      matchesView = task.dueDate === today && !task.completed;
    } else if (currentFilter === "pending") {
      matchesView = !task.completed;
    } else if (currentFilter === "completed") {
      matchesView = task.completed;
    }

    const matchesCategory =
      !currentCategory || task.category === currentCategory;

    return (
      matchesSearch &&
      matchesPriority &&
      matchesView &&
      matchesCategory
    );
  });
}

function renderTasks() {
  updateStatistics();

  const visibleTasks = getVisibleTasks();

  taskList.replaceChildren();

  visibleTasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });

  const isEmpty = visibleTasks.length === 0;

  emptyState.hidden = !isEmpty;
  taskList.hidden = isEmpty;

  if (isEmpty) {
    if (tasks.length === 0) {
      emptyTitle.textContent = "Your space is ready!";
      emptyDescription.textContent =
        "Add your first task and start making progress.";
    } else {
      emptyTitle.textContent = "No tasks found";
      emptyDescription.textContent =
        "Try another search or filter, or add a new task.";
    }
  }

  const remaining = tasks.filter(task => !task.completed).length;

  document.getElementById("taskSummary").textContent =
    remaining === 0
      ? "Amazing! All your tasks are completed."
      : `You have ${remaining} task${remaining === 1 ? "" : "s"} left to complete.`;
}

function createTaskElement(task) {
  const card = document.createElement("article");
  card.className = "task-card" + (task.completed ? " is-completed" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", "Mark " + task.title + " as completed");

  checkbox.addEventListener("change", function () {
    const previousState = task.completed;
    task.completed = checkbox.checked;

    if (!saveTasks()) {
      task.completed = previousState;
    }

    renderTasks();
  });

  const details = document.createElement("div");
  details.className = "task-details";

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  details.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const category = document.createElement("span");
  category.className = "task-tag";
  category.textContent = getCategoryLabel(task.category);
  meta.appendChild(category);

  const priority = document.createElement("span");
  priority.className =
    "priority-tag " + task.priority.toLowerCase();
  priority.textContent = task.priority + " Priority";
  meta.appendChild(priority);

  const dueInfo = getDueDateInfo(task);

  if (dueInfo) {
    const due = document.createElement("span");
    due.className = "due-tag" + (dueInfo.overdue ? " overdue" : "");
    due.textContent = "◷ " + dueInfo.label;
    meta.appendChild(due);
  }

  details.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "task-action delete";
  deleteButton.textContent = "×";
  deleteButton.title = "Delete task";
  deleteButton.setAttribute("aria-label", "Delete " + task.title);

  deleteButton.addEventListener("click", function () {
    deleteTask(task.id);
  });

  actions.appendChild(deleteButton);

  card.append(checkbox, details, actions);

  return card;
}

function getCategoryLabel(category) {
  const labels = {
    Study: "📚 Study",
    Personal: "🌸 Personal",
    Project: "💻 Project",
    Other: "✨ Other"
  };

  return labels[category] || "✨ Other";
}

function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const progress = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  document.getElementById("totalCount").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("progressCount").textContent = progress + "%";
  document.getElementById("progressFill").style.width = progress + "%";
  document.getElementById("allNavCount").textContent = total;
}

function deleteTask(id) {
  const originalTasks = tasks;
  tasks = tasks.filter(task => task.id !== id);

  if (!saveTasks()) {
    tasks = originalTasks;
    return;
  }

  renderTasks();
  showMessage("Task deleted successfully.");
}

function updateActiveNavigation() {
  document.querySelectorAll(".nav-link").forEach(button => {
    const isActive =
      button.dataset.filter === currentFilter &&
      !currentCategory;

    button.classList.toggle("active", isActive);
  });

  document.querySelectorAll("[data-category]").forEach(button => {
    const isActive = button.dataset.category === currentCategory;
    button.classList.toggle("active", isActive);
  });
}

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;
    currentCategory = null;

    updateActiveNavigation();
    renderTasks();
  });
});

document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", function () {
    const selected = button.dataset.category;

    currentCategory = currentCategory === selected ? null : selected;
    currentFilter = "all";

    updateActiveNavigation();
    renderTasks();
  });
});

searchInput.addEventListener("input", renderTasks);
priorityFilter.addEventListener("change", renderTasks);

initializePage();