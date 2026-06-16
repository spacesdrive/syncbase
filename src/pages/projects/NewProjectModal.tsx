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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Separator } from '../../components/ui/separator'
import { api } from '../../lib/api'
import { useTeam } from '../../contexts/TeamContext'
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  { id: 'planning',  label: 'Planning' },
  { id: 'active',    label: 'Active' },
  { id: 'on_hold',   label: 'On Hold' },
  { id: 'completed', label: 'Completed' },
]

function buildForm(project: any) {
  return {
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
  }
}

export function NewProjectModal({
  open,
  onClose,
  onCreated,
  onSaved,
  project = null,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (project: any) => void
  onSaved?: (project: any) => void
  project?: any
}) {
  const { team } = useTeam()
  const [form, setForm] = useState(buildForm(project))
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(project)

  useEffect(() => {
    if (open) setForm(buildForm(project))
  }, [project, open])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Project name is required')
    setSaving(true)
    try {
      if (isEditing) {
        const { project: updated } = await api.updateProject(team.id, project.id, {
          name: form.name.trim(),
          description: form.description || null,
          status: form.status,
        })
        onSaved?.(updated)
        toast.success('Project updated!')
      } else {
        const { project: created } = await api.createProject(team.id, {
          name: form.name.trim(),
          description: form.description || null,
          status: form.status,
        })
        onCreated?.(created)
        toast.success('Project created!')
      }
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Project name *</Label>
            <Input
              id="project-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Q3 Marketing Campaign"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional details…"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save Project' : 'Create Project')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
