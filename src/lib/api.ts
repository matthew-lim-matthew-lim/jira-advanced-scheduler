import type { Task, User, AssignmentResult } from "@/types/types"
import { assignTasks } from "./algorithms/task-assignment"

// Base URL for the Drogon C++ backend
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"

const API_BASE_URL = "http://localhost:5000/api"

// Fetch all tasks from the backend
export async function fetchTasks(): Promise<Task[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching tasks:", error)
    // Return mock data for development
    return mockTasks
  }
}

// Fetch all users from the backend
export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching users:", error)
    // Return mock data for development
    return mockUsers
  }
}

// Assign tasks to users using the Max Flow and Priority Queue algorithms
export async function assignTasksToUsers(tasks: Task[], users: User[]): Promise<AssignmentResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/assign-tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: tasks.filter((task) => !task.assigneeId && task.status === "to-do"),
        users,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error assigning tasks:", error)
    // Use the local algorithm for development
    return assignTasks(tasks, users)
  }
}

// Create a new task
export async function createTask(taskData: Partial<Task>): Promise<Task> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating task:", error)
    // Create a mock task for development
    const newTask: Task = {
      id: `t${mockTasks.length + 1}`,
      title: taskData.title || "New Task",
      description: taskData.description || "",
      status: taskData.status || "to-do",
      priority: taskData.priority || "medium",
      storyPoints: taskData.storyPoints || 1,
      assigneeId: taskData.assigneeId,
      requiredSkills: taskData.requiredSkills || [],
      dependencies: taskData.dependencies || [],
    }

    mockTasks.push(newTask)
    return newTask
  }
}

// Update an existing task
export async function updateTask(taskData: Partial<Task>): Promise<Task> {
  if (!taskData.id) {
    throw new Error("Task ID is required for updates")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating task:", error)
    // Update the mock task for development
    const taskIndex = mockTasks.findIndex((t) => t.id === taskData.id)

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskData.id} not found`)
    }

    const updatedTask = {
      ...mockTasks[taskIndex],
      ...taskData,
    }

    mockTasks[taskIndex] = updatedTask
    return updatedTask
  }
}

// Mock data for development and testing
const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Implement user authentication",
    description: "Add login and registration functionality with JWT",
    status: "to-do",
    priority: "high",
    storyPoints: 8,
    requiredSkills: ["backend", "security"],
    dependencies: [],
  },
  {
    id: "t2",
    title: "Design dashboard UI",
    description: "Create wireframes and mockups for the main dashboard",
    status: "in-progress",
    priority: "medium",
    storyPoints: 5,
    assigneeId: "u2",
    requiredSkills: ["design", "frontend"],
    dependencies: [],
  },
  {
    id: "t3",
    title: "Implement task board component",
    description: "Create a drag-and-drop task board similar to Trello",
    status: "to-do",
    priority: "medium",
    storyPoints: 13,
    requiredSkills: ["frontend", "react"],
    dependencies: ["t2"],
  },
  {
    id: "t4",
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment",
    status: "to-do",
    priority: "low",
    storyPoints: 5,
    requiredSkills: ["devops"],
    dependencies: [],
  },
  {
    id: "t5",
    title: "Implement API endpoints for tasks",
    description: "Create REST API endpoints for CRUD operations on tasks",
    status: "done",
    priority: "high",
    storyPoints: 8,
    assigneeId: "u1",
    requiredSkills: ["backend", "api"],
    dependencies: [],
  },
  {
    id: "t6",
    title: "Write unit tests for backend",
    description: "Increase test coverage for backend services",
    status: "to-do",
    priority: "medium",
    storyPoints: 5,
    requiredSkills: ["testing", "backend"],
    dependencies: ["t5"],
  },
  {
    id: "t7",
    title: "Implement dependency visualization",
    description: "Add visual indicators for task dependencies in the UI",
    status: "to-do",
    priority: "medium",
    storyPoints: 8,
    requiredSkills: ["frontend", "react"],
    dependencies: ["t3"],
  },
  {
    id: "t8",
    title: "Optimize database queries",
    description: "Improve performance of database queries for task listing",
    status: "to-do",
    priority: "low",
    storyPoints: 5,
    requiredSkills: ["backend", "database"],
    dependencies: ["t5"],
  },
]

const mockUsers: User[] = [
  {
    id: "u1",
    name: "John Doe",
    email: "john@example.com",
    role: "Backend Developer",
    skills: ["backend", "api", "database", "security"],
    capacity: 20,
    currentLoad: 8,
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "u2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "UI/UX Designer",
    skills: ["design", "frontend", "ui", "ux"],
    capacity: 15,
    currentLoad: 5,
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "u3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "Frontend Developer",
    skills: ["frontend", "react", "javascript"],
    capacity: 18,
    currentLoad: 0,
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "u4",
    name: "Alice Williams",
    email: "alice@example.com",
    role: "DevOps Engineer",
    skills: ["devops", "aws", "kubernetes", "ci/cd"],
    capacity: 12,
    currentLoad: 0,
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
]

