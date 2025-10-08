"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { GearIcon, ReloadIcon, PlayIcon, MixerHorizontalIcon } from "@radix-ui/react-icons"
import { X } from "lucide-react"
import { useHeader } from "@/components/app-sidebar-layout"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TimePicker } from "@/components/time-picker"

type Speaker = {
  id: string
  name: string
  flagQuery: string
  attendance?: 'present' | 'present-voting' | 'absent'
}

function FlagAvatar({ query, alt, className = "h-10 w-10" }: { query: string; alt: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage alt={alt} src={`/.jpg?height=40&width=40&query=${encodeURIComponent(query)}`} />
      <AvatarFallback className="text-xs">UN</AvatarFallback>
    </Avatar>
  )
}

function TimeDisplay({ currentTime, totalTime, isRunning }: { currentTime: number; totalTime: number; isRunning: boolean }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Determine LED color based on timer state
  const getIndicatorColor = () => {
    if (currentTime <= 0) {
      // Time over - red
      return "bg-red-500 shadow-red-500/50"
    } else if (currentTime <= totalTime * 0.25) {
      // 25% or less remaining - yellow
      return "bg-yellow-500 shadow-yellow-500/50"
    } else if (isRunning) {
      // Timer running - green
      return "bg-green-500 shadow-green-500/50"
    } else {
      // Timer paused - gray
      return "bg-gray-400 shadow-gray-400/50"
    }
  }

  return (
    <div className="relative text-center py-12">
      {/* LED Indicator */}
      <div className="absolute top-1 left-1">
        <div className={`w-3 h-3 rounded-full ${getIndicatorColor()} shadow-[0_0_10px_2px] animate-pulse`} />
      </div>
      <div className="text-4xl sm:text-6xl lg:text-8xl font-bold tracking-tight break-words">
        {formatTime(currentTime)} / {formatTime(totalTime)}
      </div>
    </div>
  )
}

function TimerControls({
  onYield,
  onSettings,
  onReset,
  onStart,
  isRunning,
}: {
  onYield: () => void
  onSettings: () => void
  onReset: () => void
  onStart: () => void
  isRunning: boolean
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <Button
        variant="outline"
        size="lg"
        className="h-16 bg-black hover:bg-black text-white hover:text-neutral-400 hover:border-b-neutral-500 flex-wrap"
        onClick={onYield}
      >
        <MixerHorizontalIcon className="mr-2 h-5 w-5 shrink-0" />
        <span className="truncate">Yield</span>
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="h-16 bg-black hover:bg-black text-white hover:text-neutral-400 hover:border-b-neutral-500 flex-wrap"
        onClick={onSettings}
      >
        <GearIcon className="mr-2 h-5 w-5 shrink-0" />
        <span className="truncate">Speaking Time</span>
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="h-16 bg-black hover:bg-black text-white hover:text-neutral-400 hover:border-b-neutral-500 flex-wrap"
        onClick={onReset}
      >
        <ReloadIcon className="mr-2 h-5 w-5 shrink-0" />
        <span className="truncate">Reset</span>
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="h-16 bg-black hover:bg-black text-white hover:text-neutral-400 hover:border-b-neutral-500 flex-wrap"
        onClick={onStart}
      >
        <PlayIcon className="mr-2 h-5 w-5 shrink-0" />
        <span className="truncate">{isRunning ? "Pause" : "Start"}</span>
      </Button>
    </div>
  )
}

