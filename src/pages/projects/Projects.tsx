import { useState, useEffect, useCallback } from 'react'
import { Plus, FolderKanban } from 'lucide-react'
import { api } from '../../lib/api'
import { useTeam } from '../../contexts/TeamContext'
import { useRealtime } from '../../hooks/useRealtime'
import { ProjectCard } from './ProjectCard'
import { NewProjectModal } from './NewProjectModal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'

const STATUS_FILTERS = [
  { id: '',          label: 'All' },
  { id: 'planning',  label: 'Planning' },
  { id: 'active',    label: 'Active' },
  { id: 'on_hold',   label: 'On Hold' },
  { id: 'completed', label: 'Completed' },
]

export default function Projects() {
  const { team } = useTeam()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const loadProjects = useCallback(async () => {
    if (!team) return
    setLoading(true)
    try {
      const { projects: data } = await api.getProjects(team.id)
      setProjects(data || [])
    } finally {
      setLoading(false)
    }
  }, [team?.id])

  useEffect(() => { loadProjects() }, [loadProjects])

  useRealtime('projects', team ? { filter: `team_id=eq.${team.id}` } : null, () => loadProjects())

  function handleCreated(project: any) { setProjects((prev) => [project, ...prev]) }
  function handleUpdate(updated: any) {
    setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p))
  }
  function handleDelete(id: string) { setProjects((prev) => prev.filter((p) => p.id !== id)) }

  const displayed = statusFilter
    ? projects.filter((p) => p.status === statusFilter)
    : projects

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</p>
        </div>
        <Button size="sm" className="self-start sm:self-auto" onClick={() => setShowModal(true)}>
          <Plus data-icon="inline-start" />
          New Project
        </Button>
      </div>

      <Tabs value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)} className="mb-5">
        <TabsList className="mobile-scroll-row">
          {STATUS_FILTERS.map((f) => (
            <TabsTrigger key={f.id} value={f.id || '__all__'}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!loading && displayed.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={statusFilter ? 'No projects with this status' : 'No projects yet'}
          description={
            statusFilter
              ? 'Try a different filter to see projects.'
              : 'Create your first project to organise tasks.'
          }
          action={
            statusFilter ? (
              <Button variant="secondary" onClick={() => setStatusFilter('')}>
                Clear filter
              </Button>
            ) : (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="size-4" />
                Create project
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <NewProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
