"use client"

import { useState, useRef, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Task, User } from "@/types/types"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowDownToLine, ChevronDown, ChevronUp, LinkIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TaskBoardProps {
  tasks: Task[]
  users: User[]
  isLoading: boolean
}

export default function TaskBoard({ tasks, users, isLoading }: TaskBoardProps) {
  const [columns, setColumns] = useState({
    "to-do": {
      id: "to-do",
      title: "To Do",
      taskIds: tasks.filter((task) => task.status === "to-do").map((task) => task.id),
    },
    "in-progress": {
      id: "in-progress",
      title: "In Progress",
      taskIds: tasks.filter((task) => task.status === "in-progress").map((task) => task.id),
    },
    done: {
      id: "done",
      title: "Done",
      taskIds: tasks.filter((task) => task.status === "done").map((task) => task.id),
    },
  })

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})
  const [dependencyLines, setDependencyLines] = useState<Array<{ from: DOMRect; to: DOMRect }>>([])
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const boardRef = useRef<HTMLDivElement>(null)

  // Update task positions for dependency lines
  useEffect(() => {
    // Use a timeout to ensure the DOM has updated
    const timer = setTimeout(() => {
      updateDependencyLines()
    }, 100)
    return () => clearTimeout(timer)
  }, [columns, expandedTasks])

  // Update dependency lines when window is resized
  useEffect(() => {
    const handleResize = () => {
      updateDependencyLines()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const updateDependencyLines = () => {
    if (!boardRef.current) return

    const newLines: Array<{ from: DOMRect; to: DOMRect }> = []
    const boardRect = boardRef.current.getBoundingClientRect()

    tasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        const taskElement = taskRefs.current[task.id]

        task.dependencies.forEach((depId) => {
          const depElement = taskRefs.current[depId]

          if (taskElement && depElement) {
            const taskRect = taskElement.getBoundingClientRect()
            const depRect = depElement.getBoundingClientRect()

            // Calculate positions relative to the board
            const fromRect = {
              ...depRect,
              top: depRect.top - boardRect.top + boardRef.current!.scrollTop,
              left: depRect.left - boardRect.left + boardRef.current!.scrollLeft,
            }

            const toRect = {
              ...taskRect,
              top: taskRect.top - boardRect.top + boardRef.current!.scrollTop,
              left: taskRect.left - boardRect.left + boardRef.current!.scrollLeft,
            }

            newLines.push({
              from: fromRect,
              to: toRect,
            })
          }
        })
      }
    })

    setDependencyLines(newLines)
  }

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result

    if (!destination) {
      return
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    const start = columns[source.droppableId as keyof typeof columns]
    const finish = columns[destination.droppableId as keyof typeof columns]

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds)
      newTaskIds.splice(source.index, 1)
      newTaskIds.splice(destination.index, 0, draggableId)

      const newColumn = {
        ...start,
        taskIds: newTaskIds,
      }

      setColumns({
        ...columns,
        [newColumn.id]: newColumn,
      })
    } else {
      // Check if we're trying to move a task that has incomplete dependencies
      const task = getTaskById(draggableId)
      if (
        task &&
        task.dependencies.length > 0 &&
        source.droppableId === "to-do" &&
        destination.droppableId === "in-progress"
      ) {
        const hasIncompleteDependencies = task.dependencies.some((depId) => {
          const depTask = getTaskById(depId)
          return depTask && depTask.status !== "done"
        })

        if (hasIncompleteDependencies) {
          // Don't allow the move if dependencies aren't complete
          return
        }
      }

      const startTaskIds = Array.from(start.taskIds)
      startTaskIds.splice(source.index, 1)
      const newStart = {
        ...start,
        taskIds: startTaskIds,
      }

      const finishTaskIds = Array.from(finish.taskIds)
      finishTaskIds.splice(destination.index, 0, draggableId)
      const newFinish = {
        ...finish,
        taskIds: finishTaskIds,
      }

      setColumns({
        ...columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      })

      // Update the task status in the backend
      // This would be an API call in a real application
      console.log(`Task ${draggableId} moved from ${source.droppableId} to ${destination.droppableId}`)
    }

    // Update dependency lines after drag
    setTimeout(updateDependencyLines, 100)
  }

  const getTaskById = (id: string) => tasks.find((task) => task.id === id)
  const getUserById = (id: string) => users.find((user) => user.id === id)

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  const hasDependents = (taskId: string) => {
    return tasks.some((task) => task.dependencies.includes(taskId))
  }

  const getDependentTasks = (taskId: string) => {
    return tasks.filter((task) => task.dependencies.includes(taskId))
  }

  const hasBlockingDependencies = (task: Task) => {
    if (!task.dependencies.length) return false

    return task.dependencies.some((depId) => {
      const depTask = getTaskById(depId)
      return depTask && depTask.status !== "done"
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((column) => (
          <Card key={column} className="h-[600px] border-none shadow-none bg-muted/30">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((task) => (
                <Skeleton key={task} className="h-32 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="relative" ref={boardRef}>
      {/* SVG for dependency lines */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        {dependencyLines.map((line, index) => {
          // Calculate control points for a nice curve
          const fromX = line.from.left + line.from.width / 2
          const fromY = line.from.top + line.from.height
          const toX = line.to.left + line.to.width / 2
          const toY = line.to.top

          // Calculate control points for a smooth curve
          const midY = (fromY + toY) / 2

          return (
            <g key={index}>
              <path
                d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
                stroke="#d0d0d0"
                strokeWidth="1.5"
                strokeDasharray="4"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            </g>
          )
        })}
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#d0d0d0" />
          </marker>
        </defs>
      </svg>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(columns).map((column) => (
            <div key={column.id} className="flex flex-col h-full border border-muted/40 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 px-1">{column.title}</h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4 min-h-[500px] bg-muted/30 p-3 rounded-lg flex-1"
                  >
                    {column.taskIds.map((taskId, index) => {
                      const task = getTaskById(taskId)
                      if (!task) return null

                      const assignee = task.assigneeId ? getUserById(task.assigneeId) : null
                      const isExpanded = expandedTasks[taskId]
                      const isBlocked = hasBlockingDependencies(task)

                      return (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={isBlocked && column.id === "to-do"}
                        >
                          {(provided) => (
                            <div
                              ref={(el) => {
                                provided.innerRef(el)
                                taskRefs.current[task.id] = el
                              }}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-card rounded-lg transition-all duration-200",
                                "border border-border/40 shadow-sm hover:shadow-md",
                                "p-4 mb-3 last:mb-0",
                                isBlocked &&
                                column.id === "to-do" &&
                                "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10",
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-base">{task.title}</h3>
                                <div className="flex items-center gap-1">
                                  {task.dependencies.length > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full hover:bg-muted"
                                          >
                                            <ArrowDownToLine className="h-4 w-4 text-amber-500" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Has dependencies</p>
                                          <ul className="text-xs mt-1">
                                            {task.dependencies.map((depId) => {
                                              const depTask = getTaskById(depId)
                                              return depTask ? (
                                                <li key={depId} className="flex items-center gap-1">
                                                  <span
                                                    className={cn(
                                                      depTask.status === "done" ? "text-green-500" : "text-amber-500",
                                                    )}
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

                                  {hasDependents(task.id) && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full hover:bg-muted"
                                          >
                                            <LinkIcon className="h-4 w-4 text-blue-400" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Required by:</p>
                                          <ul className="text-xs mt-1">
                                            {getDependentTasks(task.id).map((depTask) => (
                                              <li key={depTask.id}>{depTask.title}</li>
                                            ))}
                                          </ul>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}

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
                              </div>

                              {isBlocked && column.id === "to-do" && (
                                <div className="flex items-center gap-2 text-amber-600 text-xs mb-2 bg-amber-50/50 dark:bg-amber-950/10 p-2 rounded">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Blocked by dependencies</span>
                                </div>
                              )}

                              <p className={cn("text-sm text-muted-foreground mb-4", isExpanded ? "" : "line-clamp-2")}>
                                {task.description}
                              </p>

                              {task.dependencies.length > 0 && isExpanded && (
                                <div className="mb-4">
                                  <h4 className="text-xs font-medium mb-1">Dependencies:</h4>
                                  <ul className="text-xs space-y-1">
                                    {task.dependencies.map((depId) => {
                                      const depTask = getTaskById(depId)
                                      return depTask ? (
                                        <li key={depId} className="flex items-center gap-1">
                                          <span
                                            className={cn(
                                              "h-2 w-2 rounded-full",
                                              depTask.status === "done" ? "bg-green-400" : "bg-amber-400",
                                            )}
                                          ></span>
                                          {depTask.title}
                                          <Badge variant="outline" className="ml-1 text-[10px] px-1 h-4">
                                            {depTask.status}
                                          </Badge>
                                        </li>
                                      ) : null
                                    })}
                                  </ul>
                                </div>
                              )}

                              <div className="h-px w-full bg-border/50 my-3"></div>

                              <div className="flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">{task.storyPoints} points</div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-muted"
                                    onClick={() => toggleTaskExpand(task.id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>

                                  {assignee && (
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                      <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                                        {assignee.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

