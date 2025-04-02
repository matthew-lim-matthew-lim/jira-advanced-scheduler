import type { Task } from "@/types/types"

// Priority values for different task priorities
const PRIORITY_VALUES = {
  high: 3,
  medium: 2,
  low: 1,
}

export class TaskPriorityQueue {
  private tasks: Task[]
  private dependencyMap: Map<string, string[]>

  constructor(tasks: Task[]) {
    this.tasks = [...tasks]
    this.dependencyMap = this.buildDependencyMap(tasks)
    this.sort()
  }

  // Build a map of task IDs to the IDs of tasks that depend on them
  private buildDependencyMap(tasks: Task[]): Map<string, string[]> {
    const dependencyMap = new Map<string, string[]>()

    // Initialize the map with empty arrays for all tasks
    tasks.forEach((task) => {
      dependencyMap.set(task.id, [])
    })

    // Populate the map with dependencies
    tasks.forEach((task) => {
      task.dependencies.forEach((depId) => {
        const dependents = dependencyMap.get(depId) || []
        dependents.push(task.id)
        dependencyMap.set(depId, dependents)
      })
    })

    return dependencyMap
  }

  // Calculate the priority score for a task
  private calculatePriorityScore(task: Task): number {
    const priorityValue = PRIORITY_VALUES[task.priority] || 1
    const dependentsCount = this.dependencyMap.get(task.id)?.length || 0
    const dependenciesCount = task.dependencies.length

    // Formula: priority value * 1000 + dependents count * 100 + story points * 10 - dependencies count * 5
    // This prioritizes:
    // 1. Tasks with higher priority
    // 2. Tasks that block other tasks
    // 3. Tasks with higher story points
    // 4. Tasks with fewer dependencies
    return priorityValue * 1000 + dependentsCount * 100 + task.storyPoints * 10 - dependenciesCount * 5
  }

  // Sort the tasks by priority score in descending order
  private sort(): void {
    this.tasks.sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a)
      const scoreB = this.calculatePriorityScore(b)
      return scoreB - scoreA
    })
  }

  // Get the next task from the queue
  public next(): Task | undefined {
    return this.tasks.shift()
  }

  // Check if the queue is empty
  public isEmpty(): boolean {
    return this.tasks.length === 0
  }

  // Get the number of tasks in the queue
  public size(): number {
    return this.tasks.length
  }

  // Get all tasks in the queue
  public getAllTasks(): Task[] {
    return [...this.tasks]
  }
}

