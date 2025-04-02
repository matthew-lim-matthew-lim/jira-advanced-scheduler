"use client"

import type React from "react"

import { useState } from "react"
import type { Task, User } from "@/types/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskDependencyManager } from "./task-dependency-manager"
import { Badge } from "@/components/ui/badge"
import { LinkIcon } from "lucide-react"

interface TaskFormProps {
  task?: Task
  allTasks: Task[]
  users: User[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Partial<Task>) => void
}

export function TaskForm({ task, allTasks, users, open, onOpenChange, onSave }: TaskFormProps) {
  const isEditing = !!task

  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      title: "",
      description: "",
      status: "to-do",
      priority: "medium",
      storyPoints: 1,
      assigneeId: "",
      requiredSkills: [],
      dependencies: [],
    },
  )

  const [dependencyManagerOpen, setDependencyManagerOpen] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number.parseInt(value) || 0 }))
  }

  const handleSaveDependencies = (taskId: string, dependencies: string[]) => {
    setFormData((prev) => ({ ...prev, dependencies }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the details of this task." : "Fill in the details to create a new task."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to-do">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="storyPoints" className="text-right">
                  Story Points
                </Label>
                <Input
                  id="storyPoints"
                  name="storyPoints"
                  type="number"
                  min="1"
                  max="21"
                  value={formData.storyPoints}
                  onChange={handleNumberChange}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assigneeId" className="text-right">
                  Assignee
                </Label>
                <Select
                  value={formData.assigneeId || ""}
                  onValueChange={(value) => handleSelectChange("assigneeId", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Dependencies</Label>
                <div className="col-span-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-between"
                    onClick={() => setDependencyManagerOpen(true)}
                  >
                    <span>Manage Dependencies</span>
                    <LinkIcon className="h-4 w-4 ml-2" />
                  </Button>

                  {formData.dependencies && formData.dependencies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.dependencies.map((depId) => {
                        const depTask = allTasks.find((t) => t.id === depId)
                        return depTask ? (
                          <Badge key={depId} variant="outline" className="text-xs">
                            {depTask.title}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TaskDependencyManager
        task={formData as Task}
        allTasks={allTasks}
        open={dependencyManagerOpen}
        onOpenChange={setDependencyManagerOpen}
        onSave={handleSaveDependencies}
      />
    </>
  )
}

