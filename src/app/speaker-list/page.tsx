"use client";

import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SpeakerAttendance } from "@/components/speaker-attendance"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState, useRef } from "react"
import { GearIcon, ReloadIcon, PlayIcon, MixerHorizontalIcon, Cross2Icon } from "@radix-ui/react-icons"
import { Vote, X } from "lucide-react"
import { toast } from "sonner"
import { useHeader } from "@/components/app-sidebar-layout"
import { useCommittee } from "@/lib/committee-context"
import type { Motion, ExtendedMotion, MotionStatus } from "@/types/motion";
import { MotionForm } from "../motion/MotionForm"
import { MotionList } from "../motion/MotionList"
import { ExtendMotionDialog } from "../motion/ExtendMotionDialog"
import { logSpeakerAdded, logSpeakerRemoved, logSpeakerReordered, logSpeakerYield, logTimingConfig } from "@/lib/logging"
import { getSessionData, updateSessionData } from "@/lib/session-storage"
import { FlagAvatar } from "@/components/ui/flag-avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TimeSettingsDialog } from "@/components/dialogs/time-settings-dialog"
import { YieldDialog } from "@/components/dialogs/yield-dialog"
import { SetAgendaDialog } from "@/components/dialogs/set-agenda-dialog"
import type { Speaker } from "@/types/shared/speaker"

// ScrollArea now imported in individual dialog components

// Type definitions moved to types/shared/speaker.ts

