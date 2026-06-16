import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, List, Columns, Calendar, Users, ArrowUpDown, CheckSquare, X } from 'lucide-react'
import { arrayMove } from '@dnd-kit/sortable'
import { api } from '../../lib/api'
import { useTeam } from '../../contexts/TeamContext'
import { useRealtime } from '../../hooks/useRealtime'
import { TaskTableView } from './TaskTableView'
import { SortableTaskList } from './SortableTaskList'
import { KanbanView } from './KanbanView'
import { CalendarView } from './CalendarView'
import { PodsView } from './PodsView'
import { NewTaskModal } from './NewTaskModal'
import { EmptyState } from '../../components/ui/EmptyState'
import { FacetedFilter } from '../../components/ui/FacetedFilter'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../lib/constants'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'

const SORT_OPTIONS = [
  { id: 'manual', label: 'Manual order' },
  { id: 'created_desc', label: 'Newest first' },
  { id: 'due_asc', label: 'Due date ↑' },
  { id: 'due_desc', label: 'Due date ↓' },
  { id: 'priority', label: 'Priority' },
]

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }
const TERMINAL_STATUSES = new Set(['done', 'rejected', 'couldnt_do'])

function sortGroup(tasks: any[], sort: string) {
  const copy = [...tasks]
  switch (sort) {
    case 'due_asc':
      return copy.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
    case 'due_desc':
      return copy.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
      })
    case 'priority':
      return copy.sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
      )
    case 'manual':
      return copy.sort((a, b) => {
        const leftOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER
        const rightOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER
        if (leftOrder !== rightOrder) return leftOrder - rightOrder
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    default:
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}

function sortTasks(tasks: any[], sort: string) {
  const active = tasks.filter((t) => !TERMINAL_STATUSES.has(t.status))
  const terminal = tasks.filter((t) => TERMINAL_STATUSES.has(t.status))
  return [...sortGroup(active, sort), ...sortGroup(terminal, sort)]
}

const VIEWS = [
  { id: 'list',     icon: List,     label: 'List' },
  { id: 'kanban',   icon: Columns,  label: 'Kanban' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'pods',     icon: Users,    label: 'Pods' },
]

const MODES = [
  { id: 'my_tasks',   label: 'My Tasks' },
  { id: 'i_assigned', label: 'I Assigned' },
  { id: 'all',        label: 'All' },
]

export default function Work() {
  const { team, members } = useTeam()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState(() => localStorage.getItem('work_view') || 'list')
  const [mode, setMode] = useState(() => localStorage.getItem('work_mode') || 'my_tasks')
  const [showModal, setShowModal] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('todo')
  const [filters, setFilters] = useState({ priority: [] as string[], status: [] as string[] })
  const [sort, setSort] = useState(() => localStorage.getItem('work_sort') || 'created_desc')
  const [search, setSearch] = useState('')

  useEffect(() => { localStorage.setItem('work_view', view) }, [view])
  useEffect(() => { localStorage.setItem('work_mode', mode) }, [mode])
  useEffect(() => { localStorage.setItem('work_sort', sort) }, [sort])

  const loadTasks = useCallback(async () => {
    if (!team) return
    setLoading(true)
    try {
      const params: Record<string, any> = { mode: mode === 'all' ? undefined : mode }
      const { tasks: data } = await api.getTasks(team.id, params)
      setTasks(data || [])
    } finally {
      setLoading(false)
    }
  }, [team?.id, mode])

  useEffect(() => { loadTasks() }, [loadTasks])

  useRealtime('tasks', team ? { filter: `team_id=eq.${team.id}` } : null, () => loadTasks())

  function handleCreated(task: any) { setTasks((prev) => [task, ...prev]) }
  function handleUpdate(updated: any) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t))
  }
  function handleDelete(id: string) { setTasks((prev) => prev.filter((t) => t.id !== id)) }

  function openModalForColumn(status: string) {
    setDefaultStatus(status)
    setShowModal(true)
  }

  async function handleReorder(activeId: string, overId: string) {
    const oldIndex = displayedTasks.findIndex((t) => t.id === activeId)
    const newIndex = displayedTasks.findIndex((t) => t.id === overId)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(displayedTasks, oldIndex, newIndex)
    setTasks((prev) => {
      const reorderedIds = new Set(reordered.map((t) => t.id))
      return [...reordered, ...prev.filter((t) => !reorderedIds.has(t.id))]
    })
    try {
      const projectId = reordered[0]?.project_id ?? null
      await api.reorderTasks(team!.id, projectId, reordered.map((t) => t.id))
    } catch (err: any) {
      toast.error(err.message)
      loadTasks()
    }
  }

  const activeFilters = filters.priority.length > 0 || filters.status.length > 0
  const sortedTasks = useMemo(() => sortTasks(tasks, sort), [tasks, sort])
  const displayedTasks = useMemo(() => {
    let result = sortedTasks
    if (filters.priority.length > 0) result = result.filter((t) => filters.priority.includes(t.priority))
    if (filters.status.length > 0) result = result.filter((t) => filters.status.includes(t.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    return result
  }, [sortedTasks, filters.priority, filters.status, search])

  const priorityCounts = useMemo(() =>
    tasks.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc }, {} as Record<string, number>)
  , [tasks])
  const statusCounts = useMemo(() =>
    tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc }, {} as Record<string, number>)
  , [tasks])

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1">
            {VIEWS.map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant="ghost"
                size="sm"
                onClick={() => setView(id)}
                title={label}
                className={cn(
                  'h-7 px-2.5 text-xs font-medium',
                  view === id
                    ? 'bg-background text-foreground shadow-sm hover:bg-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => { setDefaultStatus('todo'); setShowModal(true) }}
          >
            <Plus data-icon="inline-start" />
            New Task
          </Button>
        </div>
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={setMode} className="mb-4">
        <TabsList>
          {MODES.map((m) => (
            <TabsTrigger key={m.id} value={m.id}>
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Toolbar: search + filters + sort */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:gap-x-2">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tasks..."
              className="h-8 pr-8 text-sm"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearch('')}
                className="absolute right-0 top-0 size-8 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>

          {/* Faceted filters */}
          <div className="flex gap-x-2">
            <FacetedFilter
              title="Status"
              values={filters.status}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              options={TASK_STATUSES.map((s: any) => ({ label: s.label, value: s.id, count: statusCounts[s.id] }))}
            />
            <FacetedFilter
              title="Priority"
              values={filters.priority}
              onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
              options={TASK_PRIORITIES.map((p: any) => ({ label: p.label, value: p.id, count: priorityCounts[p.id] }))}
            />
          </div>

          {(activeFilters || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilters({ priority: [], status: [] }); setSearch('') }}
              className="h-8 px-2 text-xs text-muted-foreground"
            >
              Reset
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {!loading && tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={(activeFilters || search) ? 'No tasks match these filters' : 'No tasks here'}
          description={
            (activeFilters || search)
              ? 'Try adjusting your filters or clearing them to see all tasks.'
              : mode === 'my_tasks'
              ? 'No tasks assigned to you yet.'
              : mode === 'i_assigned'
              ? "You haven't assigned any tasks yet."
              : 'No tasks in this workspace yet.'
          }
          action={
            (activeFilters || search) ? (
              <Button variant="secondary" onClick={() => { setFilters({ priority: [], status: [] }); setSearch('') }}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="size-4" />
                Create task
              </Button>
            )
          }
        />
      ) : view === 'list' ? (
        <>
          <div className="sm:hidden">
            <SortableTaskList
              tasks={displayedTasks}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onReorder={sort === 'manual' ? handleReorder : undefined}
            />
          </div>
          <div className="hidden sm:block">
            <TaskTableView tasks={displayedTasks} onUpdate={handleUpdate} onDelete={handleDelete} draggable={sort === 'manual'} />
          </div>
        </>
      ) : view === 'kanban' ? (
        <KanbanView
          tasks={displayedTasks}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddTask={openModalForColumn}
        />
      ) : view === 'calendar' ? (
        <CalendarView tasks={displayedTasks} />
      ) : (
        <PodsView tasks={displayedTasks} members={members} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}

      <NewTaskModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
