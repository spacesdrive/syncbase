import { useState, useEffect, useCallback } from 'react'
import { Plus, Target, Trash2, Pencil, X, ChevronUp, ChevronDown, Calendar, ArrowUp, ArrowDown, Check, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active:    { label: 'Active',    variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  on_hold:   { label: 'On Hold',   variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
}

interface GoalForm {
  title: string
  description: string
  status: string
  progress: number
  deadline: string
}

const EMPTY: GoalForm = { title: '', description: '', status: 'active', progress: 0, deadline: '' }

function GoalCard({ goal, onUpdate, onDelete, onEdit, reorderMode, onMoveUp, onMoveDown, isFirst, isLast }: {
  goal: any
  onUpdate: (g: any) => void
  onDelete: (id: string) => void
  onEdit: (g: any) => void
  reorderMode?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  const [updating, setUpdating] = useState(false)
  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && goal.status !== 'completed'
  const status = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.active
  const progress = goal.progress ?? 0

  async function adjustProgress(delta: number) {
    const next = Math.max(0, Math.min(100, progress + delta))
    const nextStatus = next >= 100 ? 'completed'
      : (goal.status === 'completed' && next < 100) ? 'active'
      : goal.status
    setUpdating(true)
    try {
      const { goal: updated } = await api.updateProjectGoal(goal.id, { progress: next, status: nextStatus })
      onUpdate(updated)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this goal?')) return
    try {
      await api.deleteProjectGoal(goal.id)
      onDelete(goal.id)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            {goal.deadline && (
              <span className={cn('flex items-center gap-1 text-[11px]', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                <Calendar className="size-3" />
                {format(new Date(goal.deadline), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          <p className={cn('text-sm font-medium leading-snug', goal.status === 'completed' && 'line-through text-muted-foreground')}>
            {goal.title}
          </p>
          {goal.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{goal.description}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {reorderMode ? (
            <>
              <Button variant="ghost" size="icon" className="size-7" onClick={onMoveUp} disabled={isFirst} title="Move up">
                <ArrowUp className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={onMoveDown} disabled={isLast} title="Move down">
                <ArrowDown className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(goal)} title="Edit goal">
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={handleDelete} title="Delete goal">
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Progress</span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost" size="icon" className="size-6"
              onClick={() => adjustProgress(-10)}
              disabled={updating || progress <= 0}
              title="-10%"
            >
              <ChevronDown className="size-4" />
            </Button>
            <span className="text-xs font-semibold w-9 text-center tabular-nums">{progress}%</span>
            <Button
              variant="ghost" size="icon" className="size-6"
              onClick={() => adjustProgress(10)}
              disabled={updating || progress >= 100}
              title="+10%"
            >
              <ChevronUp className="size-4" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </Card>
  )
}

export function ProjectGoals({ projectId, teamId }: { projectId: string; teamId: string }) {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<any>(null)
  const [form, setForm] = useState<GoalForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  const loadGoals = useCallback(async () => {
    try {
      const { goals: data } = await api.getProjectGoals(projectId)
      setGoals(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { loadGoals() }, [loadGoals])

  function setField<K extends keyof GoalForm>(key: K, value: GoalForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openCreate() {
    setEditGoal(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(goal: any) {
    setEditGoal(goal)
    setForm({
      title: goal.title || '',
      description: goal.description || '',
      status: goal.status || 'active',
      progress: goal.progress ?? 0,
      deadline: goal.deadline || '',
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditGoal(null)
    setForm(EMPTY)
  }

  function moveGoal(index: number, direction: -1 | 1) {
    const next = [...goals]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= next.length) return
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    setGoals(next)
  }

  async function saveOrder() {
    setSavingOrder(true)
    try {
      await api.reorderProjectGoals(goals.map((g) => g.id))
      setReorderMode(false)
      toast.success('Order saved')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingOrder(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        progress: form.progress,
        deadline: form.deadline || null,
      }
      if (editGoal) {
        const { goal } = await api.updateProjectGoal(editGoal.id, payload)
        setGoals((prev) => prev.map((g) => g.id === goal.id ? goal : g))
        toast.success('Goal updated')
      } else {
        const { goal } = await api.createProjectGoal(projectId, teamId, payload)
        setGoals((prev) => [...prev, goal])
        toast.success('Goal added')
      }
      cancelForm()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const activeCount = goals.filter((g) => g.status === 'active').length
  const completedCount = goals.filter((g) => g.status === 'completed').length

  if (loading) return null

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Goals</h3>
          {goals.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {activeCount} active{completedCount > 0 ? ` · ${completedCount} done` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {goals.length > 1 && (
            reorderMode ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                onClick={saveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? <Loader2 data-icon="inline-start" className="animate-spin size-3" /> : <Check data-icon="inline-start" className="size-3" />}
                {savingOrder ? 'Saving…' : 'Done'}
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => setReorderMode(true)}>
                Reorder
              </Button>
            )
          )}
          {!reorderMode && (
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={openCreate}>
              <Plus data-icon="inline-start" className="size-3" />
              Add Goal
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="mb-4 border-primary/20 ring-1 ring-primary/10">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {editGoal ? 'Edit Goal' : 'New Goal'}
                </p>
                <Button type="button" variant="ghost" size="icon" className="size-6" onClick={cancelForm}>
                  <X className="size-3.5" />
                </Button>
              </div>

              <Input
                autoFocus
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Goal title…"
                required
              />

              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Description (optional)…"
                rows={2}
                className="resize-none text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setField('status', v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Deadline</Label>
                  <Input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setField('deadline', e.target.value)}
                    className="[color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Progress — <span className="font-semibold text-foreground">{form.progress}%</span>
                </Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.progress}
                  onChange={(e) => setField('progress', Number(e.target.value))}
                  className="w-full accent-primary h-1.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={cancelForm}>Cancel</Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving && <Loader2 data-icon="inline-start" className="animate-spin size-3" />}
                  {saving ? (editGoal ? 'Saving…' : 'Adding…') : (editGoal ? 'Save Goal' : 'Add Goal')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No goals yet.</p>
          <Button variant="link" size="sm" onClick={openCreate} className="mt-1 h-auto p-0 text-xs">
            Add the first goal
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal, idx) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdate={(g) => setGoals((prev) => prev.map((x) => x.id === g.id ? g : x))}
              onDelete={(id) => setGoals((prev) => prev.filter((g) => g.id !== id))}
              onEdit={openEdit}
              reorderMode={reorderMode}
              onMoveUp={() => moveGoal(idx, -1)}
              onMoveDown={() => moveGoal(idx, 1)}
              isFirst={idx === 0}
              isLast={idx === goals.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
