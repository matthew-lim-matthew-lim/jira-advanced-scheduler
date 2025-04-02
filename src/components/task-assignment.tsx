"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, AlertCircle, Info, LinkIcon } from "lucide-react"
import type { Task, User, AssignmentResult } from "@/types/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import FlowGraph from "./flow-graph"

interface TaskAssignmentProps {
  tasks: Task[]
  users: User[]
  assignmentResult: AssignmentResult | null
  onAssign: () => void
  isLoading: boolean
}

export default function TaskAssignment({ tasks, users, assignmentResult, onAssign, isLoading }: TaskAssignmentProps) {
  const [activeTab, setActiveTab] = useState("assigned")
  const unassignedTasks = tasks.filter((task) => !task.assigneeId && task.status === "to-do")

  const getTaskById = (id: string) => tasks.find((task) => task.id === id)

  const hasUnmetDependencies = (task: Task) => {
    return task.dependencies.some((depId) => {
      const depTask = getTaskById(depId)
      return depTask && depTask.status !== "done"
    })
  }

  const getUnmetDependencies = (task: Task) => {
    return task.dependencies
      .map((depId) => getTaskById(depId))
      .filter((depTask) => depTask && depTask.status !== "done") as Task[]
  }

  const assignableTasks = unassignedTasks.filter((task) => !hasUnmetDependencies(task))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-medium">Task Assignment</h2>
          <p className="text-muted-foreground">Optimize task assignment using Max Flow and Priority Queue algorithms</p>
        </div>
        <Button
          onClick={onAssign}
          disabled={assignableTasks.length === 0}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Run Assignment Algorithm
        </Button>
      </div>

      {unassignedTasks.length === 0 && (
        <Alert className="bg-accent/20 border-accent">
          <Info className="h-4 w-4 text-accent-foreground" />
          <AlertTitle className="text-accent-foreground">No unassigned tasks</AlertTitle>
          <AlertDescription className="text-accent-foreground/80">
            All tasks have been assigned. Create new tasks or change the status of existing ones to "To Do" to use the
            assignment algorithm.
          </AlertDescription>
        </Alert>
      )}

      {unassignedTasks.length > 0 && assignableTasks.length === 0 && (
        <Alert className="bg-destructive/20 border-destructive">
          <AlertCircle className="h-4 w-4 text-destructive-foreground" />
          <AlertTitle className="text-destructive-foreground">Dependency Constraints</AlertTitle>
          <AlertDescription className="text-destructive-foreground/80">
            All unassigned tasks have unmet dependencies. Complete the dependent tasks first.
          </AlertDescription>
        </Alert>
      )}

      {assignmentResult && (
        <Card className="border border-border/40 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle>Assignment Results</CardTitle>
            <CardDescription>
              {assignmentResult.success
                ? `Successfully assigned ${assignmentResult.assignedTasks.length} tasks to team members`
                : "Some tasks could not be assigned due to capacity constraints, skill mismatches, or dependencies"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger
                  value="assigned"
                  className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Assigned Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="unassigned"
                  className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Unassigned Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="flow-graph"
                  className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Flow Graph
                </TabsTrigger>
              </TabsList>
              <TabsContent value="assigned" className="space-y-4 mt-4">
                {assignmentResult.assignedTasks.length === 0 ? (
                  <Alert className="bg-accent/20 border-accent">
                    <Info className="h-4 w-4 text-accent-foreground" />
                    <AlertTitle className="text-accent-foreground">No tasks assigned</AlertTitle>
                    <AlertDescription className="text-accent-foreground/80">
                      No tasks could be assigned in this run.
                    </AlertDescription>
                  </Alert>
                ) : (
                  assignmentResult.assignedTasks.map((assignment) => {
                    const task = tasks.find((t) => t.id === assignment.taskId)
                    const user = users.find((u) => u.id === assignment.userId)

                    if (!task || !user) return null

                    return (
                      <div
                        key={task.id}
                        className="border border-border/40 bg-card rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{task.title}</h3>
                              <Badge
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium",
                                  task.priority === "high"
                                    ? "bg-destructive/20 text-destructive-foreground"
                                    : task.priority === "medium"
                                      ? "bg-primary/20 text-primary-foreground"
                                      : 'bg-secondary/20 text-secondary-foreground"t-secondary-foreground',
                                )}
                              >
                                {task.priority}
                              </Badge>

                              {task.dependencies.length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Dependencies:</p>
                                      <ul className="text-xs mt-1">
                                        {task.dependencies.map((depId) => {
                                          const depTask = getTaskById(depId)
                                          return depTask ? (
                                            <li key={depId} className="flex items-center gap-1">
                                              <span
                                                className={
                                                  depTask.status === "done" ? "text-green-500" : "text-amber-500"
                                                }
                                              >
                                                •
                                              </span>
                                              {depTask.title}
                                            </li>
                                          ) : null
                                        })}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{task.storyPoints} points</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Assigned to:</span>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatarUrl} alt={user.name} />
                              <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{user.name}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </TabsContent>
              <TabsContent value="unassigned" className="space-y-4 mt-4">
                {assignmentResult.unassignedTasks.length === 0 ? (
                  <Alert className="bg-secondary/20 border-secondary">
                    <CheckCircle className="h-4 w-4 text-secondary-foreground" />
                    <AlertTitle className="text-secondary-foreground">All tasks assigned</AlertTitle>
                    <AlertDescription className="text-secondary-foreground/80">
                      All tasks were successfully assigned to team members.
                    </AlertDescription>
                  </Alert>
                ) : (
                  assignmentResult.unassignedTasks.map((taskId) => {
                    const task = tasks.find((t) => t.id === taskId)
                    if (!task) return null

                    const unmetDependencies = getUnmetDependencies(task)
                    const hasDependencyIssues = unmetDependencies.length > 0

                    return (
                      <div
                        key={task.id}
                        className="border border-border/40 bg-card rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{task.title}</h3>
                              <Badge
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium",
                                  task.priority === "high"
                                    ? "bg-destructive/20 text-destructive-foreground"
                                    : task.priority === "medium"
                                      ? "bg-primary/20 text-primary-foreground"
                                      : "bg-secondary/20 text-secondary-foreground",
                                )}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{task.storyPoints} points</p>

                            {hasDependencyIssues && (
                              <div className="mt-2 text-xs text-amber-600">
                                <p className="font-medium">Blocked by dependencies:</p>
                                <ul className="mt-1 pl-4 list-disc">
                                  {unmetDependencies.map((depTask) => (
                                    <li key={depTask.id}>
                                      {depTask.title} ({depTask.status})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-sm text-destructive">
                              {hasDependencyIssues ? "Blocked by dependencies" : "Could not assign"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </TabsContent>
              <TabsContent value="flow-graph" className="mt-4">
                {activeTab === "flow-graph" && (
                  <FlowGraph tasks={tasks} users={users} assignedPairs={assignmentResult.assignedTasks} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border/40 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle>Algorithm Explanation</CardTitle>
            <CardDescription>How the task assignment works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <h3 className="font-medium mb-2">Dependency Resolution</h3>
              <p className="text-sm text-muted-foreground">
                Tasks with dependencies are only considered for assignment when all their dependencies are completed.
                The system uses topological sorting to determine the correct order of tasks.
              </p>
            </div>
            <div className="h-px w-full bg-border/50 my-3"></div>
            <div>
              <h3 className="font-medium mb-2">Max Flow Algorithm</h3>
              <p className="text-sm text-muted-foreground">
                The system uses the Ford-Fulkerson algorithm to find the maximum flow in a bipartite graph between tasks
                and team members. This ensures optimal assignment based on capacity constraints.
              </p>
            </div>
            <div className="h-px w-full bg-border/50 my-3"></div>
            <div>
              <h3 className="font-medium mb-2">Priority Queue</h3>
              <p className="text-sm text-muted-foreground">
                Tasks are prioritized in a queue based on their priority level, story points, and dependencies. High
                priority tasks and those that block other tasks are assigned first.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle>Assignment Statistics</CardTitle>
            <CardDescription>Current team capacity and workload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Team Capacity:</span>
              <span className="font-medium">{users.reduce((sum, user) => sum + user.capacity, 0)} points</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Team Load:</span>
              <span className="font-medium">{users.reduce((sum, user) => sum + user.currentLoad, 0)} points</span>
            </div>
            <div className="h-px w-full bg-border/50 my-3"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Unassigned Tasks:</span>
              <span className="font-medium">{unassignedTasks.length} tasks</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Assignable Tasks:</span>
              <span className="font-medium">{assignableTasks.length} tasks</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Blocked by Dependencies:</span>
              <span className="font-medium">{unassignedTasks.length - assignableTasks.length} tasks</span>
            </div>
            <div className="h-px w-full bg-border/50 my-3"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Unassigned Story Points:</span>
              <span className="font-medium">
                {unassignedTasks.reduce((sum, task) => sum + task.storyPoints, 0)} points
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

