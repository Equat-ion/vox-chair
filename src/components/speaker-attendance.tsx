"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useCommittee } from "@/lib/committee-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FlagAvatar } from "@/components/ui/flag-avatar"
import { ChevronsUpDown, Check } from "lucide-react"
import { getSessionData } from "@/lib/session-storage"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Speaker = {
  id: string
  code: string  // Country code for flag and uniqueness
  name: string
  flagQuery: string
  attendance?: 'present' | 'present-voting' | 'absent'
}

interface SpeakerAttendanceProps {
  availableSpeakers: Speaker[]
  onAdd: (speaker: Speaker) => void
  onUpdateAttendance?: (speakerId: string, status: 'present' | 'present-voting' | 'absent') => void
  currentSpeaker?: Speaker | null
  speakerQueue?: Speaker[]
}

export function SpeakerAttendance({ 
  availableSpeakers: propSpeakers, 
  onAdd, 
  onUpdateAttendance,
  currentSpeaker,
  speakerQueue
}: SpeakerAttendanceProps) {
  const { committee } = useCommittee()
  const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([])

  useEffect(() => {
    if (committee?.countryList) {
      // Create a Map to store unique countries by code
      const uniqueCountries = new Map();
      
      // First, process the countryList
      committee.countryList.forEach(country => {
        if (country.code && !uniqueCountries.has(country.code)) {
          uniqueCountries.set(country.code, {
            id: country.code,
            code: country.code,
            name: country.name,
            flagQuery: country.code.toLowerCase(),
            attendance: 'absent' // Default to present
          });
        }
      });
      
      // Then update attendance from countries array
      committee.countries?.forEach(country => {
        if (country.code && uniqueCountries.has(country.code)) {
          const existing = uniqueCountries.get(country.code);
          uniqueCountries.set(country.code, {
            ...existing,
            attendance: country.attendance
          });
        }
      });
      
      console.log('Unique countries:', Array.from(uniqueCountries.values()));
      setAvailableSpeakers(Array.from(uniqueCountries.values()));
    }
  }, [committee])
  const [view, setView] = useState<'attendance' | 'speakers'>('speakers')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  
  // For speakers view - only show present countries
  const presentSpeakers = availableSpeakers.filter(
    (s) => s.attendance === "present" || s.attendance === "present-voting"
  )

  const handleAddSpeaker = () => {
    // Find speaker by name in available speakers
    const speaker = availableSpeakers.find(s => s.name === selectedSpeaker);
    if (!speaker) {
      console.warn('Selected speaker not found:', selectedSpeaker);
      return;
    }
    
    // Ensure we have the required data
    if (!speaker.code || !speaker.name) {
      console.error('Invalid speaker data:', speaker);
      return;
    }

    // Strict duplicate checking using country code
    const isCurrentSpeaker = currentSpeaker?.code === speaker.code;
    const isInQueue = speakerQueue?.some(s => s.code === speaker.code);
    const isPresent = speaker.attendance === 'present' || speaker.attendance === 'present-voting';

    // Validate speaker
    if (!isPresent) {
      alert(`${speaker.name} must be marked as present to be added to the speaker list`);
      return;
    }

    if (isCurrentSpeaker || isInQueue) {
      alert(`${speaker.name} is already in the speaker list`);
      return;
    }
    
    if (isInQueue) {
      alert("This country is already in the speaker list")
      return
    }

    onAdd(speaker)
    setSelectedSpeaker("")
    setSearchOpen(false)
  }

  const updateAttendance = (speaker: Speaker, status: 'present' | 'present-voting' | 'absent') => {
    if (onUpdateAttendance) {
      onUpdateAttendance(speaker.id, status)
    }
  }

  const toggleView = () => setView(prev => prev === 'attendance' ? 'speakers' : 'attendance')

  return (
    <Card className="p-4 border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {view === 'attendance' ? 'Committee Attendance' : 'Add Speaker'}
        </h2>
        <Badge 
          variant="secondary" 
          className="cursor-pointer hover:bg-secondary/80"
          onClick={toggleView}
        >
          Switch to {view === 'attendance' ? 'Add Speaker' : 'Attendance'}
        </Badge>
      </div>

      {view === 'attendance' ? (
        // Attendance View - Show all countries with absent ones at bottom
        <div className="space-y-2">
          {availableSpeakers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No countries added
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {/* Sort countries: present/present-voting first, then absent */}
                {[...availableSpeakers].sort((a, b) => {
                  const aIsAbsent = a.attendance === 'absent';
                  const bIsAbsent = b.attendance === 'absent';
                  if (aIsAbsent && !bIsAbsent) return 1;
                  if (!aIsAbsent && bIsAbsent) return -1;
                  return a.name.localeCompare(b.name);
                }).map((speaker) => (
                  <div
                    key={speaker.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg transition-colors",
                      speaker.attendance === 'absent' 
                        ? "bg-muted/20 hover:bg-muted/30" 
                        : "hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {speaker.code && (
                        <FlagAvatar 
                          query={speaker.code.toLowerCase()}
                          alt={`${speaker.name} flag`} 
                          className="h-6 w-6" 
                        />
                      )}
                      <span className={cn(
                        "text-sm",
                        speaker.attendance === 'absent' && "text-muted-foreground"
                      )}>{speaker.name}</span>
                    </div>
                    <Select
                      value={speaker.attendance || 'absent'}
                      onValueChange={(value: 'present' | 'present-voting' | 'absent') => {
                        if (onUpdateAttendance) {
                          onUpdateAttendance(speaker.id, value);
                          // Also update local state
                          setAvailableSpeakers(prev => prev.map(s => 
                            s.id === speaker.id ? { ...s, attendance: value } : s
                          ));
                        }
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="present-voting">Present & Voting</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      ) : (
        // Add Speaker View - Dropdown search and list of present countries
        <>
          <div className="mb-4">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                >
                  {selectedSpeaker ? (
                    (() => {
                      const speaker = availableSpeakers.find((s) => s.name === selectedSpeaker);
                      return speaker ? (
                        <div className="flex items-center gap-2">
                          <FlagAvatar
                            query={speaker.flagQuery}
                            className="h-5 w-5"
                          />
                          {speaker.name}
                        </div>
                      ) : selectedSpeaker;
                    })()
                  ) : "Search countries added to committee..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search all countries..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  {availableSpeakers.length === 0 ? (
                    <CommandEmpty>No countries added to committee.</CommandEmpty>
                  ) : searchQuery && !availableSpeakers.some(s => 
                      s.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ) ? (
                    <CommandEmpty>No matching countries found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      <ScrollArea className="h-[200px]">
                        <div>
                          {availableSpeakers
                            .filter(speaker => 
                              !searchQuery || 
                              speaker.name.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((speaker) => (
                              <CommandItem
                                key={speaker.id}
                                value={speaker.name}
                                onSelect={(currentValue) => {
                                  setSelectedSpeaker(currentValue === selectedSpeaker ? "" : currentValue)
                                  setSearchOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSpeaker === speaker.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center gap-2">
                                  <FlagAvatar
                                    query={speaker.flagQuery}
                                    className="h-5 w-5"
                                  />
                                  {speaker.name}
                                </div>
                              </CommandItem>
                            ))}
                        </div>
                      </ScrollArea>
                    </CommandGroup>
                  )}
                </Command>
              </PopoverContent>
            </Popover>
            <Button 
              onClick={handleAddSpeaker} 
              disabled={!selectedSpeaker}
              className="w-full mt-2"
            >
              Add to Speaker List
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Present Countries</h3>
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {presentSpeakers.map((speaker) => (
                  <button
                    key={speaker.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => onAdd(speaker)}
                  >
                    <div className="flex items-center gap-3">
                      <FlagAvatar query={speaker.flagQuery} alt={`${speaker.name} flag`} className="h-8 w-8" />
                      <span>{speaker.name}</span>
                    </div>
                    <Badge variant={speaker.attendance === "present-voting" ? "default" : "secondary"}>
                      {speaker.attendance === "present-voting" ? "Present & Voting" : "Present"}
                    </Badge>
                  </button>
                ))}
                {presentSpeakers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No countries present
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </Card>
  )
}