function TimeDisplay({ 
  currentTime, 
  totalTime, 
  isRunning,
  motionTotalTime,
  yieldedTime = 0,
  showTimer = true
}: { 
  currentTime: number; 
  totalTime: number; 
  isRunning: boolean;
  motionTotalTime?: number;
  yieldedTime?: number;
  showTimer?: boolean;
}) {
  const formatTime = (seconds: number, showHours = false) => {
    const isOvertime = seconds < 0;
    const absSeconds = Math.abs(seconds);
    
    if (showHours) {
      const hours = Math.floor(absSeconds / 3600)
      const mins = Math.floor((absSeconds % 3600) / 60)
      const secs = absSeconds % 60
      if (hours > 0) {
        return `${isOvertime ? '+' : ''}${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      }
    }
    const mins = Math.floor(absSeconds / 60)
    const secs = absSeconds % 60
    return `${isOvertime ? '+' : ''}${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Determine LED color based on timer state
  const getIndicatorColor = () => {
    if (currentTime < 0) {
      // Overtime - flashing red
      return "bg-red-500 shadow-red-500/50 animate-pulse"
    } else if (currentTime === 0) {
      // Time exactly at zero - solid red
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

  // Calculate total time including yielded time
  const displayTotalTime = totalTime + yieldedTime;

  if (!showTimer) {
  return (
    <div className="relative text-center py-12">
      <div className="flex flex-col items-center gap-2">
        <div className="text-lg text-muted-foreground">
          Timer display is hidden
        </div>
        {motionTotalTime && (
          <div className="text-lg text-muted-foreground">
            Total Time: {formatTime(motionTotalTime * 60, true)}
          </div>
        )}
      </div>
    </div>
  );
}
  
  return (
    <div className="relative text-center py-12">
      {/* LED Indicator */}
      <div className="absolute top-1 left-1">
        <div className={`w-3 h-3 rounded-full ${getIndicatorColor()} shadow-[0_0_10px_2px] animate-pulse`} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight break-words">
          {formatTime(currentTime)} / {formatTime(displayTotalTime)}
        </div>
        <div className="flex flex-col items-center gap-1 mt-2">
          {yieldedTime > 0 && (
            <div className="text-lg text-green-600 font-semibold">
              +{Math.floor(yieldedTime / 60)}:{(yieldedTime % 60).toString().padStart(2, '0')} yielded
            </div>
          )}
          {motionTotalTime && (
            <div className="text-lg text-muted-foreground">
              Total Time: {formatTime(motionTotalTime * 60, true)}
            </div>
          )}
        </div>
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
        size="lg"
        className="h-16 flex-wrap"
        onClick={onYield}
      >
        <MixerHorizontalIcon className="mr-2 h-5 w-5 shrink-0" />
        <span className="truncate">Yield</span>
      </Button>
      <Button
        size="lg"
        className="h-16 flex-wrap"
        onClick={onSettings}
      >
        <GearIcon className="mr-2 h-5 w-5 shrink-0" />
        <span className="truncate">Speaking Time</span>
      </Button>
      <Button
        size="lg"
        className="h-16 flex-wrap"
        onClick={onReset}
      >
        <ReloadIcon className="mr-2 h-5 w-5 shrink-0" />
        <span className="truncate">Reset</span>
      </Button>
      <Button
        size="lg"
        className="h-16 flex-wrap"
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
  yieldedTime,
  onSwapWithQueue,
}: { 
  speaker: Speaker | null
  onNext: () => void
  isYielded: boolean
  originalSpeaker: Speaker | null
  yieldedTime: number
  onSwapWithQueue: (queueSpeaker: Speaker, queueIndex: number) => void
}) {
  const [draggedOver, setDraggedOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (!speaker) return;
    
    e.dataTransfer.setData('application/json', JSON.stringify({
      speaker: speaker,
      from: 'current'
    }));
    
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(cardRef.current);
    
    const handleOffsetFromRight = 50;
    const cursorOffsetX = rect.width - handleOffsetFromRight;
    const cursorOffsetY = rect.height / 2;
    
    const dragPreview = document.createElement('div')
    dragPreview.style.position = 'fixed'
    dragPreview.style.top = '-9999px'
    dragPreview.style.left = '-9999px'
    dragPreview.style.width = `${rect.width}px`
    dragPreview.style.opacity = '0.7'
    dragPreview.style.pointerEvents = 'none'
    
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
          <span style="font-size: 1.125rem; font-weight: 500; line-height: 1.75rem; color: hsl(var(--foreground));">${speaker.name}</span>
        </div>
      </div>
    `
    
    document.body.appendChild(dragPreview)
    const dragImage = dragPreview.firstElementChild as HTMLElement
    e.dataTransfer.setDragImage(dragImage, cursorOffsetX, cursorOffsetY)
    
    setTimeout(() => {
      document.body.removeChild(dragPreview)
    }, 0)
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(true);
  };

  const handleDragLeave = () => {
    setDraggedOver(false);
  };

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setDraggedOver(false);
  
  const data = e.dataTransfer.getData('application/json');
  if (!data) return;

  try {
    const { speaker: droppedSpeaker, from, queueIndex } = JSON.parse(data);
    
    if (from === 'queue' && queueIndex !== undefined) {
      // Queue speaker dropped on current speaker - swap them
      onSwapWithQueue(droppedSpeaker, queueIndex);
    }
  } catch (err) {
    console.error('Error processing drop:', err);
    toast.error('Failed to swap speakers');
  }
};

  if (!speaker) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Speaker</h2>
        <Card 
          className={`p-4 ${draggedOver ? 'border-primary border-2' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center text-muted-foreground">No current speaker</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Current Speaker</h2>
      <Card 
        ref={cardRef}
        className={`p-4 ${draggedOver ? 'border-primary border-2' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FlagAvatar query={speaker.flagQuery} alt={speaker.name} />
            <div className="flex flex-col">
              <span className="text-lg font-medium">{speaker.name}</span>
              {isYielded && originalSpeaker && (
                <span className="text-sm text-muted-foreground">
                  Yielded from {originalSpeaker.name} ({formatTime(yieldedTime)})
                </span>
              )}
              {speaker.yieldedTime && speaker.yieldedTime > 0 && (
                <span className="text-sm text-muted-foreground">
                  +{Math.floor(speaker.yieldedTime / 60)}:{(speaker.yieldedTime % 60).toString().padStart(2, '0')} yielded time
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={onNext}
              aria-label={`Remove ${speaker.name}`}
            >
              <Cross2Icon className="h-5 w-5" />
            </Button>
            <div 
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors"
              draggable={true}
              onDragStart={handleDragStart}
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
    </div>
  )
}

function UpcomingSpeakers({
  speakers,
  onRemove,
  onReorder,
  currentSpeaker,
  onMoveCurrentToQueue,
}: {
  speakers: Speaker[]
  onRemove: (id: string) => void
  onReorder: (newOrder: Speaker[]) => void
  currentSpeaker: Speaker | null
  onMoveCurrentToQueue: (currentSpeaker: Speaker, insertIndex: number) => void
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const cardRefs = useState<(HTMLDivElement | null)[]>([])

  const handleDragStart = (e: React.DragEvent, index: number, cardElement: HTMLDivElement | null) => {
    setDraggedIndex(index);
    
    e.dataTransfer.setData('application/json', JSON.stringify({
      speaker: speakers[index],
      from: 'queue',
      queueIndex: index
    }));
    
    if (!cardElement) return;
    
    const rect = cardElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(cardElement);
    
    const handleOffsetFromRight = 50;
    const cursorOffsetX = rect.width - handleOffsetFromRight;
    const cursorOffsetY = rect.height / 2;
    
    const dragPreview = document.createElement('div')
    dragPreview.style.position = 'fixed'
    dragPreview.style.top = '-9999px'
    dragPreview.style.left = '-9999px'
    dragPreview.style.width = `${rect.width}px`
    dragPreview.style.opacity = '0.7'
    dragPreview.style.pointerEvents = 'none'
    
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
    
    setTimeout(() => {
      document.body.removeChild(dragPreview)
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const { speaker: droppedSpeaker, from, queueIndex } = JSON.parse(data);

      if (from === 'current') {
        // Current speaker being dropped into queue - call the callback
        onMoveCurrentToQueue(droppedSpeaker, dropIndex);
        toast.success(`${droppedSpeaker.name} moved to queue position ${dropIndex + 1}`);
        
      } else if (from === 'queue') {
        if (queueIndex === dropIndex) return;
        
        const newSpeakers = [...speakers];
        const [draggedItem] = newSpeakers.splice(queueIndex, 1);
        newSpeakers.splice(dropIndex, 0, draggedItem);
        onReorder(newSpeakers);
        
        toast.info(`Reordered speaker list`);
      }
    } catch (err) {
      console.error('Error processing drop:', err);
      toast.error('Failed to reorder speakers');
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (speakers.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Speakers</h2>
        <Card className="p-4">
          <div className="text-center text-muted-foreground">No upcoming speakers</div>
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
              key={`speaker-${speaker.code}-${index}`}
              ref={(el) => {
                cardRef = el
                cardRefs[0][index] = el
              }}
              className={`p-4 ${
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
                  <div className="flex flex-col">
                    <span className="text-lg font-medium">{speaker.name}</span>
                    {speaker.yieldedTime && speaker.yieldedTime > 0 && (
                      <span className="text-sm text-muted-foreground">
                        +{Math.floor(speaker.yieldedTime / 60)}:{(speaker.yieldedTime % 60).toString().padStart(2, '0')} yielded time
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemove(speaker.id)}
                    aria-label={`Remove ${speaker.name}`}
                  >
                    <Cross2Icon className="h-5 w-5" />
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

// Dialog components moved to @/components/dialogs

export default function SessionPage() {
  const { setTitle } = useHeader()
  const { committee, setCommittee } = useCommittee()
  const [loadingCommittee, setLoadingCommittee] = useState(!committee)
  
  // View state for timer/motions toggle
  const [view, setView] = useState<'timer' | 'motions'>('timer');
  const [motions, setMotions] = useState<Motion[]>([]);
  const [allMembers, setAllMembers] = useState<Speaker[]>([]);
  
  // Speaker list state
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const [speakerQueue, setSpeakerQueue] = useState<Speaker[]>([]);

  // Load committee from URL param if not in context
  useEffect(() => {
    const loadCommitteeFromUrl = async () => {
      if (committee) {
        setLoadingCommittee(false);
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const committeeId = params.get('committee');

        if (!committeeId) {
          console.warn('No committee ID in URL');
          setLoadingCommittee(false);
          return;
        }

        console.log('Loading committee from URL:', committeeId);
        const { getCommitteeById } = await import('@/lib/supabase/committees');
        const fullCommittee = await getCommitteeById(committeeId);
        
        if (fullCommittee) {
          setCommittee(fullCommittee);
          console.log('Committee loaded from URL:', fullCommittee);
        }
      } catch (error) {
        console.error('Error loading committee from URL:', error);
      } finally {
        setLoadingCommittee(false);
      }
    };

    loadCommitteeFromUrl();
  }, [committee, setCommittee]);

  // Initialize members from committee data
  useEffect(() => {
    if (committee?.countryList) {
      // Create a Map to ensure unique countries by id
      const uniqueCountries = new Map();
      
      // Process each country and ensure uniqueness by id
      committee.countryList.forEach(country => {
        if (country.id && !uniqueCountries.has(country.id)) {
          uniqueCountries.set(country.id, {
            id: country.id,
            code: country.id.toLowerCase(),
            name: country.name,
            flagQuery: country.flagQuery || country.id.toLowerCase(),
            attendance: country.attendance || 'present'
          });
        }
      });
      
      // Convert Map values to array and sort by name
      const members = Array.from(uniqueCountries.values())
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('Speaker List: Setting unique members:', members);
      setAllMembers(members);
    } else {
      console.log('Speaker List: No committee data found');
      setAllMembers([]);
    }
  }, [committee]);  // Timer state
  
  const [currentTime, setCurrentTime] = useState(120);
const [timeInSeconds, setTimeInSeconds] = useState(120);
const [totalTime, setTotalTime] = useState(120);
const [isRunning, setIsRunning] = useState(false);
const [settingsLoaded, setSettingsLoaded] = useState(false);  
  // Committee state
  const [committeeName, setCommitteeName] = useState("Editable Committee Name");
  
  // Load committee info from session
  useEffect(() => {
    const sessionData = getSessionData();
    if (sessionData?.committeeInfo?.name) {
      setCommitteeName(sessionData.committeeInfo.name);
      setTitle(sessionData.committeeInfo.name);
    }
  }, [setTitle]);

  // Load committee settings and apply them
useEffect(() => {
  if (committee?.settings && !settingsLoaded) {
    console.log("=== Loading Committee Settings ===");
    console.log("Full committee object:", committee);
    console.log("Settings:", committee.settings);
    console.log("enableMotions:", committee.settings.enableMotions);
    console.log("enableVoting:", committee.settings.enableVoting);
    console.log("showMotions:", committee.settings.showMotions);
    
    // Set default speaking time from committee settings
    const defaultTime = committee.settings.speakingTime || 120;
    
    // Always set the default time
    setTimeInSeconds(defaultTime);
    
    // Only initialize current/total time if nothing is running
    if (!currentSpeaker && speakerQueue.length === 0 && !isRunning) {
      setTotalTime(defaultTime);
      setCurrentTime(defaultTime);
    }
    
    setSettingsLoaded(true);
    
    // Set display preferences
    setShowTimerDisplay(committee.settings.showTimer ?? true);
    setShowSpeakerListDisplay(committee.settings.showSpeakerList ?? true);
    setShowMotionsDisplay(true);
    setShowMotionStatusBadges(committee.settings.showMotions ?? true);
    
    console.log('Applied committee settings:', {
      speakingTime: defaultTime,
      enableMotions: committee.settings.enableMotions,
      enableVoting: committee.settings.enableVoting,
      showTimer: committee.settings.showTimer,
      showSpeakerList: committee.settings.showSpeakerList,
      showMotions: committee.settings.showMotions
    });
  }
}, [committee?.settings, settingsLoaded, currentSpeaker, speakerQueue.length, isRunning]);
  
  // Motion state
  const [activeMotionId, setActiveMotionId] = useState<string | null>(null);
  const [showMotionForm, setShowMotionForm] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [yieldDialogOpen, setYieldDialogOpen] = useState(false);
  const [extendMotionData, setExtendMotionData] = useState<{open: boolean; motion?: Motion}>({ open: false });
  
  // Yield state
  const [isYielded, setIsYielded] = useState(false);
  const [originalSpeaker, setOriginalSpeaker] = useState<Speaker | null>(null);
  const [originalQueue, setOriginalQueue] = useState<Speaker[]>([]);
  const [yieldedTime, setYieldedTime] = useState(0);

  // Display settings from committee
  const [showTimerDisplay, setShowTimerDisplay] = useState(true);
  const [showSpeakerListDisplay, setShowSpeakerListDisplay] = useState(true);
  const [showMotionsDisplay, setShowMotionsDisplay] = useState(true);
  const [showMotionStatusBadges, setShowMotionStatusBadges] = useState(true);

  // Timer settings function
  const updateTimerSettings = (motionToUse: Motion): void => {
    if (motionToUse.speakingTime) {
      setActiveMotionId(motionToUse.id);
      setTimeInSeconds(motionToUse.speakingTime);
      setTotalTime(motionToUse.speakingTime);
      setCurrentTime(motionToUse.speakingTime);
      setIsRunning(false);
    }
  };

  // Function to handle adding a speaker
  const handleAddSpeaker = (speaker: Speaker) => {
    if (!speaker) {
      toast.error('Invalid speaker data');
      return;
    }

    // Create new speaker object with guaranteed unique ID
    const newSpeaker = {
      ...speaker,
      id: `${speaker.code || speaker.id}_${Date.now()}`
    };
    
    // Check for duplicates in all possible places
    const isCurrentSpeaker = currentSpeaker?.code === speaker.code;
    const isInQueue = speakerQueue.some(s => s.code === speaker.code);
    const isYieldedTo = isYielded && originalSpeaker?.code === speaker.code;

    // Early return if speaker is already in any list
    if (isCurrentSpeaker || isInQueue || isYieldedTo) {
      toast.error(`${speaker.name} is already in the speaker list`);
      return;
    }

    // Get session data once
    const sessionData = getSessionData();
    const activeMotion = motions.find(m => m.id === activeMotionId);
    const isProposer = activeMotion?.proposingCountry === speaker.name;

    // Function to update state and session storage
    const updateSpeakerState = (newState: {
      currentSpeaker?: Speaker | null,
      queue?: Speaker[]
    }) => {
      // Update state
      if (newState.currentSpeaker !== undefined) {
        setCurrentSpeaker(newState.currentSpeaker);
      }
      if (newState.queue) {
        setSpeakerQueue(newState.queue);
      }

      // Update session storage with full committee data
      if (sessionData && committee) {
        updateSessionData({
          ...committee,
          currentSpeaker: newState.currentSpeaker || sessionData.currentSpeaker,
          speakerQueue: newState.queue || sessionData.speakerQueue
        } as any);
      }
    };

    // Handle active motion case
    if (activeMotion?.status === "In Progress") {
      if (!currentSpeaker && isProposer) {
        updateSpeakerState({ currentSpeaker: newSpeaker });
        toast.success(`${speaker.name} added as motion proposer`);
        return;
      }
    }

    // Handle normal case (no motion or non-proposer)
    if (!currentSpeaker && !isYielded) {
    // Add as current speaker if position is empty
    setTotalTime(timeInSeconds);  // Use default time
    setCurrentTime(timeInSeconds);  // Use default time
    updateSpeakerState({ currentSpeaker: newSpeaker });
    toast.success(`${speaker.name} added as current speaker`);
    logSpeakerAdded(speaker.name);
    } else {
      // Add to queue
      const newQueue = [...speakerQueue, newSpeaker];
      updateSpeakerState({ queue: newQueue });
      toast.success(`${speaker.name} added to speaker queue`);
      logSpeakerAdded(speaker.name);
    }
  };

  // Motion handlers
  const handleMotionSubmit = (motion: Omit<Motion, "id" | "createdAt">) => {
  // Check if motions are enabled (NOT voting)
  if (!committee?.settings?.enableMotions) {
    toast.error("Motions are disabled in committee settings");
    return;
  }

  const newMotion: Motion = {
    ...motion,
    id: Math.random().toString(36).substring(7),
    createdAt: new Date().toISOString(),
    status: "Pending"
  };
  
  setMotions(prev => [...prev, newMotion]);
  setShowMotionForm(false);

  // Switch to timer view for moderated caucus or GSL
  if (motion.type === "Moderated Caucus" || motion.type === "GSL") {
    setView('timer');
    updateTimerSettings(newMotion);
  }
};

  // Function to handle motion status changes
  const handleMotionStatusChange = (motionId: string, newStatus: MotionStatus) => {
    setMotions(prev => prev.map(m => {
      if (m.id === motionId) {
        // When a motion starts, set proposer as current speaker
        if (newStatus === "In Progress" && m.type !== "Unmoderated Caucus") {
          const proposer = allMembers.find(member => member.name === m.proposingCountry);
          if (proposer) {
            setCurrentSpeaker(proposer);
            setSpeakerQueue([]);
          }
        }
        return { ...m, status: newStatus } as Motion;
      }
      return m;
    }));
  };

  const handleExtendMotion = (motion: Motion) => {
  console.log('=== handleExtendMotion called ===');
  console.log('Motion:', motion);
  console.log('Motion status:', motion.status);
  console.log('enableVoting setting:', committee?.settings?.enableVoting);
  
  if (!motion) {
    toast.error('Invalid motion to extend');
    return;
  }
  
  if (motion.status !== "In Progress") {
    console.log('Motion status check failed:', motion.status);
    toast.error(`Cannot extend: Motion must be in progress (current status: ${motion.status})`);
    return;
  }

  if (motion.type !== "Moderated Caucus" && motion.type !== "GSL") {
    console.log('Motion type check failed:', motion.type);
    toast.error(`Cannot extend: Only Moderated Caucus and GSL can be extended`);
    return;
  }
  
  console.log('Setting extend motion data to:', { open: true, motion });
  setExtendMotionData({ open: true, motion });
  toast.info(`Opening extension dialog for ${motion.type}`);
};

  const handleExtendMotionSubmit = (
  motionId: string, 
  additionalDuration: number, 
  newSpeakingTime: number, 
  proposingCountry: string,
  passed: boolean  // ADD THIS PARAMETER
) => {
  const toastId = toast.loading('Processing motion extension...');
  
  // Validate parameters
  if (!motionId || additionalDuration <= 0 || newSpeakingTime <= 0 || !proposingCountry) {
    toast.dismiss(toastId);
    toast.error('Invalid extension parameters');
    return;
  }

  // Find and validate the original motion
  const originalMotion = motions.find(m => m.id === motionId);
  if (!originalMotion) {
    toast.dismiss(toastId);
    toast.error('Original motion not found');
    return;
  }

  // Check motion status
  if (originalMotion.status !== "In Progress") {
    toast.dismiss(toastId);
    toast.error('Cannot extend: Motion must be in progress');
    return;
  }

  // Calculate total time in seconds for display
  const totalTimeInSeconds = Math.round(additionalDuration * 60);

  // Create extension with proper status based on vote
  const extension: ExtendedMotion = {
    id: Math.random().toString(36).substring(7),
    type: "Extension",
    name: `Extension of ${originalMotion.name}`,
    createdAt: new Date().toISOString(),
    status: passed ? "Passed" : "Failed" as MotionStatus,  // SET STATUS BASED ON VOTE
    duration: additionalDuration,  // Keep in minutes for consistency
    speakingTime: newSpeakingTime,
    parentMotionId: motionId,
    proposingCountry,
    speakers: [],
    currentSpeakerIndex: 0
  };

    // If passed, update the parent motion immediately
  if (passed) {
    setMotions(prev => prev.map(motion => {
      if (motion.id === motionId) {
        return {
          ...motion,
          duration: (motion.duration || 0) + additionalDuration,
          speakingTime: newSpeakingTime
        };
      }
      return motion;
    }));

    // Update timer if this motion is active
    if (activeMotionId === motionId) {
      const updatedMotion = motions.find(m => m.id === motionId);
      if (updatedMotion) {
        updateTimerSettings({
          ...updatedMotion,
          duration: (updatedMotion.duration || 0) + additionalDuration,
          speakingTime: newSpeakingTime
        } as Motion);
      }
    }

    toast.dismiss(toastId);
    toast.success(`Extension passed! Added ${Math.floor(additionalDuration)} minutes`);
  } else {
    toast.dismiss(toastId);
    toast.info('Extension failed');
  }

  // Add the extension to the list
  setMotions(prev => [...prev, extension]);
  setExtendMotionData({ open: false });
};

  const handleAdjournMotion = (motionId: string) => {
    const motion = motions.find(m => m.id === motionId);
    if (!motion) return;
    
    if (motion.type === "Moderated Caucus" || motion.type === "GSL") {
      // Clear the active motion if this one was active
      if (activeMotionId === motionId) {
        setActiveMotionId(null);
      }
      
      // Update motion status to "Passed"
      setMotions(prev => prev.map(m => 
        m.id === motionId ? { ...m, status: "Passed" as MotionStatus } : m
      ));
    }
  };

  // Use CommitteeManager for attendance tracking
  // Motion voting handler
  const handleMotionVote = (motionId: string, votesFor: number, votesAgainst: number, abstentions: number): void => {
    setMotions(prevMotions => {
      const currentMotion = prevMotions.find(m => m.id === motionId);
      if (!currentMotion) {
        toast.error("Motion not found");
        return prevMotions;
      }

      const isPassed = votesFor > votesAgainst;
      const isExtension = currentMotion.type === "Extension";
      const isTimedMotion = currentMotion.type === "Moderated Caucus" || currentMotion.type === "GSL";

      const updatedMotions = [...prevMotions];
      
      // Handle successful motion
      if (isPassed) {
        // Handle proposer for moderated caucus
        if (currentMotion.type === "Moderated Caucus" && currentMotion.proposingCountry) {
          const proposer = allMembers.find(m => m.name === currentMotion.proposingCountry);
          if (proposer) {
            setCurrentSpeaker(proposer);
            if (committee) {
              updateSessionData({
                ...committee,
                currentSpeaker: proposer,
              } as any);
            }
          }
        }

        // Handle extension motions
        if (isExtension && currentMotion.parentMotionId) {
          const parentIndex = updatedMotions.findIndex(m => m.id === currentMotion.parentMotionId);
          if (parentIndex !== -1) {
            const parent = updatedMotions[parentIndex];
            const updatedParent = {
              ...parent,
              duration: (parent.duration || 0) + (currentMotion.duration || 0),
              speakingTime: (currentMotion.speakingTime)
                ? parent.speakingTime
                : currentMotion.speakingTime
            };

            if (parent.status === "In Progress") {
              setTimeout(() => {
                updateTimerSettings(updatedParent);
              }, 0);
            }

            updatedMotions[parentIndex] = updatedParent;
          }
        }
        // Handle timed motions
        else if (isTimedMotion && currentMotion.speakingTime) {
          const newStatus = isTimedMotion ? "In Progress" : "Passed";
          if (newStatus === "In Progress") {
            setTimeout(() => {
              updateTimerSettings(currentMotion);
            }, 0);
          }

          setTimeInSeconds(currentMotion.speakingTime);
          setTotalTime(currentMotion.speakingTime);
        }
      }

      // Update motion status
      const motionIndex = updatedMotions.findIndex(m => m.id === motionId);
      if (motionIndex !== -1) {
        const newStatus: MotionStatus = isPassed
          ? isExtension 
            ? "Passed"
            : isTimedMotion
              ? "In Progress"
              : "Passed"
          : "Failed";

        updatedMotions[motionIndex] = {
          ...currentMotion,
          status: newStatus,
          votesFor,
          votesAgainst,
          abstentions
        };
      }

      return updatedMotions;
    });
  };

  // Handle country updates
  // Country updates now handled by committee context



  // Motion effects
  useEffect(() => {
    if (activeMotionId) {
      const currentMotion = motions.find(m => m.id === activeMotionId);
      if (currentMotion && currentMotion.status === "In Progress") {
        const extendedMotion = currentMotion as ExtendedMotion;
        const currentSpeakerId = extendedMotion.speakers?.[extendedMotion.currentSpeakerIndex ?? 0];
        if (currentSpeakerId) {
          const speaker = allMembers.find(m => m.id === currentSpeakerId);
          if (speaker) {
            setCurrentSpeaker(speaker);
          }
        }
      }
    }
  }, [activeMotionId, motions, allMembers]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        // When counting down (positive time)
        if (prev > 0) {
          return prev - 1;
        }
        // When counting up (negative time)
        return prev - 1;  // Keep going negative to show overtime
      })
    }, 1000)

    return () => clearInterval(interval);
  }, [isRunning, currentTime]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRemoveSpeaker = (id: string) => {
    if (!id) return;

    // Get session data once
    const sessionData = getSessionData() || {};
    
    let nextSpeaker = currentSpeaker;
    let newQueue = [...speakerQueue];
    
    const updateStatesAndStorage = (updates: {
      nextSpeaker: Speaker | null,
      newQueue: Speaker[],
      speakerToRemove: Speaker
    }) => {
      const { nextSpeaker, newQueue, speakerToRemove } = updates;
      
      // Update states
      setCurrentSpeaker(nextSpeaker);
      setSpeakerQueue(newQueue);
      
      // Log removal
      logSpeakerRemoved(speakerToRemove.name);
      
      // Update storage
      if (committee) {
        updateSessionData({
          ...committee,
          currentSpeaker: nextSpeaker,
          speakerQueue: newQueue
        } as any);
      }

      // Show appropriate toast
      if (nextSpeaker && speakerToRemove.id === currentSpeaker?.id) {
        toast.info(`${speakerToRemove.name} removed, ${nextSpeaker.name} is now speaking`);
      } else {
        toast.info(`${speakerToRemove.name} removed from speaker list`);
      }
    };

    // If removing current speaker
    if (currentSpeaker?.id === id) {
      const speakerToRemove = currentSpeaker;
      nextSpeaker = null;

      if (!isYielded && speakerQueue.length > 0) {
        // Advance the queue
        const [next, ...remainingQueue] = speakerQueue;
        nextSpeaker = next;
        newQueue = remainingQueue;
      }

      updateStatesAndStorage({
        nextSpeaker,
        newQueue,
        speakerToRemove
      });

      // Update motion speakers list if needed
      if (activeMotionId) {
        setMotions(prev => prev.map(motion => {
          if (motion.id === activeMotionId && 'speakers' in motion) {
            const extendedMotion = motion as ExtendedMotion;
            return {
              ...extendedMotion,
              speakers: extendedMotion.speakers.filter(speakerId => speakerId !== id)
            };
          }
          return motion;
        }));
      }
    } else if (isYielded) {
      // Remove from yielded queue
      const speakerToRemove = originalQueue.find(s => s.id === id);
      if (speakerToRemove) {
        const newOriginalQueue = originalQueue.filter(s => s.id !== id);
        setOriginalQueue(newOriginalQueue);
        logSpeakerRemoved(speakerToRemove.name);
        toast.info(`${speakerToRemove.name} removed from yielded queue`);
      }
    } else {
      // Remove from regular queue
      const speakerToRemove = speakerQueue.find(s => s.id === id);
      if (speakerToRemove) {
        const newQueue = speakerQueue.filter(s => s.id !== id);
        updateStatesAndStorage({
          nextSpeaker: currentSpeaker,
          newQueue,
          speakerToRemove
        });
        logSpeakerRemoved(speakerToRemove.name);
      }
      setSpeakerQueue(speakerQueue.filter((s) => s.id !== id));
    }
  }

  const handleNextSpeaker = () => {
  if (currentSpeaker) {
    toast.success(`${currentSpeaker.name} completed speaking`);
  }
  
  if (speakerQueue.length > 0) {
    // Get next speaker and remaining queue
    const [nextSpeaker, ...remainingQueue] = speakerQueue;
    toast.info(`Next speaker: ${nextSpeaker.name}`);
    
    // Calculate total time: use default time (timeInSeconds) + any yielded time
    const speakerTotalTime = nextSpeaker.yieldedTime 
      ? timeInSeconds + nextSpeaker.yieldedTime 
      : timeInSeconds;
    
    setTotalTime(speakerTotalTime);
    setCurrentTime(speakerTotalTime);
    
    if (nextSpeaker.yieldedTime && nextSpeaker.yieldedTime > 0) {
      const mins = Math.floor(nextSpeaker.yieldedTime / 60);
      const secs = nextSpeaker.yieldedTime % 60;
      toast.info(`Includes ${mins}:${secs.toString().padStart(2, '0')} yielded time`);
    }
    
    setCurrentSpeaker(nextSpeaker);
    setSpeakerQueue(remainingQueue);
    
    // Get and update session storage
    const sessionData = getSessionData();
    if (sessionData) {
      updateSessionData({
        ...sessionData,
        currentSpeaker: nextSpeaker,
        speakerQueue: remainingQueue,
      });
    }
  } else {
    // No more speakers
    setCurrentSpeaker(null);
    
    // Update session storage
    const sessionData = getSessionData();
    if (sessionData) {
      updateSessionData({
        ...sessionData,
        currentSpeaker: null,
        speakerQueue: [],
      });
    }
  }

  // Always pause the timer when moving to next speaker
  setIsRunning(false);
};

  const handleYield = (speaker: Speaker) => {
  const toastId = toast.loading('Processing yield...');
  
  if (!currentSpeaker) {
    toast.dismiss(toastId);
    toast.error('Cannot yield: No current speaker');
    return;
  }
  if (currentTime <= 0) {
    toast.dismiss(toastId);
    toast.error('Cannot yield: No time remaining');
    return;
  }
  if (speaker.id === currentSpeaker.id) {
    toast.dismiss(toastId);
    toast.error('Cannot yield to self');
    return;
  }

  const yieldedTimeAmount = currentTime;
  const yieldToIndex = speakerQueue.findIndex(s => s.code === speaker.code);
  
  if (yieldToIndex === -1) {
    toast.dismiss(toastId);
    toast.error('Speaker not found in queue');
    return;
  }

  const speakerWithYieldedTime = {
    ...speakerQueue[yieldToIndex],
    yieldedTime: (speakerQueue[yieldToIndex].yieldedTime || 0) + yieldedTimeAmount,
  };

  const updatedQueue = [...speakerQueue];
  updatedQueue[yieldToIndex] = speakerWithYieldedTime;

  let nextSpeaker: Speaker | null = null;
  let remainingQueue: Speaker[] = [];

  if (updatedQueue.length > 0) {
    const [nextUp, ...rest] = updatedQueue;
    nextSpeaker = nextUp;
    remainingQueue = rest;
  }

  // Use default time (timeInSeconds) + yielded time
  const nextSpeakerTotalTime = nextSpeaker?.yieldedTime 
    ? timeInSeconds + nextSpeaker.yieldedTime 
    : timeInSeconds;

  setCurrentSpeaker(nextSpeaker);
  setSpeakerQueue(remainingQueue);
  setCurrentTime(nextSpeakerTotalTime);
  setTotalTime(nextSpeakerTotalTime);
  setIsRunning(false);

  const mins = Math.floor(yieldedTimeAmount / 60);
  const secs = yieldedTimeAmount % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
  logSpeakerYield(currentSpeaker.name, speaker.name, timeString);
  
  const storedData = getSessionData();
  if (storedData && committee) {
    updateSessionData({
      ...committee,
      currentSpeaker: nextSpeaker,
      speakerQueue: remainingQueue,
    } as any);
  }
  
  toast.dismiss(toastId);
  toast.success(`${currentSpeaker.name} yielded ${mins}:${secs.toString().padStart(2, '0')} to ${speaker.name}`);
  if (nextSpeaker) {
    if (nextSpeaker.yieldedTime && nextSpeaker.yieldedTime > 0) {
      const yieldedMins = Math.floor(nextSpeaker.yieldedTime / 60);
      const yieldedSecs = nextSpeaker.yieldedTime % 60;
      toast.info(`${nextSpeaker.name} is now speaking (${nextSpeakerTotalTime}s total: ${Math.floor(timeInSeconds / 60)}m + ${yieldedMins}:${yieldedSecs})`);
    } else {
      toast.info(`Next speaker: ${nextSpeaker.name}`);
    }
  }
}

  const handleSetTime = (minutes: number, seconds: number, updateMotion = false) => {
  const newTime = minutes * 60 + seconds;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Update the default speaking time
  setTimeInSeconds(newTime);
  
  logTimingConfig(minutes, seconds);
  toast.success(`Default speaking time set to ${formattedTime}`);
}

  const handleReset = () => {
  // Reset to default time (timeInSeconds), not totalTime
  setCurrentTime(timeInSeconds + (currentSpeaker?.yieldedTime || 0))
  setTotalTime(timeInSeconds + (currentSpeaker?.yieldedTime || 0))
  setIsRunning(false)
  toast.info("Timer reset");
}

  const handleStart = () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);
    toast.info(newIsRunning ? "Timer started" : "Timer paused");
  }

  const handleReorderSpeakers = (newOrder: Speaker[]) => {
    if (isYielded) {
      // When yielded, update the original queue
      setOriginalQueue(newOrder);
    } else {
      // Normal flow: update speaker queue directly without filtering
      setSpeakerQueue(newOrder);
    }
    logSpeakerReordered();
  };

  // Handler for swapping current speaker with queue speaker
  const handleSwapCurrentWithQueue = (queueSpeaker: Speaker, queueIndex: number) => {
    if (!currentSpeaker) return;
    
    const oldCurrentSpeaker = currentSpeaker;
    
    // Set queue speaker as new current speaker
    setCurrentSpeaker(queueSpeaker);
    
    // Update the queue - replace the queue speaker with the old current speaker
    // Ensure the old current speaker maintains a consistent ID format
    const newQueue = [...speakerQueue];
    newQueue[queueIndex] = {
      ...oldCurrentSpeaker,
      // Keep original ID structure, don't add _queue_ suffix
      id: oldCurrentSpeaker.id.replace(/_queue_\d+$/, '') // Remove any existing _queue_ suffix
    };
    
    setSpeakerQueue(newQueue);
    
    // Update session storage
    const sessionData = getSessionData();
    if (sessionData) {
      updateSessionData({
        ...sessionData,
        currentSpeaker: queueSpeaker,
        speakerQueue: newQueue,
      });
    }
    
    toast.success(`Swapped: ${queueSpeaker.name} is now speaking, ${oldCurrentSpeaker.name} moved to position ${queueIndex + 1}`);
  };

  // Handler for moving current speaker to queue
  const handleMoveCurrentToQueue = (currentSpeakerToMove: Speaker, insertIndex: number) => {
  const targetSpeaker = speakerQueue[insertIndex];
  
  if (targetSpeaker) {
    // There's a speaker at this position - perform a swap
    const newQueue = [...speakerQueue];
    
    // Keep the speaker's original ID without adding _queue_ suffix
    const speakerToInsert = {
      ...currentSpeakerToMove,
      id: currentSpeakerToMove.id.replace(/_queue_\d+$/, '')
    };
    
    // Replace the speaker at insertIndex with the current speaker
    newQueue[insertIndex] = speakerToInsert;
    
    // Set the target speaker as the new current speaker
    setCurrentSpeaker(targetSpeaker);
    setSpeakerQueue(newQueue);
    
    // Update session storage
    const sessionData = getSessionData();
    if (sessionData) {
      updateSessionData({
        ...sessionData,
        currentSpeaker: targetSpeaker,
        speakerQueue: newQueue,
      });
    }
    
    toast.success(`Swapped: ${targetSpeaker.name} is now speaking, ${currentSpeakerToMove.name} moved to position ${insertIndex + 1}`);
  } else {
    // No speaker at this position - just insert
    const newQueue = [...speakerQueue];
    
    const speakerToInsert = {
      ...currentSpeakerToMove,
      id: currentSpeakerToMove.id.replace(/_queue_\d+$/, '')
    };
    
    newQueue.splice(insertIndex, 0, speakerToInsert);
    
    setCurrentSpeaker(null);
    setSpeakerQueue(newQueue);
    
    const sessionData = getSessionData();
    if (sessionData) {
      updateSessionData({
        ...sessionData,
        currentSpeaker: null,
        speakerQueue: newQueue,
      });
    }
    
    toast.success(`${currentSpeakerToMove.name} moved to queue position ${insertIndex + 1}`);
  }
};

  const availableForYield = allMembers.filter(
    (m) => m.id !== currentSpeaker?.id
  )

  // Get available speakers based on attendance status
  // Available speakers are now handled by SpeakerAttendance component

  if (loadingCommittee) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading committee...</p>
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-lg font-semibold mb-2">Committee Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The committee you're trying to access could not be loaded.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header with New Motion button and view toggle */}
        <div className="flex justify-between items-center mb-6">
  <div className="flex gap-2">
    <Button 
      variant={view === 'timer' ? 'default' : 'outline'}
      onClick={() => setView('timer')}
    >
      Timer
    </Button>
    {committee?.settings?.enableMotions && (
      <Button 
        variant={view === 'motions' ? 'default' : 'outline'}
        onClick={() => setView('motions')}
      >
        Motions
      </Button>
    )}
  </div>
  <Button 
    variant="outline"
    onClick={() => committee?.settings?.enableMotions && setShowMotionForm(true)}
    disabled={!committee?.settings?.enableMotions}
    className={!committee?.settings?.enableMotions ? "opacity-50 cursor-not-allowed" : ""}
    title={!committee?.settings?.enableMotions ? "Motions are disabled in committee settings" : undefined}
  >
    <Vote className="mr-2 h-4 w-4" />
    New Motion
  </Button>
</div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div>
{view === 'timer' ? (
  <>
    <Card className="p-8 mb-6">
      <TimeDisplay 
        currentTime={currentTime} 
        totalTime={activeMotionId ? (motions.find(m => m.id === activeMotionId)?.speakingTime || totalTime) : totalTime} 
        isRunning={isRunning}
        motionTotalTime={activeMotionId ? motions.find(m => m.id === activeMotionId)?.duration ?? 0 : undefined}
        yieldedTime={currentSpeaker?.yieldedTime || 0}
        showTimer={showTimerDisplay}
      />
      {showTimerDisplay && (
        <TimerControls
          onYield={() => setYieldDialogOpen(true)}
          onSettings={() => setTimeDialogOpen(true)}
          onReset={handleReset}
          onStart={handleStart}
          isRunning={isRunning}
        />
      )}
    </Card>
    {showSpeakerListDisplay ? (
      <div className="space-y-4">
        <CurrentSpeaker 
          speaker={currentSpeaker} 
          onNext={handleNextSpeaker}
          isYielded={isYielded}
          originalSpeaker={originalSpeaker}
          yieldedTime={yieldedTime}
          onSwapWithQueue={handleSwapCurrentWithQueue}
        />
        <UpcomingSpeakers 
          speakers={isYielded ? originalQueue : speakerQueue} 
          onRemove={handleRemoveSpeaker}
          onReorder={handleReorderSpeakers}
          currentSpeaker={currentSpeaker}
          onMoveCurrentToQueue={handleMoveCurrentToQueue}
        />
      </div>
    ) : (
      <Card className="p-8 text-center text-muted-foreground">
        Speaker list display is hidden
      </Card>
    )}
  </>
) : (
  <div>
    {showMotionsDisplay ? (
      <>
        <Card className="mb-6">
          <MotionList
  motions={motions.filter(m => !m.parentMotionId || m.type !== "Extension")}
  onVote={handleMotionVote}
  onAdjournMotion={handleAdjournMotion}
  onStatusChange={(motionId: string, newStatus: "Pending" | "In Progress" | "Completed") => {
    const mappedStatus: MotionStatus = newStatus === "Completed" ? "Passed" : newStatus;
    handleMotionStatusChange(motionId, mappedStatus);
  }}
  onExtendMotion={handleExtendMotion}
  onEditMotion={() => {}}
  onReorderMotions={() => {}}
  allMembers={allMembers}
  currentSpeaker={currentSpeaker}
  showMotionStatus={showMotionStatusBadges}
  enableVoting={committee?.settings?.enableVoting ?? true}  // ADD THIS LINE
/>
          {/* Display extension motions under their parent */}
          {motions.filter(m => m.type === "Extension" && m.parentMotionId).map(extension => {
            const parent = motions.find(m => m.id === extension.parentMotionId);
            if (!parent) return null;
            
            // Calculate time values
            const durationInSeconds = Math.round((extension.duration || 0) * 60);
            const speakingTimeInSeconds = extension.speakingTime || 0;
            const totalSpeakers = speakingTimeInSeconds > 0 
              ? Math.floor(durationInSeconds / speakingTimeInSeconds)
              : 0;
            
            // Status colors matching MotionList.tsx
            const statusColors: Record<string, string> = {
              "Pending": "bg-warning text-warning-foreground",
              "In Progress": "bg-primary text-primary-foreground",
              "Passed": "bg-success text-success-foreground",
              "Failed": "bg-destructive text-destructive-foreground",
            };
            
            return (
              <Card key={extension.id} className="p-5 mx-4 mb-3 flex flex-col gap-4 pb-4 max-w-[95%] hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
  <h4 className="font-semibold text-lg">Extension to {parent.name}</h4>
  {showMotionStatusBadges && (
    <Badge className={statusColors[extension.status] || "bg-secondary"}>
      {extension.status}
    </Badge>
  )}
</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Proposed by:</span> {extension.proposingCountry}
                      </p>
                      <p>
                        <span className="font-medium">Additional Time:</span>{' '}
                        {Math.floor(durationInSeconds / 60)}:{(durationInSeconds % 60).toString().padStart(2, '0')}
                      </p>
                      {speakingTimeInSeconds > 0 && (
                        <p>
                          <span className="font-medium">Speaking Time:</span>{' '}
                          {Math.floor(speakingTimeInSeconds / 60)}:{(speakingTimeInSeconds % 60).toString().padStart(2, '0')} per speaker
                        </p>
                      )}
                      {totalSpeakers > 0 && (
                        <p>
                          <span className="font-medium">Total Speakers:</span> {totalSpeakers}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </Card>
      </>
    ) : (
      <Card className="p-8 text-center text-muted-foreground mb-6">
        Motion display is hidden by committee settings
      </Card>
    )}
  </div>
)}
            
            <Dialog open={showMotionForm} onOpenChange={setShowMotionForm}>
              <DialogContent className="sm:max-w-[425px]" showCloseButton={false} title="New Motion">
                <DialogHeader>
                  <DialogTitle>New Motion</DialogTitle>
                </DialogHeader>
                <MotionForm
                  committeeId={committeeName}
                  onSubmit={handleMotionSubmit}
                  onCancel={() => setShowMotionForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Speaker list */}
            <SpeakerAttendance 
              availableSpeakers={allMembers}
              currentSpeaker={currentSpeaker}
              speakerQueue={speakerQueue}
              onUpdateAttendance={(speakerId, status) => {
                setAllMembers(prev => prev.map(member => 
                  member.id === speakerId ? { ...member, attendance: status } : member
                ));
              }}
              onAdd={(speaker) => {
                handleAddSpeaker(speaker);
                // Log the addition
                logSpeakerAdded(speaker.name);

                if (activeMotionId) {
                  // Add to motion's speaker list
                  setMotions(prev => prev.map(motion => {
                    if (motion.id === activeMotionId && 'speakers' in motion) {
                      const extendedMotion = motion as ExtendedMotion;
                      return {
                        ...extendedMotion,
                        speakers: [...extendedMotion.speakers, speaker.id]
                      };
                    }
                    return motion;
                  }));
                }
              }} 
            />
          </div>
        </div>
      </div>

      <TimeSettingsDialog
        open={timeDialogOpen}
        onOpenChange={setTimeDialogOpen}
        currentTime={totalTime}
        onSave={handleSetTime}
        activeMotionId={activeMotionId || undefined}
        motions={motions}
      />

      <YieldDialog
        open={yieldDialogOpen}
        onOpenChange={setYieldDialogOpen}
        availableSpeakers={availableForYield}
        onYield={handleYield}
      />

  {extendMotionData.motion && (
  <ExtendMotionDialog
    open={extendMotionData.open}
    onOpenChange={(open) => {
      console.log("=== ExtendMotionDialog onOpenChange ===");
      console.log("New open state:", open);
      setExtendMotionData(prev => ({ ...prev, open }));
    }}
    originalMotion={extendMotionData.motion}
    onSubmit={handleExtendMotionSubmit}
    countries={(committee?.countryList || []).map(c => ({ 
      ...c, 
      code: c.id 
    }))}
    enableVoting={committee?.settings?.enableVoting ?? true}
  />
)}
    </div>
  );
}
