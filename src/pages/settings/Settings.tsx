import { useState, useRef } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import {
  UserCog, Wrench, Palette, Bell, Users, Crown, Shield,
  Copy, Check, Camera, Loader2, Trash2, Moon, Sun, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTeam } from '../../contexts/TeamContext'
import { Avatar } from '../../components/ui/UserAvatar'
import { api } from '../../lib/api'
import { uploadToCloudinary } from '../../lib/cloudinary'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Separator } from '../../components/ui/separator'
import { Switch } from '../../components/ui/switch'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'

const sidebarNavItems = [
  { title: 'Profile',       href: '/settings',               icon: UserCog },
  { title: 'Account',       href: '/settings/account',       icon: Wrench },
  { title: 'Appearance',    href: '/settings/appearance',    icon: Palette },
  { title: 'Notifications', href: '/settings/notifications', icon: Bell },
  { title: 'Members',       href: '/settings/members',       icon: Users },
]

function SidebarNav({ items }: { items: typeof sidebarNavItems }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <>
      {/* Mobile: select dropdown */}
      <div className="p-1 md:hidden">
        <Select value={pathname} onValueChange={(v) => navigate(v)}>
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <div className="flex items-center gap-3 px-2 py-1">
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: vertical nav */}
      <nav className="hidden md:flex md:flex-col md:gap-0.5">
        {items.map((item) => {
          const isActive = item.href === '/settings'
            ? pathname === '/settings' || pathname === '/settings/'
            : pathname.startsWith(item.href)
          return (
            <Button
              key={item.href}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-9 px-3 font-medium',
                !isActive && 'text-muted-foreground'
              )}
              onClick={() => navigate(item.href)}
            >
              <item.icon className="size-4 shrink-0" />
              {item.title}
              {isActive && <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />}
            </Button>
          )
        })}
      </nav>
    </>
  )
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <Separator className="mt-4" />
    </div>
  )
}

