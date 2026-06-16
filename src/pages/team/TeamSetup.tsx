import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeam } from '../../contexts/TeamContext'
import { useAuth } from '../../contexts/AuthContext'
import { Users, Plus, LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

export default function TeamSetup() {
  const { createTeam, joinTeam } = useTeam()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Team name required')
    setLoading(true)
    try {
      await createTeam(name.trim())
      toast.success('Team created!')
      navigate('/posts')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return toast.error('Invite code required')
    setLoading(true)
    try {
      await joinTeam(code.trim().toUpperCase())
      toast.success('Joined team!')
      navigate('/posts')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="absolute top-4 right-4 text-muted-foreground"
      >
        <LogOut data-icon="inline-start" className="size-3.5" />
        Sign out
      </Button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25">
            <Users className="size-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set up your workspace</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Create a new team or join an existing one</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="create">
              <TabsList className="w-full rounded-none rounded-t-xl border-b h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="create"
                  className="flex-1 rounded-none rounded-tl-xl border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
                >
                  Create a Team
                </TabsTrigger>
                <TabsTrigger
                  value="join"
                  className="flex-1 rounded-none rounded-tr-xl border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
                >
                  Join a Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="p-7 mt-0">
                <form onSubmit={handleCreate} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="team-name">Team name</Label>
                    <Input
                      id="team-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Acme Marketing Team"
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading
                      ? <Loader2 data-icon="inline-start" className="animate-spin" />
                      : <Plus data-icon="inline-start" />}
                    {loading ? 'Creating…' : 'Create Team'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    An invite code will be generated automatically for sharing with teammates
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="join" className="p-7 mt-0">
                <form onSubmit={handleJoin} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="invite-code">Invite code</Label>
                    <Input
                      id="invite-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AB12CD"
                      maxLength={6}
                      className="font-mono text-center text-lg tracking-widest uppercase"
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
                    {loading ? 'Joining…' : 'Join Team'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
