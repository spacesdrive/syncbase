import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  MessageSquare,
  CheckSquare,
  FolderOpen,
  BookOpen,
  Files,
  Settings,
  LogOut,
  Users,
  MoreVertical,
  ChevronRight,
  Plus,
  ChevronsUpDown,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTeam } from '../../contexts/TeamContext'
import { Avatar } from '../ui/UserAvatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '../ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'

const NAV_MAIN = [
  { to: '/posts',    icon: LayoutGrid,    label: 'Posts' },
  { to: '/chat',     icon: MessageSquare, label: 'Chat' },
  { to: '/work',     icon: CheckSquare,   label: 'Work' },
  { to: '/projects', icon: FolderOpen,    label: 'Projects' },
  { to: '/wiki',     icon: BookOpen,      label: 'Wiki' },
  { to: '/info',     icon: Files,         label: 'Files & Info' },
]

const SETTINGS_CHILDREN = [
  { to: '/settings',               label: 'Profile' },
  { to: '/settings/account',       label: 'Account' },
  { to: '/settings/appearance',    label: 'Appearance' },
  { to: '/settings/notifications', label: 'Notifications' },
  { to: '/settings/members',       label: 'Members' },
]

function TeamSwitcher() {
  const { team, switchTeam, loadAllTeams } = useTeam()
  const navigate = useNavigate()
  const { isMobile } = useSidebar()
  const [teams, setTeams] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    loadAllTeams().then(setTeams).catch(() => {})
  }, [open, loadAllTeams])

  async function handleSwitch(t: any) {
    if (t.id === team?.id) { setOpen(false); return }
    await switchTeam(t.id)
    setOpen(false)
    window.location.href = '/posts'
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-[11px] font-bold shrink-0 overflow-hidden">
                {team?.logo_url
                  ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  : team?.name?.[0]?.toUpperCase() || 'T'
                }
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{team?.name || 'Syncbase'}</span>
                <span className="truncate text-xs text-muted-foreground">Workspace</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
            {teams.map((t) => (
              <DropdownMenuItem key={t.id} onClick={() => handleSwitch(t)} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background text-[10px] font-bold overflow-hidden">
                  {t.logo_url
                    ? <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                    : t.name?.[0]?.toUpperCase()
                  }
                </div>
                <span className="truncate">{t.name}</span>
                {t.id === team?.id && <span className="ml-auto text-[10px] text-muted-foreground">Active</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { setOpen(false); navigate('/team-setup') }}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <span className="font-medium text-muted-foreground">Create or join team</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavUser() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar name={profile?.name} src={profile?.avatar_url} size="sm" className="rounded-lg grayscale shrink-0" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{profile?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
              </div>
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar name={profile?.name} src={profile?.avatar_url} size="sm" className="rounded-lg shrink-0" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{profile?.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings/members')}>
                <Users />
                Members
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut().then(() => navigate('/login'))}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavMain({ pathname }: { pathname: string }) {
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <div className="flex flex-col gap-2">
        <SidebarMenu>
          {NAV_MAIN.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.to || pathname.startsWith(item.to + '/')}
                tooltip={item.label}
              >
                <NavLink to={item.to} onClick={() => setOpenMobile(false)}>
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  )
}

function NavSettings({ pathname }: { pathname: string }) {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const isAnyActive = SETTINGS_CHILDREN.some((c) => pathname === c.to || pathname.startsWith(c.to + '/'))

  if (collapsed) {
    return (
      <SidebarGroup className="mt-auto">
        <div>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip="Settings" isActive={isAnyActive}>
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" sideOffset={4}>
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SETTINGS_CHILDREN.map((sub) => (
                    <DropdownMenuItem key={sub.to} asChild>
                      <NavLink to={sub.to} onClick={() => setOpenMobile(false)}>
                        {sub.label}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className="mt-auto">
      <div>
        <SidebarMenu>
          <Collapsible asChild defaultOpen={isAnyActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Settings" isActive={isAnyActive}>
                  <Settings />
                  <span>Settings</span>
                  <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {SETTINGS_CHILDREN.map((sub) => (
                    <SidebarMenuSubItem key={sub.to}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === sub.to || (sub.to !== '/settings' && pathname.startsWith(sub.to + '/'))}
                      >
                        <NavLink to={sub.to} onClick={() => setOpenMobile(false)}>
                          {sub.label}
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </div>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <NavMain pathname={pathname} />
        <NavSettings pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