function ProfileSection() {
  const { profile, updateProfile } = useAuth()
  const { currentMember } = useTeam()
  const [name, setName] = useState(profile?.name || '')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const { url } = await uploadToCloudinary(file, 'syncbase/avatars')
      await updateProfile({ avatar_url: url })
      toast.success('Profile photo updated!')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await updateProfile({ name: name.trim() })
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile updated!')
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <SectionHeader title="Profile" desc="This is how others will see you on the site." />
      <div className="max-w-xl">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group shrink-0"
            >
              <Avatar name={profile?.name} src={profile?.avatar_url} size="xl" />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingPhoto
                  ? <Loader2 className="size-5 text-white animate-spin" />
                  : <Camera className="size-4 text-white" />}
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">{profile?.name}</p>
              <p className="text-xs text-muted-foreground">Click avatar to change photo</p>
              {currentMember?.role === 'admin' && (
                <Badge variant="secondary" className="w-fit text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
                  <Crown className="size-3 mr-1" /> Admin
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your display name"
            />
            <p className="text-xs text-muted-foreground">This is your public display name.</p>
          </div>

          <div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Update profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AccountSection() {
  const { team, isAdmin, updateTeamLocally } = useTeam()
  const [teamName, setTeamName] = useState(team?.name || '')
  const [savingTeam, setSavingTeam] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !isAdmin) return
    setUploadingLogo(true)
    try {
      const { url } = await uploadToCloudinary(file, 'syncbase/logos')
      await api.updateTeam(team.id, { logo_url: url })
      updateTeamLocally({ logo_url: url })
      toast.success('Team logo updated!')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  async function handleSaveTeamName(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim() || !isAdmin) return
    setSavingTeam(true)
    try {
      await api.updateTeam(team.id, { name: teamName.trim() })
      updateTeamLocally({ name: teamName.trim() })
      toast.success('Team name updated!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingTeam(false)
    }
  }

  async function copyInviteCode() {
    await navigator.clipboard.writeText(team?.invite_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Invite code copied!')
  }

  async function handleDeleteTeam() {
    const confirmed = confirm(`Delete "${team.name}"? This will permanently remove the team and all its data.`)
    if (!confirmed) return
    const doubleConfirm = confirm('Are you absolutely sure? All tasks, posts, and projects will be deleted forever.')
    if (!doubleConfirm) return
    setDeletingTeam(true)
    try {
      await api.deleteTeam(team.id)
      toast.success('Team deleted.')
      navigate('/team-setup')
    } catch (err: any) {
      toast.error(err.message)
      setDeletingTeam(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <SectionHeader title="Account" desc="Manage your team workspace settings." />
      <div className="max-w-xl flex flex-col gap-6">
        {/* Team Logo */}
        <div className="flex flex-col gap-2">
          <Label>Team logo</Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => isAdmin && logoInputRef.current?.click()}
              className={cn(
                'relative group size-16 rounded-xl overflow-hidden border-2 border-border flex items-center justify-center bg-muted',
                isAdmin ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              {team?.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{team?.name?.[0]?.toUpperCase() || 'T'}</span>
              )}
              {isAdmin && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingLogo
                    ? <Loader2 className="size-5 text-white animate-spin" />
                    : <Camera className="size-4 text-white" />}
                </div>
              )}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <div>
              <p className="text-sm font-medium">{team?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAdmin ? 'Click to change team logo' : 'Only admins can change the logo'}
              </p>
            </div>
          </div>
        </div>

        {isAdmin ? (
          <form onSubmit={handleSaveTeamName} className="flex flex-col gap-2">
            <Label htmlFor="team-name">Team name</Label>
            <div className="flex gap-2">
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" variant="outline" disabled={savingTeam}>
                {savingTeam ? 'Saving…' : 'Update'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            <Label>Team name</Label>
            <p className="text-sm font-medium">{team?.name}</p>
          </div>
        )}

        {team && (
          <div className="flex flex-col gap-2">
            <Label>Invite code</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-card border border-border rounded-lg px-4 py-3 font-mono text-xl font-bold tracking-[0.3em] text-center text-foreground select-all">
                {team.invite_code}
              </div>
              <Button type="button" variant="outline" onClick={copyInviteCode}>
                {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with teammates to let them join your workspace.
            </p>
          </div>
        )}

        {isAdmin && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete this team and all its content. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteTeam}
                disabled={deletingTeam}
              >
                {deletingTeam ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                {deletingTeam ? 'Deleting…' : 'Delete team'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function AppearanceSection() {
  const { dark, toggleDark } = useTheme()

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <SectionHeader title="Appearance" desc="Customize the look and feel of the interface." />
      <div className="max-w-xl flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Label>Theme</Label>
          <p className="text-sm text-muted-foreground">Select the theme for the dashboard.</p>
          <RadioGroup
            value={dark ? 'dark' : 'light'}
            onValueChange={(v) => { if ((v === 'dark') !== dark) toggleDark() }}
            className="grid grid-cols-2 gap-6 max-w-sm pt-1"
          >
            <div>
              <Label className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                <RadioGroupItem value="light" className="sr-only" />
                <div className="rounded-md border-2 border-muted p-1 hover:border-accent transition-colors">
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-xs">
                      <div className="h-2 w-20 rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-16 rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-xs">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-16 rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center text-sm font-normal">Light</span>
              </Label>
            </div>
            <div>
              <Label className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                <RadioGroupItem value="dark" className="sr-only" />
                <div className="rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <div className="space-y-2 rounded-sm p-2" style={{ backgroundColor: 'oklch(0.13 0.048 265)' }}>
                    <div className="space-y-2 rounded-md p-2 shadow-xs" style={{ backgroundColor: 'oklch(0.165 0.065 264)' }}>
                      <div className="h-2 w-20 rounded-lg" style={{ backgroundColor: 'oklch(0.265 0.075 265)' }} />
                      <div className="h-2 w-16 rounded-lg" style={{ backgroundColor: 'oklch(0.265 0.075 265)' }} />
                    </div>
                    <div className="flex items-center gap-2 rounded-md p-2 shadow-xs" style={{ backgroundColor: 'oklch(0.165 0.065 264)' }}>
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'oklch(0.265 0.075 265)' }} />
                      <div className="h-2 w-16 rounded-lg" style={{ backgroundColor: 'oklch(0.265 0.075 265)' }} />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center text-sm font-normal">Dark</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Button onClick={toggleDark} variant="outline">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Switch to {dark ? 'light' : 'dark'} mode
          </Button>
        </div>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(false)
  const [taskUpdates, setTaskUpdates] = useState(true)
  const [mentions, setMentions] = useState(true)
  const [projectUpdates, setProjectUpdates] = useState(false)

  const items = [
    { label: 'Task updates', desc: 'Get notified when tasks are assigned or updated.', value: taskUpdates, onChange: setTaskUpdates },
    { label: 'Mentions', desc: 'Get notified when someone mentions you.', value: mentions, onChange: setMentions },
    { label: 'Project updates', desc: 'Get notified about project status changes.', value: projectUpdates, onChange: setProjectUpdates },
    { label: 'Email digest', desc: 'Receive a daily email summary.', value: emailNotifs, onChange: setEmailNotifs },
    { label: 'Push notifications', desc: 'Receive push notifications in your browser.', value: pushNotifs, onChange: setPushNotifs },
  ]

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <SectionHeader title="Notifications" desc="Configure how you receive notifications." />
      <div className="max-w-xl flex flex-col gap-3">
        {items.map(({ label, desc, value, onChange }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={value} onCheckedChange={onChange} />
            </CardContent>
          </Card>
        ))}
        <div>
          <Button>Save preferences</Button>
        </div>
      </div>
    </div>
  )
}

function MembersSection() {
  const { profile } = useAuth()
  const { team, members, isAdmin, reloadMembers } = useTeam()

  async function handleRemoveMember(userId: string) {
    if (!confirm('Remove this member from the team?')) return
    try {
      await api.removeMember(team.id, userId)
      await reloadMembers()
      toast.success('Member removed')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleChangeRole(userId: string, newRole: string) {
    try {
      await api.updateMemberRole(team.id, userId, newRole)
      await reloadMembers()
      toast.success(`Role updated to ${newRole}`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <SectionHeader
        title="Team Members"
        desc={`Manage the ${members.length} members in your workspace.`}
      />
      <div className="max-w-xl flex flex-col gap-1">
        {members.map((m: any) => {
          const isMe = m.user_id === profile?.id
          const isThisAdmin = m.role === 'admin'
          return (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <Avatar name={m.profiles?.name} src={m.profiles?.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{m.profiles?.name}</p>
                  {isThisAdmin ? (
                    <Badge variant="secondary" className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
                      <Crown className="size-2.5 mr-1" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      <Shield className="size-2.5 mr-1" /> Member
                    </Badge>
                  )}
                  {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}
                </div>
              </div>
              {isAdmin && !isMe && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChangeRole(m.user_id, isThisAdmin ? 'member' : 'admin')}
                    className="h-7 text-xs"
                  >
                    {isThisAdmin ? 'Make member' : 'Make admin'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(m.user_id)}
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Settings() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col lg:flex-row lg:gap-12">
        <aside className="lg:w-1/5 lg:sticky lg:top-0 mb-6 lg:mb-0">
          <SidebarNav items={sidebarNavItems} />
        </aside>

        <div className="flex-1 min-w-0">
          <Routes>
            <Route index element={<ProfileSection />} />
            <Route path="account" element={<AccountSection />} />
            <Route path="appearance" element={<AppearanceSection />} />
            <Route path="notifications" element={<NotificationsSection />} />
            <Route path="members" element={<MembersSection />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
