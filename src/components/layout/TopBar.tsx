import { useState, useEffect } from 'react'
import { Bell, Sun, Moon, Search, FileText, CheckSquare, FolderKanban } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useTeam } from '../../contexts/TeamContext'
import { Avatar } from '../ui/UserAvatar'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { SidebarTrigger } from '../ui/sidebar'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '../../lib/utils'

interface TopBarProps {
  title: string
}

function GlobalSearch() {
  const { team } = useTeam()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ posts: any[]; tasks: any[]; projects: any[] } | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!query.trim() || !team) { setResults(null); return }
    const id = setTimeout(() => runSearch(query.trim()), 280)
    return () => clearTimeout(id)
  }, [query, team?.id])

  async function runSearch(q: string) {
    setSearching(true)
    const pattern = `%${q}%`
    const [postsRes, tasksRes, projectsRes] = await Promise.all([
      supabase.from('posts').select('id, caption, status').eq('team_id', team!.id).ilike('caption', pattern).limit(5),
      supabase.from('tasks').select('id, title, status, priority').eq('team_id', team!.id).ilike('title', pattern).limit(5),
      supabase.from('projects').select('id, name, status').eq('team_id', team!.id).ilike('name', pattern).limit(5),
    ])
    setResults({
      posts: postsRes.data || [],
      tasks: tasksRes.data || [],
      projects: projectsRes.data || [],
    })
    setSearching(false)
  }

  function handleSelect(path: string) {
    setOpen(false)
    setQuery('')
    setResults(null)
    navigate(path)
  }

  const hasResults = results && (results.posts.length + results.tasks.length + results.projects.length) > 0

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 w-52 lg:w-64 justify-start text-muted-foreground font-normal"
      >
        <Search data-icon="inline-start" className="size-3.5" />
        <span className="flex-1 text-left text-sm">Search…</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden max-w-lg">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search posts, tasks, projects…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {!query.trim() && (
                <CommandEmpty>Type to search across your workspace.</CommandEmpty>
              )}
              {query.trim() && searching && (
                <CommandEmpty>Searching…</CommandEmpty>
              )}
              {query.trim() && !searching && !hasResults && (
                <CommandEmpty>No results for &quot;{query}&quot;</CommandEmpty>
              )}
              {results?.posts && results.posts.length > 0 && (
                <CommandGroup heading="Posts">
                  {results.posts.map((p) => (
                    <CommandItem key={p.id} onSelect={() => handleSelect('/posts')}>
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{p.caption || '(no caption)'}</span>
                      <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">{p.status}</Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results?.tasks && results.tasks.length > 0 && (
                <>
                  {results.posts.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="Tasks">
                    {results.tasks.map((t) => (
                      <CommandItem key={t.id} onSelect={() => handleSelect('/work')}>
                        <CheckSquare className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{t.title}</span>
                        <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">{t.status}</Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {results?.projects && results.projects.length > 0 && (
                <>
                  {(results.posts.length > 0 || results.tasks.length > 0) && <CommandSeparator />}
                  <CommandGroup heading="Projects">
                    {results.projects.map((p) => (
                      <CommandItem key={p.id} onSelect={() => handleSelect('/projects')}>
                        <FolderKanban className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{p.name}</span>
                        <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">{p.status}</Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.getNotifications()
      .then(({ notifications }) => setUnread((notifications || []).filter((n: any) => !n.read).length))
      .catch(() => {})
  }, [])

  async function handleOpen(next: boolean) {
    if (next) {
      const { notifications } = await api.getNotifications()
      setNotifs(notifications || [])
      setUnread((notifications || []).filter((n: any) => !n.read).length)
    }
    setOpen(next)
  }

  async function markAllRead() {
    await api.markAllRead()
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 size-[7px] rounded-full bg-destructive ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-auto py-0 px-0 text-xs text-primary">
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notifs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 border-b border-border px-4 py-3 last:border-0',
                  !n.read && 'bg-accent/40'
                )}
              >
                {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                <div className={!n.read ? '' : 'ml-[18px]'}>
                  <p className="text-sm">{n.content}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export function TopBar({ title }: TopBarProps) {
  const { dark, toggleDark } = useTheme()
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-4 border-b border-border bg-background sticky top-0 z-30">
      <SidebarTrigger />

      <Separator orientation="vertical" className="h-4" />

      <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
        {title}
      </h1>

      <GlobalSearch />

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDark}
        className="text-muted-foreground"
        aria-label="Toggle theme"
      >
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>

      <NotificationsBell />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/settings')}
        className="size-8 rounded-full p-0"
        aria-label="Profile"
      >
        <Avatar name={profile?.name} src={profile?.avatar_url} size="sm" />
      </Button>
    </header>
  )
}
