"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TaskBoard from "@/components/task-board"
import TeamManagement from "@/components/team-management"
import TaskAssignment from "@/components/task-assignment"
import { Header } from "@/components/header"
import type { Task, User, AssignmentResult } from "@/types/types"
import { fetchTasks, fetchUsers, assignTasksToUsers, createTask, updateTask } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TaskForm } from "@/components/task-form"
import FlowGraph from "./flow-graph"

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("board")

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [tasksData, usersData] = await Promise.all([fetchTasks(), fetchUsers()])
        setTasks(tasksData)
        setUsers(usersData)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleTaskAssignment = async () => {
    try {
      setIsLoading(true)
      const result = await assignTasksToUsers(tasks, users)
      setAssignmentResult(result)

      // Update tasks with new assignments
      if (result.assignedTasks.length > 0) {
        const updatedTasks = [...tasks]

        result.assignedTasks.forEach((assignment: { taskId: string; userId: string }) => {
          const taskIndex = updatedTasks.findIndex((t) => t.id === assignment.taskId)
          if (taskIndex !== -1) {
            updatedTasks[taskIndex] = {
              ...updatedTasks[taskIndex],
              assigneeId: assignment.userId,
            }
          }
        })

        setTasks(updatedTasks)
      }
    } catch (error) {
      console.error("Failed to assign tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      setIsLoading(true)
      const newTask = await createTask(taskData)
      setTasks([...tasks, newTask])
    } catch (error) {
      console.error("Failed to create task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!taskData.id) return

    try {
      setIsLoading(true)
      const updatedTask = await updateTask(taskData)

      setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))

      setEditingTask(undefined)
    } catch (error) {
      console.error("Failed to update task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      handleUpdateTask({ ...taskData, id: editingTask.id })
    } else {
      handleCreateTask(taskData)
    }
  }

  const openEditTaskForm = (task: Task) => {
    setEditingTask(task)
    setTaskFormOpen(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-1 container mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center mb-8">
            <TabsList className="bg-muted/50 p-1 rounded-lg">
              <TabsTrigger
                value="board"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Task Board
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Team Management
              </TabsTrigger>
              <TabsTrigger
                value="assignment"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Task Assignment
              </TabsTrigger>
              <TabsTrigger
                value="flow-graph"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Flow Graph
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => {
                setEditingTask(undefined)
                setTaskFormOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>

          <TabsContent value="board" className="mt-0">
            <TaskBoard tasks={tasks} users={users} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="team" className="mt-0">
            <TeamManagement users={users} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="assignment" className="mt-0">
            <TaskAssignment
              tasks={tasks}
              users={users}
              assignmentResult={assignmentResult}
              onAssign={handleTaskAssignment}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="flow-graph" className="mt-0">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-medium">Max Flow Visualization</h2>
                  <p className="text-muted-foreground">
                    Visual representation of the bipartite graph used for task assignment
                  </p>
                </div>
                <Button
                  onClick={handleTaskAssignment}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Run Assignment Algorithm
                </Button>
              </div>

              {activeTab === "flow-graph" && (
                <FlowGraph tasks={tasks} users={users} assignedPairs={assignmentResult?.assignedTasks || []} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <TaskForm
        task={editingTask}
        allTasks={tasks}
        users={users}
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        onSave={handleSaveTask}
      />
    </div>
  )
}

