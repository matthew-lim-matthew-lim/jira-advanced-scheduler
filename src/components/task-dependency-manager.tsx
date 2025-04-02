"use client"

import { useState } from "react"
import type { Task } from "@/types/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Check, LinkIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskDependencyManagerProps {
  task: Task
  allTasks: Task[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (taskId: string, dependencies: string[]) => void
}

export function TaskDependencyManager({ task, allTasks, open, onOpenChange, onSave }: TaskDependencyManagerProps) {
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([...task.dependencies])

  // Filter out the current task and tasks that depend on this task to avoid circular dependencies
  const availableTasks = allTasks.filter((t) => {
    // Skip the current task
    if (t.id === task.id) return false

    // Skip tasks that have this task as a dependency (to avoid circular dependencies)
    if (t.dependencies.includes(task.id)) return false

    // Skip tasks that would create a circular dependency chain
    if (wouldCreateCircularDependency(t.id, task.id, allTasks)) return false

    return true
  })

  // Check if adding a dependency would create a circular dependency chain
  function wouldCreateCircularDependency(
    dependencyId: string,
    taskId: string,
    tasks: Task[],
    visited: Set<string> = new Set(),
  ): boolean {
    // If we've already visited this task, we have a cycle
    if (visited.has(dependencyId)) return false

    // Add the current task to visited
    visited.add(dependencyId)

    // Get the dependency task
    const dependencyTask = tasks.find((t) => t.id === dependencyId)
    if (!dependencyTask) return false

    // Check if any of the dependency's dependencies include the original task
    for (const depId of dependencyTask.dependencies) {
      if (depId === taskId) return true
      if (wouldCreateCircularDependency(depId, taskId, tasks, new Set(visited))) return true
    }

    return false
  }

  const toggleDependency = (dependencyId: string) => {
    setSelectedDependencies((prev) => {
      if (prev.includes(dependencyId)) {
        return prev.filter((id) => id !== dependencyId)
      } else {
        return [...prev, dependencyId]
      }
    })
  }

  const handleSave = () => {
    onSave(task.id, selectedDependencies)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Dependencies</DialogTitle>
          <DialogDescription>Select tasks that must be completed before "{task.title}" can start.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-sm font-medium mb-2">Current Dependencies:</h3>
          {selectedDependencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dependencies selected</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedDependencies.map((depId) => {
                const depTask = allTasks.find((t) => t.id === depId)
                if (!depTask) return null

                return (
                  <Badge key={depId} variant="secondary" className="flex items-center gap-1">
                    {depTask.title}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-transparent"
                      onClick={() => toggleDependency(depId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          )}

          <div className="border rounded-md mt-4">
            <Command>
              <CommandInput placeholder="Search tasks..." />
              <CommandList>
                <CommandEmpty>No tasks found.</CommandEmpty>
                <CommandGroup>
                  {availableTasks.map((t) => (
                    <CommandItem
                      key={t.id}
                      onSelect={() => toggleDependency(t.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{t.title}</span>
                        <Badge variant="outline" className="ml-1">
                          {t.status}
                        </Badge>
                      </div>
                      <Check
                        className={cn("h-4 w-4", selectedDependencies.includes(t.id) ? "opacity-100" : "opacity-0")}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

