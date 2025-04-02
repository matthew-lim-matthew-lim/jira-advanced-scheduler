import type { Task, User, AssignmentResult } from "@/types/types"
import { TaskPriorityQueue } from "./priority-queue"
import { createGraph, addEdge, fordFulkerson, getAssignments } from "./max-flow"

// Check if a user has the required skills for a task
function hasRequiredSkills(user: User, task: Task): boolean {
  return task.requiredSkills.every((skill) => user.skills.includes(skill))
}

// Check if a user has capacity for a task
function hasCapacity(user: User, task: Task): boolean {
  return user.capacity - user.currentLoad >= task.storyPoints
}

// Check if all dependencies for a task are completed
function areDependenciesMet(task: Task, tasks: Task[]): boolean {
  if (!task.dependencies.length) return true

  return task.dependencies.every((depId) => {
    const depTask = tasks.find((t) => t.id === depId)
    return depTask && depTask.status === "done"
  })
}

// Build a dependency graph to determine task order
function buildDependencyGraph(tasks: Task[]): Map<string, string[]> {
  const graph = new Map<string, string[]>()

  // Initialize the graph with empty arrays
  tasks.forEach((task) => {
    graph.set(task.id, [])
  })

  // Add dependencies
  tasks.forEach((task) => {
    task.dependencies.forEach((depId) => {
      const dependents = graph.get(depId) || []
      dependents.push(task.id)
      graph.set(depId, dependents)
    })
  })

  return graph
}

// Topologically sort tasks based on dependencies
function topologicalSort(tasks: Task[]): Task[] {
  const dependencyGraph = buildDependencyGraph(tasks)
  const visited = new Set<string>()
  const result: Task[] = []

  function visit(taskId: string) {
    if (visited.has(taskId)) return

    visited.add(taskId)

    const dependents = dependencyGraph.get(taskId) || []
    for (const depId of dependents) {
      visit(depId)
    }

    const task = tasks.find((t) => t.id === taskId)
    if (task) result.unshift(task)
  }

  // Visit all tasks
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      visit(task.id)
    }
  }

  return result
}

// Assign tasks to users using Max Flow algorithm
export function assignTasks(tasks: Task[], users: User[]): AssignmentResult {
  // Filter out tasks that are already assigned or not in 'to-do' status
  const unassignedTasks = tasks.filter((task) => !task.assigneeId && task.status === "to-do")

  if (unassignedTasks.length === 0) {
    return {
      success: true,
      assignedTasks: [],
      unassignedTasks: [],
      message: "No unassigned tasks to process",
    }
  }

  // Filter tasks that have all dependencies met
  const assignableTasks = unassignedTasks.filter((task) => areDependenciesMet(task, tasks))

  if (assignableTasks.length === 0) {
    return {
      success: false,
      assignedTasks: [],
      unassignedTasks: unassignedTasks.map((t) => t.id),
      message: "All unassigned tasks have unmet dependencies",
    }
  }

  // Sort tasks based on dependencies
  const sortedTasks = topologicalSort(assignableTasks)

  // Create a priority queue for the tasks
  const taskQueue = new TaskPriorityQueue(sortedTasks)
  const tasksToAssign = taskQueue.getAllTasks()

  // Create a graph for the max flow algorithm
  // Vertices: source (0), tasks (1 to numTasks), users (numTasks+1 to numTasks+numUsers), sink (numTasks+numUsers+1)
  const numTasks = tasksToAssign.length
  const numUsers = users.length
  const source = 0
  const sink = numTasks + numUsers + 1
  const graph = createGraph(sink + 1)

  // Add edges from source to tasks
  for (let i = 0; i < numTasks; i++) {
    addEdge(graph, source, i + 1, 1) // Capacity 1 means each task can be assigned once
  }

  // Add edges from tasks to users if the user has the required skills and capacity
  for (let i = 0; i < numTasks; i++) {
    const task = tasksToAssign[i]

    for (let j = 0; j < numUsers; j++) {
      const user = users[j]

      if (hasRequiredSkills(user, task) && hasCapacity(user, task)) {
        addEdge(graph, i + 1, numTasks + j + 1, 1)
      }
    }
  }

  // Add edges from users to sink
  for (let j = 0; j < numUsers; j++) {
    // Each user can take multiple tasks up to their capacity
    // For simplicity, we set a high capacity here
    addEdge(graph, numTasks + j + 1, sink, 10)
  }

  // Run the Ford-Fulkerson algorithm to find the maximum flow
  const maxFlow = fordFulkerson(graph, source, sink)

  // Get the assignments from the flow
  const flowAssignments = getAssignments(graph, numTasks, numUsers)

  // Convert the assignments to the expected format
  const assignedTasks = flowAssignments.map((assignment) => ({
    taskId: tasksToAssign[assignment.taskId].id,
    userId: users[assignment.userId].id,
  }))

  // Find the unassigned tasks
  const assignedTaskIds = new Set(assignedTasks.map((a) => a.taskId))
  const unassignedTaskIds = [
    ...tasksToAssign.filter((task) => !assignedTaskIds.has(task.id)).map((task) => task.id),
    ...unassignedTasks.filter((task) => !areDependenciesMet(task, tasks)).map((task) => task.id),
  ]

  return {
    success: maxFlow === numTasks, // Success if all assignable tasks were assigned
    assignedTasks,
    unassignedTasks: unassignedTaskIds,
    message: `Task assignment completed with ${assignedTasks.length} tasks assigned and ${unassignedTaskIds.length} tasks unassigned`,
  }
}

