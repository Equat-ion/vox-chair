"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Clock, Layout, Loader2, LogIn } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useCommittee } from "@/lib/committee-context"
import CommitteeSetupModal from "@/components/committee-setup-modal"
import { logSessionStart } from "@/lib/logging"
import { saveCommittee } from "@/lib/session-storage"
import { 
  getRecentCommittees, 
  saveCommitteeToDatabase,
  updateCommitteeAccess,
  getCommitteeById 
} from "@/lib/supabase/committees"
import { useAuth } from "@/lib/auth-context"

// Mock templates
const templates = [
  { id: 1, name: "UN Security Council", members: 15, description: "Standard UN Security Council setup" },
  { id: 2, name: "Small Committee", members: 10, description: "For smaller discussion groups" },
  { id: 3, name: "Large Assembly", members: 50, description: "For large-scale simulations" },
]

export default function Page() {
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [authGateOpen, setAuthGateOpen] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [signupDialogOpen, setSignupDialogOpen] = useState(false)
  const [recentCommittees, setRecentCommittees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { setCommittee } = useCommittee()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    loadRecentCommittees()
  }, [user])

  const loadRecentCommittees = async () => {
    setIsLoading(true)
    try {
      if (user) {
        const committees = await getRecentCommittees(6)
        setRecentCommittees(committees)
      } else {
        setRecentCommittees([])
      }
    } catch (error) {
      console.error('Error loading recent committees:', error)
      setRecentCommittees([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCommitteeClick = () => {
    if (!user) {
      setAuthGateOpen(true)
    } else {
      setSetupModalOpen(true)
    }
  }

  const handleSetupComplete = async (data: {
    name: string
    abbrev: string
    agenda: string
    chair: string
    coChair: string
    rapporteur: string
    countries: Array<{ name: string; code: string; attendance: 'present' | 'absent' | 'present-voting' }>
    countryList: Array<{ id: string; name: string; flagQuery: string; attendance?: 'present' | 'absent' | 'present-voting' }>
    settings?: any
  }) => {
    try {
      console.log('Setting up committee with data:', data);
      
      const savedCommittee = await saveCommitteeToDatabase(
        {
          name: data.name,
          abbrev: data.abbrev,
          agenda: data.agenda,
          chair: data.chair,
          coChair: data.coChair,
          rapporteur: data.rapporteur,
          settings: data.settings || {}
        },
        data.countries
      );

      const committeeData = {
        id: savedCommittee.committee_id || savedCommittee.id,
        name: data.name,
        abbrev: data.abbrev,
        agenda: data.agenda,
        countries: data.countries || [],
        countryList: (data.countryList || []).map((country: any) => ({
          id: country.id,
          name: country.name,
          flagQuery: country.flagQuery,
          attendance: (country.attendance as 'present' | 'absent' | 'present-voting') || 'present'
        })),
        chair: data.chair,
        coChair: data.coChair,
        rapporteur: data.rapporteur,
        settings: {
          enableMotions: data.settings?.enableMotions ?? true,
          enableVoting: data.settings?.enableVoting ?? true,
          showTimer: data.settings?.showTimer ?? true,
          showSpeakerList: data.settings?.showSpeakerList ?? true,
          showMotions: data.settings?.showMotions ?? true,
          recordSession: data.settings?.recordSession ?? true,
          autoSaveDrafts: data.settings?.autoSaveDrafts ?? true,
          notificationsEnabled: data.settings?.notificationsEnabled ?? true,
          speakingTime: data.settings?.speakingTime ?? 120
        }
      };

      logSessionStart(`Committee prepared: ${data.name}`, data.countries.length);
      console.log('Saving committee data:', committeeData);

      saveCommittee(committeeData);
      setCommittee(committeeData);

      await loadRecentCommittees();

      router.push(`/speaker-list?committee=${committeeData.id}`);
    } catch (error) {
      console.error('Error setting up committee:', error);
      alert('Failed to create committee. Please try again.');
    }
    setSetupModalOpen(false)
  }

  const handleCommitteeClick = async (committeeId: string) => {
    try {
      await updateCommitteeAccess(committeeId);
      
      const fullCommittee = await getCommitteeById(committeeId);
      
      saveCommittee(fullCommittee);
      setCommittee(fullCommittee);
      
      router.push(`/speaker-list?committee=${committeeId}`);
    } catch (error) {
      console.error('Error loading committee:', error);
      alert('Failed to load committee. Please try again.');
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh">
      <CommitteeSetupModal 
        open={setupModalOpen} 
        onOpenChange={setSetupModalOpen}
        onSetupComplete={handleSetupComplete}
      />

      {/* Authentication Gate Dialog */}
      <Dialog open={authGateOpen} onOpenChange={setAuthGateOpen}>
        <DialogContent className="sm:max-w-md" title="Welcome to Vox Chair">
          <DialogHeader className="space-y-2 text-center">
            <DialogTitle className="text-2xl">Welcome to Vox Chair</DialogTitle>
            <DialogDescription>
              Create and manage Model UN committees with ease
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-muted-foreground py-4">
            <p className="flex items-start gap-3">
              <span className="text-primary text-lg">✓</span>
              <span>Create and manage multiple committees</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-primary text-lg">✓</span>
              <span>Manage speaker lists and timing</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-primary text-lg">✓</span>
              <span>Track motions and voting</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-primary text-lg">✓</span>
              <span>Create and share draft resolutions</span>
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline"
              onClick={() => setAuthGateOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setAuthGateOpen(false)
                setLoginDialogOpen(true)
              }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </Button>
            <Button 
              onClick={() => {
                setAuthGateOpen(false)
                setSignupDialogOpen(true)
              }}
            >
              Sign Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Committees</h1>
            <p className="text-muted-foreground">Manage and create your committees</p>
          </div>
          <Button onClick={handleCreateCommitteeClick} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create New Committee
          </Button>
        </div>

        {/* Recent Committees Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Recent Committees</h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentCommittees.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No recent committees</p>
                <p className="text-sm text-muted-foreground mb-4">Create your first committee to get started</p>
                <Button onClick={handleCreateCommitteeClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Committee
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentCommittees.map((committee) => (
                <Card 
                  key={committee.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCommitteeClick(committee.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{committee.name}</span>
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                        {committee.abbrev}
                      </span>
                    </CardTitle>
                    <CardDescription>{committee.members} members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Last accessed: {committee.lastAccessed}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Templates Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Layout className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Templates</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.members} members</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}