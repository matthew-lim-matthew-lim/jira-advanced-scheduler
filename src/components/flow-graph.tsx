"use client"

import { useEffect, useRef, useState } from "react"
import type { Task, User } from "@/types/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FlowGraphProps {
  tasks: Task[]
  users: User[]
  assignedPairs?: { taskId: string; userId: string }[]
}

export default function FlowGraph({ tasks, users, assignedPairs = [] }: FlowGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [taskNodes, setTaskNodes] = useState<Array<{ id: string; x: number; y: number; task: Task }>>([])
  const [userNodes, setUserNodes] = useState<Array<{ id: string; x: number; y: number; user: User }>>([])
  const [initialized, setInitialized] = useState(false)

  // Create a map of assigned pairs for quick lookup
  const assignmentMap = new Map<string, string>()
  assignedPairs.forEach((pair) => {
    assignmentMap.set(pair.taskId, pair.userId)
  })

  // Check if a user has the required skills for a task
  const hasRequiredSkills = (user: User, task: Task): boolean => {
    return task.requiredSkills.every((skill) => user.skills.includes(skill))
  }

  // Check if a user has capacity for a task
  const hasCapacity = (user: User, task: Task): boolean => {
    return user.capacity - user.currentLoad >= task.storyPoints
  }

  // Check if all dependencies for a task are completed
  const areDependenciesMet = (task: Task): boolean => {
    if (!task.dependencies.length) return true

    return task.dependencies.every((depId) => {
      const depTask = tasks.find((t) => t.id === depId)
      return depTask && depTask.status === "done"
    })
  }

  // Get task by ID helper
  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((task) => task.id === id)
  }

  // Initialize the graph layout once
  useEffect(() => {
    if (!svgRef.current || initialized) return

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()

    // Only set dimensions if they've changed significantly
    if (Math.abs(dimensions.width - rect.width) > 10 || Math.abs(dimensions.height - rect.height) > 10) {
      setDimensions({ width: rect.width || 800, height: rect.height || 600 })
    }

    // Calculate positions for task nodes
    // We'll arrange them in a grid pattern on the left side
    const allTasks = tasks.filter((task) => task.status !== "done") // Include all non-done tasks
    const tasksPerRow = Math.ceil(Math.sqrt(allTasks.length))
    const taskSpacing = Math.min((rect.width * 0.5) / (tasksPerRow + 1), 120)
    const taskVerticalSpacing = Math.min((rect.height * 0.8) / (Math.ceil(allTasks.length / tasksPerRow) + 1), 100)

    const newTaskNodes = allTasks.map((task, index) => {
      const row = Math.floor(index / tasksPerRow)
      const col = index % tasksPerRow
      return {
        id: task.id,
        x: taskSpacing * (col + 1),
        y: taskVerticalSpacing * (row + 1) + 60, // Add some top margin
        task,
      }
    })

    // Calculate positions for user nodes (right side)
    const userSpacing = Math.min((rect.height * 0.8) / (users.length + 1), 100)
    const newUserNodes = users.map((user, index) => ({
      id: user.id,
      x: rect.width * 0.75,
      y: userSpacing * (index + 1) + 60, // Add some top margin
      user,
    }))

    setTaskNodes(newTaskNodes)
    setUserNodes(newUserNodes)
    setInitialized(true)
  }, [tasks, users, dimensions, initialized])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      // Only update if there's a significant change
      if (Math.abs(dimensions.width - rect.width) > 10 || Math.abs(dimensions.height - rect.height) > 10) {
        setDimensions({ width: rect.width || 800, height: rect.height || 600 })
        setInitialized(false) // Reset to recalculate positions
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [dimensions])

  return (
    <Card className="border border-border/40 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle>Max Flow Graph Visualization</CardTitle>
        <CardDescription>Flow network showing task dependencies and possible assignments</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 overflow-x-auto">
        <div className="min-h-[600px] w-full">
          <svg
            ref={svgRef}
            width="100%"
            height="600"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className="bg-background/50 rounded-md"
          >
            {/* Draw dependency edges between tasks */}
            {taskNodes.map((taskNode) => {
              const task = taskNode.task

              return task.dependencies.map((depId) => {
                const depTask = getTaskById(depId)
                if (!depTask) return null

                const depNode = taskNodes.find((node) => node.id === depId)
                if (!depNode) return null

                const isDone = depTask.status === "done"

                return (
                  <g key={`dep-${task.id}-${depId}`}>
                    <path
                      d={`M ${depNode.x} ${depNode.y} C ${depNode.x + 50} ${depNode.y}, ${taskNode.x - 50} ${taskNode.y}, ${taskNode.x} ${taskNode.y}`}
                      stroke={isDone ? "hsl(var(--secondary))" : "hsl(var(--destructive))"}
                      strokeWidth={2}
                      strokeDasharray={isDone ? "none" : "4"}
                      fill="none"
                      opacity={isDone ? 0.7 : 0.9}
                      markerEnd={`url(#${isDone ? "arrow-completed" : "arrow-pending"})`}
                    />
                  </g>
                )
              })
            })}

            {/* Draw edges between tasks and users */}
            {taskNodes.map((taskNode) => {
              const task = taskNode.task

              // Only show assignment edges for tasks with met dependencies
              if (!areDependenciesMet(task)) return null

              return userNodes.map((userNode) => {
                const user = userNode.user

                // Only draw edges if the user has the required skills and capacity
                if (!hasRequiredSkills(user, task) || !hasCapacity(user, task)) return null

                const isAssigned = assignmentMap.get(task.id) === user.id

                return (
                  <g key={`assign-${task.id}-${user.id}`}>
                    <path
                      d={`M ${taskNode.x + 60} ${taskNode.y} C ${taskNode.x + 150} ${taskNode.y}, ${userNode.x - 150} ${userNode.y}, ${userNode.x - 60} ${userNode.y}`}
                      stroke={isAssigned ? "hsl(var(--primary))" : "#d0d0d0"}
                      strokeWidth={isAssigned ? 3 : 1}
                      strokeDasharray={isAssigned ? "none" : "4"}
                      fill="none"
                      opacity={isAssigned ? 1 : 0.5}
                      markerEnd={isAssigned ? "url(#arrow-assigned)" : ""}
                    />
                    {isAssigned && (
                      <circle
                        cx={(taskNode.x + 60 + userNode.x - 60) / 2}
                        cy={(taskNode.y + userNode.y) / 2}
                        r="4"
                        fill="hsl(var(--primary))"
                      />
                    )}
                  </g>
                )
              })
            })}

            {/* Draw task nodes */}
            {taskNodes.map((node) => {
              const task = node.task
              const isAssigned = assignmentMap.has(task.id)
              const hasDependencyIssues = !areDependenciesMet(task)

              return (
                <TooltipProvider key={`task-${node.id}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g className="cursor-pointer" transform={`translate(${node.x - 50}, ${node.y - 30})`}>
                        <rect
                          width="100"
                          height="60"
                          rx="6"
                          ry="6"
                          fill={
                            task.status === "done"
                              ? "hsl(var(--secondary)/0.3)"
                              : hasDependencyIssues
                                ? "hsl(var(--destructive)/0.2)"
                                : isAssigned
                                  ? "hsl(var(--primary)/0.3)"
                                  : "white"
                          }
                          stroke={
                            task.status === "done"
                              ? "hsl(var(--secondary))"
                              : hasDependencyIssues
                                ? "hsl(var(--destructive)/0.5)"
                                : isAssigned
                                  ? "hsl(var(--primary))"
                                  : "hsl(var(--border))"
                          }
                          strokeWidth="1.5"
                        />
                        <text x="50" y="25" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">
                          {task.title.length > 15 ? `${task.title.substring(0, 15)}...` : task.title}
                        </text>
                        <text x="50" y="45" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                          {task.storyPoints} points • {task.status}
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="space-y-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge
                            className={
                              task.priority === "high"
                                ? "bg-destructive/20 text-destructive-foreground"
                                : task.priority === "medium"
                                  ? "bg-primary/20 text-primary-foreground"
                                  : "bg-secondary/20 text-secondary-foreground"
                            }
                          >
                            {task.priority}
                          </Badge>
                          <span className="text-xs">{task.storyPoints} points</span>
                        </div>
                        {task.dependencies.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mt-1">Dependencies:</p>
                            <ul className="text-xs list-disc pl-4">
                              {task.dependencies.map((depId) => {
                                const depTask = getTaskById(depId)
                                return depTask ? (
                                  <li
                                    key={depId}
                                    className={depTask.status === "done" ? "text-green-500" : "text-amber-500"}
                                  >
                                    {depTask.title} ({depTask.status})
                                  </li>
                                ) : null
                              })}
                            </ul>
                          </div>
                        )}
                        {hasDependencyIssues && <p className="text-xs text-destructive">Has unmet dependencies</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}

            {/* Draw user nodes */}
            {userNodes.map((node) => {
              const user = node.user
              const assignedTaskIds = Array.from(assignmentMap.entries())
                .filter(([_, userId]) => userId === user.id)
                .map(([taskId]) => taskId)

              return (
                <TooltipProvider key={`user-${node.id}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g className="cursor-pointer" transform={`translate(${node.x - 50}, ${node.y - 30})`}>
                        <rect
                          width="100"
                          height="60"
                          rx="6"
                          ry="6"
                          fill={assignedTaskIds.length > 0 ? "hsl(var(--accent)/0.3)" : "white"}
                          stroke={assignedTaskIds.length > 0 ? "hsl(var(--accent))" : "hsl(var(--border))"}
                          strokeWidth="1.5"
                        />
                        <text x="50" y="25" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">
                          {user.name.length > 15 ? `${user.name.substring(0, 15)}...` : user.name}
                        </text>
                        <text x="50" y="45" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                          {user.currentLoad}/{user.capacity} points
                        </text>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium">{user.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs">
                          Capacity: {user.currentLoad}/{user.capacity} points
                        </p>
                        {assignedTaskIds.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mt-1">Assigned tasks:</p>
                            <ul className="text-xs list-disc pl-4">
                              {assignedTaskIds.map((taskId) => {
                                const task = tasks.find((t) => t.id === taskId)
                                return task ? <li key={taskId}>{task.title}</li> : null
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}

            {/* Arrow markers for the edges */}
            <defs>
              <marker
                id="arrow-completed"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--secondary))" />
              </marker>
              <marker
                id="arrow-pending"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--destructive))" />
              </marker>
              <marker
                id="arrow-assigned"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
              </marker>
            </defs>

            {/* Legend */}
            <g transform={`translate(20, ${dimensions.height - 120})`}>
              <rect width="220" height="110" rx="6" ry="6" fill="white" stroke="hsl(var(--border))" strokeWidth="1" />
              <text x="10" y="20" fontSize="12" fontWeight="500">
                Legend
              </text>

              <line x1="10" y1="35" x2="30" y2="35" stroke="hsl(var(--primary))" strokeWidth="3" />
              <text x="40" y="38" fontSize="10">
                Assigned flow
              </text>

              <line x1="10" y1="55" x2="30" y2="55" stroke="#d0d0d0" strokeWidth="1" strokeDasharray="4" />
              <text x="40" y="58" fontSize="10">
                Potential assignment
              </text>

              <line
                x1="10"
                y1="75"
                x2="30"
                y2="75"
                stroke="hsl(var(--secondary))"
                strokeWidth="2"
                markerEnd="url(#arrow-completed)"
              />
              <text x="40" y="78" fontSize="10">
                Completed dependency
              </text>

              <line
                x1="10"
                y1="95"
                x2="30"
                y2="95"
                stroke="hsl(var(--destructive))"
                strokeWidth="2"
                strokeDasharray="4"
                markerEnd="url(#arrow-pending)"
              />
              <text x="40" y="98" fontSize="10">
                Pending dependency
              </text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}

