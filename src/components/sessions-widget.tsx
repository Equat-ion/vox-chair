"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { SessionDetailsMenu } from "@/components/shared/session-details-menu"

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
}

export default function SessionsWidget({ onLoadAction }: { onLoadAction?: (s: Session) => void }) {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sessions")
      if (!raw) return
      setSessions(JSON.parse(raw))
    } catch (e) {
      console.error(e)
    }
  }, [])

  function save(sessionsToSave: Session[]) {
    setSessions(sessionsToSave)
    sessionStorage.setItem("sessions", JSON.stringify(sessionsToSave))
  }

  function removeOne(id: string) {
    const left = sessions.filter((s) => s.id !== id)
    save(left)
  }

  function handleLoad(s: Session) {
    onLoadAction?.(s)
  }

  if (sessions.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="relative">
            <div className="absolute top-1 right-1">
              <SessionDetailsMenu session={s} />
            </div>
            <div className="flex items-center justify-between gap-2 pr-8">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.title} {s.abbrev ? `(${s.abbrev})` : ""}</div>
                <div className="text-sm text-muted-foreground truncate">{s.agenda}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleLoad(s)}>
                  Load
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeOne(s.id)} aria-label="Delete session">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
