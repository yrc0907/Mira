"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  dueDate?: string
  label?: string
  createdAt: string
  updatedAt: string
}

interface TaskDetailDialogProps {
  boardId: string
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdated: () => void
  onTaskDeleted: () => void
}

export function TaskDetailDialog({
  boardId,
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')
  const [label, setLabel] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const { toast } = useToast()

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setLabel(task.label || '')
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/boards/${boardId}/tasks/${task?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          label: label.trim() || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      // Exit edit mode and refresh tasks
      setIsEditMode(false)
      onTaskUpdated()

      toast({
        title: 'Success',
        description: 'Task updated successfully!',
      })
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update task',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!task) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/boards/${boardId}/tasks/${task.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      // Close dialogs and refresh tasks
      setIsDeleteDialogOpen(false)
      onClose()
      onTaskDeleted()

      toast({
        title: 'Success',
        description: 'Task deleted successfully!',
      })
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete task',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDialogClose = () => {
    if (!isSubmitting) {
      setIsEditMode(false)
      onClose()
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'todo':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'in-progress':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'todo':
        return 'To Do'
      case 'in-progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  if (!task) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Task' : 'Task Details'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? 'Make changes to this task using the form below.'
                  : `Created on ${new Date(task.createdAt).toLocaleDateString()}`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {isEditMode ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter task title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      placeholder="Add a description for your task"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      aria-label="Task status"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="label">Label</Label>
                    <Input
                      id="label"
                      placeholder="E.g., Design, Development, Research"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mt-2">{task.title}</h2>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      {getStatusIcon()}
                      <span>{getStatusText()}</span>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1 ml-4">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {task.label && (
                    <div className="mt-2">
                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {task.label}
                      </span>
                    </div>
                  )}

                  {task.description && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                      <p className="text-sm whitespace-pre-line">{task.description}</p>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>Last updated: {new Date(task.updatedAt).toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between">
              {isEditMode ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditMode(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !title.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="ml-auto"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                  >
                    Edit Task
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 