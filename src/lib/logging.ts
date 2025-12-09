// Logging system for committee actions
export type LogActionType =
  | "agenda-change"
  | "rollcall-update"
  | "speaker-added"
  | "speaker-removed"
  | "speaker-reordered"
  | "speaker-yield"
  | "timing-config"
  | "member-added"
  | "member-removed"
  | "member-renamed"
  | "draft-created"
  | "draft-deleted"
  | "session-start"
  | "session-end"

export type LogCategory = "destructive" | "standard" | "addition" | "info"

export interface LogEntry {
  id: string
  timestamp: Date
  actionType: LogActionType
  category: LogCategory
  title: string
  description: string
  metadata?: Record<string, unknown>
}

// Determine the category based on action type
export function getLogCategory(actionType: LogActionType): LogCategory {
  const destructiveActions: LogActionType[] = [
    "speaker-removed",
    "member-removed",
    "draft-deleted",
    "session-end",
  ]
  
  const additionActions: LogActionType[] = [
    "speaker-added",
    "member-added",
    "draft-created",
    "session-start",
  ]
  
  const infoActions: LogActionType[] = [
    "agenda-change",
    "rollcall-update",
    "timing-config",
  ]

  if (destructiveActions.includes(actionType)) return "destructive"
  if (additionActions.includes(actionType)) return "addition"
  if (infoActions.includes(actionType)) return "info"
  return "standard"
}

// Get LED color based on category
export function getCategoryColor(category: LogCategory): string {
  switch (category) {
    case "destructive":
      return "bg-red-500"
    case "addition":
      return "bg-green-500"
    case "info":
      return "bg-yellow-500"
    case "standard":
    default:
      return "bg-gray-400"
  }
}

// Store logs in localStorage
const LOGS_STORAGE_KEY = "committee_logs"

export function getLogs(): LogEntry[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(LOGS_STORAGE_KEY)
    if (!stored) return []
    
    const logsRaw = JSON.parse(stored) as unknown
    // Convert timestamp strings back to Date objects
    if (!Array.isArray(logsRaw)) return []
    return (logsRaw as Array<Record<string, unknown>>).map((log) => {
      const rawTs = log.timestamp
      let timestamp: Date
      if (rawTs instanceof Date) {
        timestamp = rawTs
      } else if (typeof rawTs === "number" || typeof rawTs === "string") {
        timestamp = new Date(rawTs)
      } else {
        timestamp = new Date()
      }

      return {
        ...log,
        timestamp,
      } as LogEntry
    })
  } catch (error) {
    console.error("Error loading logs:", error)
    return []
  }
}

export function saveLogs(logs: LogEntry[]): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs))
  } catch (error) {
    console.error("Error saving logs:", error)
  }
}

export function addLog(
  actionType: LogActionType,
  title: string,
  description: string,
  metadata?: Record<string, unknown>
): void {
  const logs = getLogs()
  const category = getLogCategory(actionType)
  
  const newLog: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    actionType,
    category,
    title,
    description,
    metadata,
  }
  
  logs.unshift(newLog) // Add to beginning for most recent first
  saveLogs(logs)
}

export function clearLogs(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(LOGS_STORAGE_KEY)
}

// Helper functions for specific log types
export function logAgendaChange(oldAgenda: string, newAgenda: string): void {
  addLog(
    "agenda-change",
    "Agenda Updated",
    `Changed from "${oldAgenda}" to "${newAgenda}"`,
    { oldAgenda, newAgenda }
  )
}

export function logRollCallUpdate(
  memberName: string,
  oldStatus: string,
  newStatus: string
): void {
  addLog(
    "rollcall-update",
    "Attendance Updated",
    `${memberName}: ${oldStatus} → ${newStatus}`,
    { memberName, oldStatus, newStatus }
  )
}

export function logSpeakerAdded(speakerName: string): void {
  addLog(
    "speaker-added",
    "Speaker Added",
    `${speakerName} added to speakers list`,
    { speakerName }
  )
}

export function logSpeakerRemoved(speakerName: string): void {
  addLog(
    "speaker-removed",
    "Speaker Removed",
    `${speakerName} removed from speakers list`,
    { speakerName }
  )
}

export function logSpeakerReordered(): void {
  addLog(
    "speaker-reordered",
    "Speakers Reordered",
    "Speaker list order was changed",
    {}
  )
}

export function logSpeakerYield(
  fromSpeaker: string,
  toSpeaker: string,
  timeRemaining: string
): void {
  addLog(
    "speaker-yield",
    "Time Yielded",
    `${fromSpeaker} yielded to ${toSpeaker} (${timeRemaining} remaining)`,
    { fromSpeaker, toSpeaker, timeRemaining }
  )
}

export function logTimingConfig(minutes: number, seconds: number): void {
  addLog(
    "timing-config",
    "Speaking Time Updated",
    `Set to ${minutes}:${seconds.toString().padStart(2, "0")}`,
    { minutes, seconds, totalSeconds: minutes * 60 + seconds }
  )
}

export function logMemberAdded(memberName: string, memberType: "predefined" | "custom"): void {
  addLog(
    "member-added",
    "Member Added",
    `${memberName} added as ${memberType} member`,
    { memberName, memberType }
  )
}

export function logMemberRemoved(memberName: string): void {
  addLog(
    "member-removed",
    "Member Removed",
    `${memberName} removed from committee`,
    { memberName }
  )
}

export function logMemberRenamed(oldName: string, newName: string): void {
  addLog(
    "member-renamed",
    "Member Renamed",
    `Renamed from "${oldName}" to "${newName}"`,
    { oldName, newName }
  )
}

export function logDraftCreated(draftName: string, draftType: string): void {
  addLog(
    "draft-created",
    "Draft Created",
    `New ${draftType}: "${draftName}"`,
    { draftName, draftType }
  )
}

export function logDraftDeleted(draftName: string, draftType: string): void {
  addLog(
    "draft-deleted",
    "Draft Deleted",
    `Deleted ${draftType}: "${draftName}"`,
    { draftName, draftType }
  )
}

export function logSessionStart(committeeName: string, memberCount: number): void {
  addLog(
    "session-start",
    "Session Started",
    `Committee "${committeeName}" started with ${memberCount} members`,
    { committeeName, memberCount }
  )
}

export function logSessionEnd(committeeName: string): void {
  addLog(
    "session-end",
    "Session Ended",
    `Committee "${committeeName}" session ended`,
    { committeeName }
  )
}