function CurrentSpeaker({ 
  speaker, 
  onNext,
  isYielded,
  originalSpeaker,
  yieldedTime
}: { 
  speaker: Speaker | null
  onNext: () => void
  isYielded: boolean
  originalSpeaker: Speaker | null
  yieldedTime: number
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!speaker) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Current Speaker</h2>
        </div>
        <Card className="p-6 text-center text-muted-foreground">
          No speaker selected
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Current Speaker</h2>
        <Button onClick={onNext}>Next Speaker</Button>
      </div>
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <FlagAvatar query={speaker.flagQuery} alt={`${speaker.name} flag`} />
          <div className="flex-1">
            <span className="text-2xl font-medium">{speaker.name}</span>
            {isYielded && originalSpeaker && (
              <Badge variant="secondary" className="ml-3 text-xs">
                Yielded from {originalSpeaker.name} at {formatTime(yieldedTime)}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function UpcomingSpeakers({
  speakers,
  onRemove,
  onReorder,
}: {
  speakers: Speaker[]
  onRemove: (id: string) => void
  onReorder: (newOrder: Speaker[]) => void
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const cardRefs = useState<(HTMLDivElement | null)[]>([])

  const handleDragStart = (e: React.DragEvent, index: number, cardElement: HTMLDivElement | null) => {
    setDraggedIndex(index)
    
    if (!cardElement) return
    
    // Get the exact dimensions and styles of the original card
    const rect = cardElement.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(cardElement)
    
    // Calculate the offset to position cursor over the drag handle
    // The handle is on the right side, so we offset from the right edge
    const handleOffsetFromRight = 50 // Approximate position of the handle from the right
    const cursorOffsetX = rect.width - handleOffsetFromRight
    const cursorOffsetY = rect.height / 2
    
    // Create a custom drag image that matches the original card
    const dragPreview = document.createElement('div')
    dragPreview.style.position = 'fixed'
    dragPreview.style.top = '-9999px'
    dragPreview.style.left = '-9999px'
    dragPreview.style.width = `${rect.width}px`
    dragPreview.style.opacity = '0.7'
    dragPreview.style.pointerEvents = 'none'
    
    // Clone the card content
    dragPreview.innerHTML = `
      <div style="
        background: ${computedStyle.backgroundColor};
        border: 1px solid hsl(var(--border));
        border-radius: ${computedStyle.borderRadius};
        padding: ${computedStyle.padding};
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
        width: ${rect.width}px;
      ">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 40px; height: 40px; border-radius: 9999px; background: hsl(var(--muted)); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0;">UN</div>
          <span style="font-size: 1.125rem; font-weight: 500; line-height: 1.75rem; color: hsl(var(--foreground));">${speakers[index].name}</span>
        </div>
      </div>
    `
    
    document.body.appendChild(dragPreview)
    const dragImage = dragPreview.firstElementChild as HTMLElement
    e.dataTransfer.setDragImage(dragImage, cursorOffsetX, cursorOffsetY)
    
    // Remove the preview element after a short delay
    setTimeout(() => {
      document.body.removeChild(dragPreview)
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newSpeakers = [...speakers]
    const [draggedItem] = newSpeakers.splice(draggedIndex, 1)
    newSpeakers.splice(dropIndex, 0, draggedItem)
    
    onReorder(newSpeakers)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (speakers.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Speakers</h2>
        <Card className="p-6 text-center text-muted-foreground">
          No upcoming speakers
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Upcoming Speakers</h2>
      <div className="space-y-2">
        {speakers.map((speaker, index) => {
          let cardRef: HTMLDivElement | null = null
          
          return (
            <Card 
              key={speaker.id}
              ref={(el) => {
                cardRef = el
                cardRefs[0][index] = el
              }}
              className={`p-4 transition-all ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${
                dragOverIndex === index && draggedIndex !== index ? 'border-primary border-2' : ''
              }`}
              draggable={false}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FlagAvatar query={speaker.flagQuery} alt={`${speaker.name} flag`} />
                  <span className="text-lg font-medium">{speaker.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemove(speaker.id)}
                    aria-label={`Remove ${speaker.name}`}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <div 
                    className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors"
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index, cardRef)}
                    onDragEnd={handleDragEnd}
                    aria-label="Drag to reorder"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-muted-foreground"
                    >
                      <path
                        d="M5.5 4.625C6.12132 4.625 6.625 4.12132 6.625 3.5C6.625 2.87868 6.12132 2.375 5.5 2.375C4.87868 2.375 4.375 2.87868 4.375 3.5C4.375 4.12132 4.87868 4.625 5.5 4.625ZM9.5 4.625C10.1213 4.625 10.625 4.12132 10.625 3.5C10.625 2.87868 10.1213 2.375 9.5 2.375C8.87868 2.375 8.375 2.87868 8.375 3.5C8.375 4.12132 8.87868 4.625 9.5 4.625ZM10.625 7.5C10.625 8.12132 10.1213 8.625 9.5 8.625C8.87868 8.625 8.375 8.12132 8.375 7.5C8.375 6.87868 8.87868 6.375 9.5 6.375C10.1213 6.375 10.625 6.87868 10.625 7.5ZM5.5 8.625C6.12132 8.625 6.625 8.12132 6.625 7.5C6.625 6.87868 6.12132 6.375 5.5 6.375C4.87868 6.375 4.375 6.87868 4.375 7.5C4.375 8.12132 4.87868 8.625 5.5 8.625ZM10.625 11.5C10.625 12.1213 10.1213 12.625 9.5 12.625C8.87868 12.625 8.375 12.1213 8.375 11.5C8.375 10.8787 8.87868 10.375 9.5 10.375C10.1213 10.375 10.625 10.8787 10.625 11.5ZM5.5 12.625C6.12132 12.625 6.625 12.1213 6.625 11.5C6.625 10.8787 6.12132 10.375 5.5 10.375C4.87868 10.375 4.375 10.8787 4.375 11.5C4.375 12.1213 4.87868 12.625 5.5 12.625Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function AddSpeaker({
  availableSpeakers,
  onAdd,
}: {
  availableSpeakers: Speaker[]
  onAdd: (speaker: Speaker) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = availableSpeakers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add Speaker</h2>
      <Input
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filtered.map((speaker) => (
            <button
              key={speaker.id}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              onClick={() => onAdd(speaker)}
            >
              <FlagAvatar query={speaker.flagQuery} alt={`${speaker.name} flag`} className="h-8 w-8" />
              <span>{speaker.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}

function TimeSettingsDialog({
  open,
  onOpenChange,
  currentTime,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTime: number
  onSave: (minutes: number, seconds: number) => void
}) {
  const [timeInSeconds, setTimeInSeconds] = useState(currentTime)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Speaking Time</DialogTitle>
        </DialogHeader>
        <TimePicker 
          value={timeInSeconds} 
          onChange={setTimeInSeconds}
          className="py-4"
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const mins = Math.floor(timeInSeconds / 60)
              const secs = timeInSeconds % 60
              onSave(mins, secs)
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function YieldDialog({
  open,
  onOpenChange,
  availableSpeakers,
  onYield,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableSpeakers: Speaker[]
  onYield: (speaker: Speaker) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = availableSpeakers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yield Time To</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search delegates"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />
        <ScrollArea className="h-[300px]">
          <div className="space-y-1">
            {filtered.map((speaker) => (
              <button
                key={speaker.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                onClick={() => {
                  onYield(speaker)
                  onOpenChange(false)
                }}
              >
                <FlagAvatar query={speaker.flagQuery} alt={`${speaker.name} flag`} className="h-8 w-8" />
                <span>{speaker.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function RollCallDialog({
  open,
  onOpenChange,
  members,
  onUpdateAttendance,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Speaker[]
  onUpdateAttendance: (updatedMembers: Speaker[]) => void
}) {
  const [localMembers, setLocalMembers] = useState<Speaker[]>(members)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setLocalMembers(members)
  }, [members])

  const filtered = localMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAttendance = (id: string, status: 'present' | 'present-voting' | 'absent') => {
    setLocalMembers(localMembers.map(m => 
      m.id === id ? { ...m, attendance: status } : m
    ))
  }

  const handleSetAllPresent = () => {
    setLocalMembers(localMembers.map(m => ({ ...m, attendance: 'present' as const })))
  }

  const handleSetAllAbsent = () => {
    setLocalMembers(localMembers.map(m => ({ ...m, attendance: 'absent' as const })))
  }

  const presentCount = localMembers.filter(m => m.attendance === 'present' || m.attendance === 'present-voting').length
  const presentVotingCount = localMembers.filter(m => m.attendance === 'present-voting').length
  const absentCount = localMembers.filter(m => m.attendance === 'absent').length

  const handleDone = () => {
    onUpdateAttendance(localMembers)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Roll Call</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-8 py-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-900 text-white flex items-center justify-center font-semibold">
              {presentCount}
            </div>
            <span className="text-sm font-medium">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center font-semibold">
              {presentVotingCount}
            </div>
            <span className="text-sm font-medium">P&V</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-500 text-white flex items-center justify-center font-semibold">
              {absentCount}
            </div>
            <span className="text-sm font-medium">Absent</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleSetAllPresent}
          >
            Set All Present
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleSetAllAbsent}
          >
            Set All Absent
          </Button>
        </div>

        <Input
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2"
        />

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filtered.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FlagAvatar query={member.flagQuery} alt={`${member.name} flag`} className="h-8 w-8" />
                  <span className="font-medium">{member.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={member.attendance === 'present-voting' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAttendance(member.id, 'present-voting')}
                    className="w-12"
                  >
                    PV
                  </Button>
                  <Button
                    variant={member.attendance === 'present' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAttendance(member.id, 'present')}
                    className="w-12"
                  >
                    P
                  </Button>
                  <Button
                    variant={member.attendance === 'absent' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleAttendance(member.id, 'absent')}
                    className="w-12"
                  >
                    A
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleDone} className="w-full">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SetAgendaDialog({
  open,
  onOpenChange,
  currentAgenda,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAgenda: string
  onSave: (agenda: string) => void
}) {
  const [agenda, setAgenda] = useState(currentAgenda)

  useEffect(() => {
    setAgenda(currentAgenda)
  }, [currentAgenda])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Agenda</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Enter agenda description"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(agenda)
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SessionPage() {
  const { setTitle } = useHeader()
  
  // Get initial data from sessionStorage
  const [committeeName, setCommitteeName] = useState("Editable Committee Name")
  const [allMembers, setAllMembers] = useState<Speaker[]>([])
  
  // Session state
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null)
  const [speakerQueue, setSpeakerQueue] = useState<Speaker[]>([])
  const [currentTime, setCurrentTime] = useState(60)
  const [totalTime, setTotalTime] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  
  // Yield tracking
  const [isYielded, setIsYielded] = useState(false)
  const [originalSpeaker, setOriginalSpeaker] = useState<Speaker | null>(null)
  const [originalQueue, setOriginalQueue] = useState<Speaker[]>([])
  const [yieldedTime, setYieldedTime] = useState(0)
  
  // Dialog states
  const [timeDialogOpen, setTimeDialogOpen] = useState(false)
  const [yieldDialogOpen, setYieldDialogOpen] = useState(false)
  const [addSpeakerDialogOpen, setAddSpeakerDialogOpen] = useState(false)
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false)
  const [rollCallDialogOpen, setRollCallDialogOpen] = useState(false)
  const [agenda, setAgenda] = useState("No agenda set")

  // Load session data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionData = sessionStorage.getItem("sessionData")
      if (sessionData) {
        const { title, members } = JSON.parse(sessionData)
        setCommitteeName(title)
        setAllMembers(members)
        setTitle(title) // Set the header title
      }
    }
  }, [setTitle])

  // Timer logic
  useEffect(() => {
    if (!isRunning || currentTime <= 0) return
    
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, currentTime])

  const handleAddSpeaker = (speaker: Speaker) => {
    if (!currentSpeaker) {
      setCurrentSpeaker(speaker)
    } else if (!speakerQueue.find((s) => s.id === speaker.id)) {
      // Don't allow adding the current speaker unless they were yielded to
      if (speaker.id === currentSpeaker.id && !isYielded) {
        return
      }
      setSpeakerQueue([...speakerQueue, speaker])
    }
  }

  const handleRemoveSpeaker = (id: string) => {
    if (isYielded) {
      // When yielded, remove from the original queue and keep it in sync
      setOriginalQueue(originalQueue.filter((s) => s.id !== id))
    } else {
      // Normal flow: remove from speaker queue
      setSpeakerQueue(speakerQueue.filter((s) => s.id !== id))
    }
  }

  const handleNextSpeaker = () => {
    // If returning from a yielded speaker, restore original queue
    if (isYielded && originalQueue.length > 0) {
      setCurrentSpeaker(originalQueue[0])
      setSpeakerQueue(originalQueue.slice(1))
      setCurrentTime(totalTime)
      setIsRunning(false)
      setIsYielded(false)
      setOriginalSpeaker(null)
      setOriginalQueue([])
      setYieldedTime(0)
    } else if (speakerQueue.length > 0) {
      // Normal flow: move to next speaker in queue
      setCurrentSpeaker(speakerQueue[0])
      setSpeakerQueue(speakerQueue.slice(1))
      setCurrentTime(totalTime)
      setIsRunning(false)
    } else {
      // No more speakers
      setCurrentSpeaker(null)
      setIsYielded(false)
      setOriginalSpeaker(null)
      setOriginalQueue([])
      setYieldedTime(0)
    }
  }

  const handleYield = (speaker: Speaker) => {
    // Store the original speaker and queue state if not already yielded
    if (!isYielded && currentSpeaker) {
      setOriginalSpeaker(currentSpeaker)
      setOriginalQueue([...speakerQueue])
      setYieldedTime(currentTime) // Capture the remaining time at yield
    }
    
    // Remove speaker from queue if they're there
    setSpeakerQueue(speakerQueue.filter((s) => s.id !== speaker.id))
    
    // Set as current speaker with remaining time (not totalTime)
    setCurrentSpeaker(speaker)
    setIsYielded(true)
    // Keep the current remaining time - don't reset it
    setIsRunning(false)
  }

  const handleSetTime = (minutes: number, seconds: number) => {
    const newTime = minutes * 60 + seconds
    setTotalTime(newTime)
    setCurrentTime(newTime)
  }

  const handleReset = () => {
    setCurrentTime(totalTime)
    setIsRunning(false)
  }

  const handleStart = () => {
    setIsRunning(!isRunning)
  }

  const handleReorderSpeakers = (newOrder: Speaker[]) => {
    if (isYielded) {
      // When yielded, update the original queue
      setOriginalQueue(newOrder)
    } else {
      // Normal flow: update speaker queue
      setSpeakerQueue(newOrder)
    }
  }

  const availableForYield = allMembers.filter(
    (m) => m.id !== currentSpeaker?.id
  )

  const availableForSpeaking = allMembers.filter(
    (m) => m.attendance === 'present' || m.attendance === 'present-voting'
  )

  const handleUpdateAttendance = (updatedMembers: Speaker[]) => {
    setAllMembers(updatedMembers)
    if (typeof window !== "undefined") {
      const sessionData = sessionStorage.getItem("sessionData")
      if (sessionData) {
        const data = JSON.parse(sessionData)
        data.members = updatedMembers
        sessionStorage.setItem("sessionData", JSON.stringify(data))
      }
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="font-medium">{agenda}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAgendaDialogOpen(true)}
            >
              Set Agenda
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setRollCallDialogOpen(true)}
            >
              Roll Call
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div>
            <Card className="p-8 mb-6">
              <TimeDisplay currentTime={currentTime} totalTime={totalTime} isRunning={isRunning} />
              <TimerControls
                onYield={() => setYieldDialogOpen(true)}
                onSettings={() => setTimeDialogOpen(true)}
                onReset={handleReset}
                onStart={handleStart}
                isRunning={isRunning}
              />
            </Card>

            <CurrentSpeaker 
              speaker={currentSpeaker} 
              onNext={handleNextSpeaker}
              isYielded={isYielded}
              originalSpeaker={originalSpeaker}
              yieldedTime={yieldedTime}
            />
            <UpcomingSpeakers 
              speakers={isYielded ? originalQueue : speakerQueue} 
              onRemove={handleRemoveSpeaker}
              onReorder={handleReorderSpeakers}
            />
          </div>

          {/* Right Sidebar */}
          <div>
            <AddSpeaker availableSpeakers={availableForSpeaking} onAdd={handleAddSpeaker} />
          </div>
        </div>
      </div>

      <TimeSettingsDialog
        open={timeDialogOpen}
        onOpenChange={setTimeDialogOpen}
        currentTime={totalTime}
        onSave={handleSetTime}
      />

      <YieldDialog
        open={yieldDialogOpen}
        onOpenChange={setYieldDialogOpen}
        availableSpeakers={availableForYield}
        onYield={handleYield}
      />

      <RollCallDialog
        open={rollCallDialogOpen}
        onOpenChange={setRollCallDialogOpen}
        members={allMembers}
        onUpdateAttendance={handleUpdateAttendance}
      />

      <SetAgendaDialog
        open={agendaDialogOpen}
        onOpenChange={setAgendaDialogOpen}
        currentAgenda={agenda}
        onSave={setAgenda}
      />
    </div>
  )
}
