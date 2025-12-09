"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import {
  getLogs,
  clearLogs,
  type LogEntry,
  type LogCategory,
  getCategoryColor,
} from "@/lib/logging"
import {
  ClockIcon,
  PersonIcon,
  PlusIcon,
  Cross2Icon,
  MixIcon,
  GearIcon,
  FileTextIcon,
  Pencil1Icon,
  PlayIcon,
  StopIcon,
  UpdateIcon,
  ReaderIcon,
  CheckIcon,
} from "@radix-ui/react-icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Icon mapping for different action types
function getActionIcon(actionType: string): React.ReactNode {
  switch (actionType) {
    case "agenda-change":
      return <ReaderIcon className="h-4 w-4" />
    case "rollcall-update":
      return <CheckIcon className="h-4 w-4" />
    case "speaker-added":
      return <PlusIcon className="h-4 w-4" />
    case "speaker-removed":
      return <Cross2Icon className="h-4 w-4" />
    case "speaker-reordered":
      return <MixIcon className="h-4 w-4" />
    case "speaker-yield":
      return <UpdateIcon className="h-4 w-4" />
    case "timing-config":
      return <GearIcon className="h-4 w-4" />
    case "member-added":
      return <PersonIcon className="h-4 w-4" />
    case "member-removed":
      return <Cross2Icon className="h-4 w-4" />
    case "member-renamed":
      return <Pencil1Icon className="h-4 w-4" />
    case "draft-created":
      return <FileTextIcon className="h-4 w-4" />
    case "draft-deleted":
      return <Cross2Icon className="h-4 w-4" />
    case "session-start":
      return <PlayIcon className="h-4 w-4" />
    case "session-end":
      return <StopIcon className="h-4 w-4" />
    default:
      return <ClockIcon className="h-4 w-4" />
  }
}

// Get badge variant based on category
function getCategoryBadgeVariant(category: LogCategory): "default" | "secondary" | "destructive" | "outline" {
  switch (category) {
    case "destructive":
      return "destructive"
    case "addition":
      return "default"
    case "info":
      return "secondary"
    case "standard":
    default:
      return "outline"
  }
}

// Group logs by date
function groupLogsByDate(logs: LogEntry[]): Map<string, LogEntry[]> {
  const grouped = new Map<string, LogEntry[]>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  logs.forEach((log) => {
    const logDate = new Date(log.timestamp)
    logDate.setHours(0, 0, 0, 0)

    let dateLabel: string
    if (logDate.getTime() === today.getTime()) {
      dateLabel = "Today"
    } else {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      if (logDate.getTime() === yesterday.getTime()) {
        dateLabel = "Yesterday"
      } else {
        dateLabel = logDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }
    }

    if (!grouped.has(dateLabel)) {
      grouped.set(dateLabel, [])
    }
    grouped.get(dateLabel)!.push(log)
  })

  return grouped
}

function LogItem({ log }: { log: LogEntry }) {
  const ledColor = getCategoryColor(log.category)
  const timeString = log.timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="group relative">
      <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
        {/* LED Indicator */}
        <div className="pt-1 flex-shrink-0">
          <div
            className={`w-3 h-3 rounded-full ${ledColor}`}
          />
        </div>

        {/* Icon */}
        <div className="pt-0.5 flex-shrink-0 text-muted-foreground">
          {getActionIcon(log.actionType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{log.title}</span>
            <Badge
              variant={getCategoryBadgeVariant(log.category)}
              className="text-xs"
            >
              {log.actionType.replace(/-/g, " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{log.description}</p>
        </div>

        {/* Time */}
        <div className="flex-shrink-0 text-xs text-muted-foreground pt-0.5 flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          {timeString}
        </div>
      </div>
    </div>
  )
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<LogCategory | "all">("all")
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)

  // Load logs on mount
  useEffect(() => {
    setLogs(getLogs())
  }, [])

  // Filter logs based on search and category
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      filterCategory === "all" || log.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const groupedLogs = groupLogsByDate(filteredLogs)

  const handleClearLogs = () => {
    clearLogs()
    setLogs([])
    setIsDeleteAlertOpen(false)
  }

  const categoryStats = {
    total: logs.length,
    destructive: logs.filter((l) => l.category === "destructive").length,
    addition: logs.filter((l) => l.category === "addition").length,
    info: logs.filter((l) => l.category === "info").length,
    standard: logs.filter((l) => l.category === "standard").length,
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Committee Logs</h1>
            <p className="text-muted-foreground mt-1">
              Complete history of all committee actions and events
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteAlertOpen(true)}
            disabled={logs.length === 0}
          >
            Clear All Logs
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card 
            className="p-4 cursor-pointer transition-colors"
            onClick={() => setFilterCategory("all")}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold">{categoryStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Logs</p>
              </div>
            </div>
          </Card>
          <Card
            className={`p-4 cursor-pointer transition-colors ${
              filterCategory === "addition" ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => setFilterCategory(filterCategory === "addition" ? "all" : "addition")}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-2xl font-bold">{categoryStats.addition}</p>
                <p className="text-xs text-muted-foreground">Additions</p>
              </div>
            </div>
          </Card>
          <Card
            className={`p-4 cursor-pointer transition-colors ${
              filterCategory === "destructive" ? "ring-2 ring-red-500" : ""
            }`}
            onClick={() =>
              setFilterCategory(filterCategory === "destructive" ? "all" : "destructive")
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="text-2xl font-bold">{categoryStats.destructive}</p>
                <p className="text-xs text-muted-foreground">Destructive</p>
              </div>
            </div>
          </Card>
          <Card
            className={`p-4 cursor-pointer transition-colors ${
              filterCategory === "info" ? "ring-2 ring-yellow-500" : ""
            }`}
            onClick={() => setFilterCategory(filterCategory === "info" ? "all" : "info")}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{categoryStats.info}</p>
                <p className="text-xs text-muted-foreground">Info</p>
              </div>
            </div>
          </Card>
          <Card
            className={`p-4 cursor-pointer transition-colors ${
              filterCategory === "standard" ? "ring-2 ring-gray-500" : ""
            }`}
            onClick={() =>
              setFilterCategory(filterCategory === "standard" ? "all" : "standard")
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <div>
                <p className="text-2xl font-bold">{categoryStats.standard}</p>
                <p className="text-xs text-muted-foreground">Standard</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search logs by action, title, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          {filterCategory !== "all" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtering by:</span>
              <Badge
                variant={getCategoryBadgeVariant(filterCategory)}
                className="cursor-pointer"
                onClick={() => setFilterCategory("all")}
              >
                {filterCategory} <Cross2Icon className="ml-1 h-3 w-3" />
              </Badge>
            </div>
          )}
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <ClockIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterCategory !== "all"
                  ? "Try adjusting your search or filter"
                  : "Committee actions will appear here"}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              {Array.from(groupedLogs.entries()).map(([date, dateLogs], index) => (
                <div key={date}>
                  {index > 0 && <Separator className="my-6" />}
                  <div className="mb-4 pb-2 border-b">
                    <h2 className="text-lg font-semibold sticky top-0 bg-card py-2 z-10">
                      {date}
                    </h2>
                  </div>
                  <div className="space-y-1">
                    {dateLogs.map((log) => (
                      <LogItem key={log.id} log={log} />
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {logs.length} log entries. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearLogs}
              className="bg-red-500 hover:bg-red-600"
            >
              Clear All Logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
