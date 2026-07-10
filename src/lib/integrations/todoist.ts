type TodoistProject = { id: string; name: string };
type TodoistTask = { id: string; content: string };

export async function validateTodoistToken(token: string): Promise<boolean> {
  const response = await fetch("https://api.todoist.com/rest/v2/projects", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.ok;
}

export async function listTodoistProjects(token: string): Promise<TodoistProject[]> {
  const response = await fetch("https://api.todoist.com/rest/v2/projects", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Could not load Todoist projects. Check your API token.");
  }
  return response.json();
}

export async function createTodoistTask(
  token: string,
  task: {
    content: string;
    description?: string | null;
    due_date?: string;
    priority?: number;
    project_id?: string;
  }
): Promise<TodoistTask> {
  const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Todoist API error (${response.status})${body ? `: ${body.slice(0, 120)}` : ""}`);
  }

  return response.json();
}

export function meavoPriorityToTodoist(priority: string): number {
  switch (priority) {
    case "URGENT":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 1;
  }
}
