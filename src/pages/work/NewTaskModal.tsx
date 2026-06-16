import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Separator } from '../../components/ui/separator'
import { TASK_PRIORITIES } from '../../lib/constants'
import { CREATOR_STATUS_OPTIONS } from '../../lib/taskStatusRules'
import { api } from '../../lib/api'
import { useTeam } from '../../contexts/TeamContext'
import { toast } from 'sonner'

function useProjects(teamId: string | undefined) {
  const [projects, setProjects] = useState<any[]>([])
  useEffect(() => {
    if (!teamId) return
    api.getProjects(teamId).then(({ projects: p }: any) => setProjects(p || [])).catch(() => {})
  }, [teamId])
  return projects
}

const DRAFT_KEY = 'draft_new_task'
const DEFAULT_CREATOR_STATUS = 'todo'

function normalizeStatus(status: string) {
  return CREATOR_STATUS_OPTIONS.some((option) => option.status === status)
    ? status
    : DEFAULT_CREATOR_STATUS
}

function buildForm(task: any, defaultStatus: string) {
  const multiAssigneeIds = task?.task_assignees?.map((a: any) => a.user_id) || []
  return {
    title: task?.title || '',
    description: task?.description || '',
    assignee_id: task?.assignee_id || '',
    assignee_ids: multiAssigneeIds as string[],
    use_multi_assignees: multiAssigneeIds.length > 0,
    priority: task?.priority || 'medium',
    status: normalizeStatus(task?.status || defaultStatus),
    due_date: task?.due_date || '',
    visibility: task?.visibility || 'team',
    project_id: task?.project_id || '',
    reopen_note: '',
  }
}

