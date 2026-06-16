import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, CheckSquare } from 'lucide-react'
import { arrayMove } from '@dnd-kit/sortable'
import { api } from '../../lib/api'
import { useTeam } from '../../contexts/TeamContext'
import { SortableTaskList } from '../work/SortableTaskList'
import { NewProjectModal } from './NewProjectModal'
import { NewTaskModal } from '../work/NewTaskModal'
import { ProjectGoals } from './ProjectGoals'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  planning:  'secondary',
  active:    'default',
  on_hold:   'outline',
  completed: 'secondary',
}

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning', active: 'Active', on_hold: 'On Hold', completed: 'Completed',
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { team } = useTeam()
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditProject, setShowEditProject] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !team) return
    setLoading(true)
    try {
      const [{ project: p }, { tasks: t }] = await Promise.all([
        api.getProject(projectId),
        api.getTasks(team.id, { project_id: projectId }),
      ])
      setProject(p)
      setTasks(t || [])
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, team?.id])

  useEffect(() => { load() }, [load])

  function handleTaskUpdate(updated: any) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t))
  }
  function handleTaskDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }
  function handleTaskCreated(task: any) {
    setTasks((prev) => [task, ...prev])
  }

  async function handleReorder(activeId: string, overId: string) {
    if (!team) return
    const oldIndex = tasks.findIndex((t) => t.id === activeId)
    const newIndex = tasks.findIndex((t) => t.id === overId)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(tasks, oldIndex, newIndex)
    setTasks(reordered)
    try {
      await api.reorderTasks(team.id, projectId!, reordered.map((t) => t.id))
    } catch (err: any) {
      toast.error(err.message)
      setTasks(tasks)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <p className="text-muted-foreground text-sm">Project not found.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          className="mb-4 -ml-2 text-muted-foreground"
        >
          <ArrowLeft data-icon="inline-start" className="size-4" />
          All Projects
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold tracking-tight">{project.name}</h2>
              <Badge variant={STATUS_VARIANTS[project.status] ?? 'secondary'}>
                {STATUS_LABELS[project.status] || project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowEditProject(true)}>
              <Pencil data-icon="inline-start" className="size-4" />
              Edit
            </Button>
            <Button size="sm" onClick={() => setShowNewTask(true)}>
              <Plus data-icon="inline-start" className="size-4" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <CheckSquare className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create the first task for this project.</p>
          <Button size="sm" onClick={() => setShowNewTask(true)} className="mt-4">
            <Plus data-icon="inline-start" className="size-4" />
            Create task
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} · drag to reorder</p>
          <SortableTaskList tasks={tasks} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} onReorder={handleReorder} />
        </div>
      )}

      {project && <ProjectGoals projectId={project.id} teamId={project.team_id} />}

      <NewProjectModal
        open={showEditProject}
        onClose={() => setShowEditProject(false)}
        project={project}
        onSaved={(updated) => setProject(updated)}
      />

      <NewTaskModal
        open={showNewTask}
        onClose={() => setShowNewTask(false)}
        onCreated={handleTaskCreated}
        defaultStatus="todo"
      />
    </div>
  )
}
