"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileTextIcon, PlusIcon, ExclamationTriangleIcon, FileIcon, DotsHorizontalIcon, ChevronRightIcon, Share2Icon, ArchiveIcon } from "@radix-ui/react-icons"
import { useState, useEffect } from "react"
import { useSidePaneStore } from "@/lib/store/side-pane-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logDraftCreated, logDraftDeleted } from "@/lib/logging"
import { toast } from "sonner"

type Draft = {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  archived?: boolean
}

type DraftType = {
  name: string
  color: string
  icon: React.ReactNode
}

const DRAFT_TYPES: DraftType[] = [
  { name: "Crisis Note", color: "orange", icon: <ExclamationTriangleIcon className="h-5 w-5" /> },
  { name: "Working Paper", color: "blue", icon: <FileIcon className="h-5 w-5" /> },
  { name: "Custom", color: "gray", icon: <FileTextIcon className="h-5 w-5" /> },
]

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([
    {
      id: crypto.randomUUID(),
      title: "Lorem",
      content: "# Example draft\n\nThis is a sample markdown draft.",
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ["Crisis Note"],
      archived: false,
    }
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewDraftOpen, setIsNewDraftOpen] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const { 
    open, 
    lastEditedDraftId, 
    setLastEditedDraft, 
    editorContent, 
    setEditorContent, 
    isSaved, 
    setIsSaved 
  } = useSidePaneStore()
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null)
  const [hoveredDraft, setHoveredDraft] = useState<string | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [draftToShare, setDraftToShare] = useState<Draft | null>(null)

  // Auto-save effect
  useEffect(() => {
    if (!lastEditedDraftId || isSaved) return;
    
    const timeout = setTimeout(() => {
      setDrafts((prevDrafts) => {
        const existingDraft = prevDrafts.find(d => d.id === lastEditedDraftId);
        // Only update if content actually changed
        if (existingDraft && existingDraft.content !== editorContent) {
          return prevDrafts.map((d) =>
            d.id === lastEditedDraftId 
              ? { ...d, content: editorContent, updatedAt: new Date() } 
              : d
          );
        }
        return prevDrafts;
      });
      setIsSaved(true);
    }, 1000); // 1s debounce
    
    return () => clearTimeout(timeout);
  }, [editorContent, lastEditedDraftId, isSaved, setIsSaved])

  const filteredDrafts = drafts.filter((draft) => {
    const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesArchiveFilter = showArchived ? draft.archived : !draft.archived
    
    return matchesSearch && matchesArchiveFilter
  })

  const handleCreateDraft = () => {
    if (!draftName.trim() || !selectedType) return
    
    const selectedDraftType = DRAFT_TYPES.find(t => t.name === selectedType)
    if (selectedDraftType?.name === "Custom") {
      // Do nothing for Custom for now
      return
    }

    const newDraft: Draft = {
      id: crypto.randomUUID(),
      title: draftName,
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [selectedType],
      archived: false,
    }

    setDrafts([...drafts, newDraft])
    logDraftCreated(draftName, selectedType)
    setIsNewDraftOpen(false)
    setDraftName("")
    setSelectedType(null)
    toast.success(`Draft "${draftName}" created successfully`)
  }

  const getTagColor = (tag: string) => {
    const type = DRAFT_TYPES.find(t => t.name === tag)
    if (type?.color === "orange") return "bg-orange-100 text-orange-800 border-orange-300"
    if (type?.color === "blue") return "bg-blue-100 text-blue-800 border-blue-300"
    return "bg-gray-100 text-gray-800 border-gray-300"
  }

  const handleDeleteConfirm = () => {
    if (draftToDelete) {
      const draftType = draftToDelete.tags[0] || "Draft"
      logDraftDeleted(draftToDelete.title, draftType)
      setDrafts(drafts.filter(d => d.id !== draftToDelete.id))
      toast.success(`Draft "${draftToDelete.title}" deleted`)
      setDraftToDelete(null)
    }
    setIsDeleteAlertOpen(false)
  }

  const handleDownloadPDF = (draft: Draft, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Create a simple HTML document from the markdown content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${draft.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
            }
            h1, h2, h3 { color: #333; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 4px; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 2px; }
          </style>
        </head>
        <body>
          <h1>${draft.title}</h1>
          <p><em>Created: ${draft.createdAt.toLocaleDateString()}</em></p>
          <hr>
          <pre>${draft.content}</pre>
        </body>
      </html>
    `
    
    // Create a blob and download link
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${draft.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`"${draft.title}" downloaded as HTML`)
  }

  const handleArchive = (draft: Draft, e: React.MouseEvent) => {
    e.stopPropagation()
    
    setDrafts(prevDrafts =>
      prevDrafts.map(d =>
        d.id === draft.id ? { ...d, archived: !d.archived } : d
      )
    )
    
    toast.success(draft.archived ? `"${draft.title}" unarchived` : `"${draft.title}" archived`)
  }

  const handleShare = (draft: Draft, e: React.MouseEvent) => {
    e.stopPropagation()
    setDraftToShare(draft)
    setIsShareDialogOpen(true)
  }

  const handleCopyShareLink = () => {
    if (draftToShare) {
      // Create a shareable link (in a real app, this would be a proper URL)
      const shareLink = `${window.location.origin}/drafts/${draftToShare.id}`
      navigator.clipboard.writeText(shareLink)
      toast.success("Link copied to clipboard")
      setIsShareDialogOpen(false)
    }
  }

  const archivedCount = drafts.filter(d => d.archived).length

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Drafts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your working papers, resolutions, and amendments
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowArchived(!showArchived)} variant="outline">
              <ArchiveIcon className="mr-2 h-4 w-4" />
              {showArchived ? "Show Active" : `Archived (${archivedCount})`}
            </Button>
            <Button onClick={() => setIsNewDraftOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Draft
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredDrafts.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileTextIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No drafts found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : showArchived
                  ? "No archived drafts yet"
                  : "Get started by creating your first draft"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDrafts.map((draft) => (
              <Card 
                key={draft.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative group"
                onMouseEnter={() => setHoveredDraft(draft.id)}
                onMouseLeave={() => setHoveredDraft(null)}
                onClick={() => {
                  // Ensure we're setting fresh content to prevent duplicates
                  const draftToOpen = drafts.find(d => d.id === draft.id)
                  if (draftToOpen) {
                    setLastEditedDraft(draftToOpen.id, draftToOpen.title)
                    setEditorContent(draftToOpen.content)
                    setIsSaved(true)
                    open()
                  }
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg truncate flex-1">{draft.title}</h3>
                    {hoveredDraft === draft.id && (
                      <ChevronRightIcon className="h-5 w-5 text-muted-foreground transition-opacity" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className={getTagColor(tag)}>
                        {tag}
                      </Badge>
                    ))}
                    {draft.archived && (
                      <Badge variant="outline" className="bg-gray-200 text-gray-700">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created {draft.createdAt.toLocaleDateString()}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <DotsHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            const draftToEdit = drafts.find(d => d.id === draft.id)
                            if (draftToEdit) {
                              setLastEditedDraft(draftToEdit.id, draftToEdit.title)
                              setEditorContent(draftToEdit.content)
                              setIsSaved(true)
                              open()
                            }
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDownloadPDF(draft, e)}>
                          Download as HTML
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleShare(draft, e)}>
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleArchive(draft, e)}>
                          {draft.archived ? "Unarchive" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDraftToDelete(draft)
                            setIsDeleteAlertOpen(true)
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isNewDraftOpen} onOpenChange={setIsNewDraftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Draft</DialogTitle>
            <DialogDescription>
              Enter a name for your draft and select a type.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="draft-name">Draft Name</Label>
              <Input
                id="draft-name"
                placeholder="Enter draft name..."
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Draft Type</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DRAFT_TYPES.map((type) => (
                  <Button
                    key={type.name}
                    type="button"
                    variant={selectedType === type.name ? "default" : "outline"}
                    className={`flex-1 min-w-0 h-auto py-3 px-4 text-sm ${
                      selectedType === type.name
                        ? type.color === "orange"
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : type.color === "blue"
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : ""
                        : ""
                    }`}
                    onClick={() => setSelectedType(type.name)}
                  >
                    <span className="mr-2">{type.icon}</span>
                    <span className="truncate">{type.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewDraftOpen(false)
                setDraftName("")
                setSelectedType(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDraft}
              disabled={!draftName.trim() || !selectedType}
            >
              Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Draft</DialogTitle>
            <DialogDescription>
              Share &quot;{draftToShare?.title}&quot; with others
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={draftToShare ? `${window.location.origin}/drafts/${draftToShare.id}` : ""}
                  className="flex-1"
                />
                <Button onClick={handleCopyShareLink}>
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can view the draft
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsShareDialogOpen(false)
                setDraftToShare(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{draftToDelete?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}