export function NewTaskModal({
  open,
  onClose,
  onCreated,
  onSaved,
  defaultStatus = 'todo',
  task = null,
  title = null,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (task: any) => void
  onSaved?: (task: any) => void
  defaultStatus?: string
  task?: any
  title?: string | null
}) {
  const { team, members } = useTeam()
  const [form, setForm] = useState(buildForm(task, defaultStatus))
  const [saving, setSaving] = useState(false)
  const projects = useProjects(team?.id)

  const isEditing = Boolean(task)

  useEffect(() => {
    if (!open) return
    if (task) {
      setForm(buildForm(task, defaultStatus))
    } else {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) setForm({ ...buildForm(null, defaultStatus), ...JSON.parse(saved) })
        else setForm(buildForm(null, defaultStatus))
      } catch {
        setForm(buildForm(null, defaultStatus))
      }
    }
  }, [task, defaultStatus, open])

  useEffect(() => {
    if (!open || isEditing) return
    const draftable: any = { ...form }
    delete draftable.reopen_note
    delete draftable.due_date
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftable))
  }, [form, open, isEditing])

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))
  const wasCouldntDo = task?.status === 'couldnt_do'
  const assigneeChanged = isEditing && (task.assignee_id || '') !== (form.assignee_id || '')
  const multiAssigneesChanged = isEditing &&
    JSON.stringify(task?.task_assignees?.map((a: any) => a.user_id) || []) !== JSON.stringify(form.assignee_ids)
  const statusChanged = isEditing && task.status !== form.status
  const reopenedFromCouldntDo = wasCouldntDo && (assigneeChanged || multiAssigneesChanged || statusChanged)

  function toggleMultiAssign(enabled: boolean) {
    setForm((c) => ({
      ...c,
      use_multi_assignees: enabled,
      assignee_ids: enabled
        ? Array.from(new Set([...(c.assignee_ids || []), ...(c.assignee_id ? [c.assignee_id] : [])]))
        : [],
      assignee_id: enabled ? '' : c.assignee_id,
    }))
  }

  function toggleAssignee(userId: string) {
    setForm((c) => ({
      ...c,
      assignee_ids: c.assignee_ids.includes(userId)
        ? c.assignee_ids.filter((id) => id !== userId)
        : [...c.assignee_ids, userId],
      assignee_id: '',
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Task title required')
    if (reopenedFromCouldntDo && !form.reopen_note.trim()) {
      return toast.error('Add a reopen reason before reassigning or reopening this ticket')
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        assignee_id: form.use_multi_assignees ? null : form.assignee_id || null,
        priority: form.priority,
        status:
          wasCouldntDo && assigneeChanged && form.status === 'couldnt_do'
            ? 'todo'
            : form.status,
        due_date: form.due_date || null,
        visibility: form.visibility,
        project_id: form.project_id || null,
      }

      let savedTask: any
      if (isEditing) {
        const { task: updated } = await api.updateTask(team!.id, task.id, payload)
        savedTask = updated
      } else {
        const { task: created } = await api.createTask(team!.id, payload)
        savedTask = created
      }

      if (form.use_multi_assignees) {
        const { task: t } = await api.setTaskAssignees(savedTask.id, form.assignee_ids)
        savedTask = t
      } else if (task?.task_assignees?.length) {
        const { task: t } = await api.setTaskAssignees(savedTask.id, [])
        savedTask = t
      }

      if (isEditing && reopenedFromCouldntDo) {
        await api.addTaskComment(
          task.id,
          `↩ Reopened by ${members.find((m) => m.user_id === savedTask.created_by)?.profiles?.name || 'creator'}: ${form.reopen_note.trim()}`
        )
        const { task: refreshed } = await api.updateTask(team!.id, task.id, {})
        savedTask = refreshed
      }

      if (isEditing) {
        onSaved?.(savedTask)
        toast.success('Ticket updated!')
      } else {
        onCreated?.(savedTask)
        localStorage.removeItem(DRAFT_KEY)
        toast.success('Task created!')
      }

      onClose()
      setForm(buildForm(null, defaultStatus))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-xl max-h-[88vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-[15px] tracking-tight">
            {title || (isEditing ? 'Edit Ticket' : 'New Task')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5">
          <div className="flex flex-col gap-4">

            <div className="flex flex-col gap-2">
              <Label htmlFor="task-title">Task name *</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Write LinkedIn post copy"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Optional details…"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Assign to</Label>
                {!form.use_multi_assignees ? (
                  <Select value={form.assignee_id || '__none__'} onValueChange={(v) => set('assignee_id', v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>{m.profiles?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 flex flex-col gap-2 max-h-44 overflow-y-auto">
                    {members.map((m) => {
                      const checked = form.assignee_ids.includes(m.user_id)
                      return (
                        <label key={m.user_id} className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleAssignee(m.user_id)}
                          />
                          <span className="text-sm text-foreground">{m.profiles?.name}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => toggleMultiAssign(!form.use_multi_assignees)}
                  className="h-auto p-0 text-xs justify-start"
                >
                  {form.use_multi_assignees ? 'Use single assignee' : 'Assign to multiple people'}
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATOR_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.status}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => set('due_date', e.target.value)}
                  className="[color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {reopenedFromCouldntDo && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="reopen-note">Reopen reason *</Label>
                <Textarea
                  id="reopen-note"
                  value={form.reopen_note}
                  onChange={(e) => set('reopen_note', e.target.value)}
                  placeholder="Why are you reopening or reassigning this ticket?"
                  rows={3}
                  className="resize-none"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Visibility</Label>
              <div className="flex gap-2">
                {[{ id: 'team', label: 'Team' }, { id: 'private', label: 'Only me' }].map((v) => (
                  <Button
                    key={v.id}
                    type="button"
                    variant={form.visibility === v.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set('visibility', v.id)}
                    className="flex-1"
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
            </div>

            {projects.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Link to project</Label>
                <Select value={form.project_id || '__none__'} onValueChange={(v) => set('project_id', v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No project</SelectItem>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save Ticket' : 'Create Task')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
