// Simulated in-memory DB
import type { Task, User } from "@/types/types"

export const tasks: Task[] = []

export const users: User[] = [
    {
        id: "u1",
        name: "John Doe",
        email: "john@example.com",
        role: "Backend Developer",
        skills: ["backend", "api", "security"],
        capacity: 10,
        currentLoad: 2,
        avatarUrl: "/placeholder.svg",
    },
    {
        id: "u2",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "Frontend Developer",
        skills: ["react", "frontend"],
        capacity: 10,
        currentLoad: 5,
        avatarUrl: "/placeholder.svg",
    },
]
