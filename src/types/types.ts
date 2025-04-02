export interface Task {
  id: string
  title: string
  description: string
  status: "to-do" | "in-progress" | "done"
  priority: "low" | "medium" | "high"
  storyPoints: number
  assigneeId?: string
  requiredSkills: string[]
  dependencies: string[]
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
  capacity: number
  currentLoad: number
  avatarUrl: string
}

export interface AssignmentResult {
  success: boolean
  assignedTasks: {
    taskId: string
    userId: string
  }[]
  unassignedTasks: string[]
  message: string
}

