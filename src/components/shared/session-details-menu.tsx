"use client"

import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type Session = {
  id: string
  title: string
  abbrev: string
  agenda: string
  members: Array<{ id: string; name: string; flagQuery: string }>
  countries: Array<{ name: string; code: string; attendance?: 'present' | 'present-voting' | 'absent' }>
  chair: string
  coChair: string
  rapporteur: string
  createdAt: string
  motions?: Array<{
    id: string
    type: string
    description: string
    status: string
    timestamp: string
  }>
}

interface SessionDetailsMenuProps {
  session: Session
}

export function SessionDetailsMenu({ session }: SessionDetailsMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeView, setActiveView] = useState<'committee' | 'attendance' | 'motions'>('committee')

  const renderContent = () => {
    switch (activeView) {
      case 'committee':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-black">
              <div className="text-sm text-muted-foreground mb-1">Session Agenda</div>
              <div className="text-sm font-medium">{session.agenda}</div>
            </div>
            <div className="grid gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground">Committee Officers</div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-md py-1.5">
                    <div className="text-sm text-muted-foreground">Chair</div>
                    <div className="text-sm font-medium">{session.chair}</div>
                  </div>
                  <div className="flex items-center justify-between rounded-md py-1.5">
                    <div className="text-sm text-muted-foreground">Co-Chair</div>
                    <div className="text-sm font-medium">{session.coChair}</div>
                  </div>
                  <div className="flex items-center justify-between rounded-md py-1.5">
                    <div className="text-sm text-muted-foreground">Rapporteur</div>
                    <div className="text-sm font-medium">{session.rapporteur}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-sm font-medium">
                  {new Date(session.createdAt).toLocaleDateString()} {new Date(session.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        )
      case 'attendance':
        return (
          <div className="space-y-1">
            {session.countries.map((country) => (
              <div
                key={country.code}
                className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{country.name}</div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  country.attendance === 'present' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                  country.attendance === 'present-voting' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                  country.attendance === 'absent' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {country.attendance ? (
                    country.attendance === 'present-voting' ? 'Present and Voting' :
                    country.attendance.charAt(0).toUpperCase() + country.attendance.slice(1)
                  ) : 'Not set'}
                </div>
              </div>
            ))}
          </div>
        )
      case 'motions':
        return (
          <div className="space-y-3">
            {session.motions?.length ? (
              session.motions.map((motion) => (
                <div
                  key={motion.id}
                  className="p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-semibold">{motion.type}</div>
                    <div className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary-foreground">
                      {motion.status}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{motion.description}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(motion.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg">
                No motions recorded in this session
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {
            setActiveView('committee')
            setOpen(true)
          }}>
            Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-background border border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {session.title}
              {session.abbrev && <span className="text-muted-foreground ml-1">({session.abbrev})</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className={`relative border border-border rounded-md ${
                activeView === 'committee' 
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => setActiveView('committee')}
            >
              Committee
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`relative border border-border rounded-md ${
                activeView === 'attendance'
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setActiveView('attendance')}
            >
              Attendance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`relative border border-border rounded-md ${
                activeView === 'motions'
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setActiveView('motions')}
            >
              Motions
            </Button>
          </div>
          <div className="min-h-[200px] max-h-[60vh] overflow-y-auto pr-4 -mr-4">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}