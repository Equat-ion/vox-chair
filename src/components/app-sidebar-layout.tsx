"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Home, Users, Settings, FileText, Maximize, FilePenLine, ScrollText } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SidebarAuth } from "@/components/sidebar-auth"
import { createContext, useContext, useState } from "react"
import { useSidePaneStore } from "@/lib/store/side-pane-store"
import { SidePane } from "@/components/side-pane"
import { MilkdownEditor } from "@/components/milkdown-editor"

type HeaderContextType = {
  title: string
  setTitle: (title: string) => void
}

const HeaderContext = createContext<HeaderContextType | null>(null)

export function useHeader() {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error("useHeader must be used within AppSidebarLayout")
  }
  return context
}

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/" className="flex items-center">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/speaker-list" className="flex items-center">
                    <Users className="h-4 w-4" />
                    <span>Speaker&apos;s List</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/drafts" className="flex items-center">
                    <FilePenLine className="h-4 w-4" />
                    <span>Drafts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/logs" className="flex items-center">
                    <ScrollText className="h-4 w-4" />
                    <span>Logs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Committee</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarAuth />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppSidebarLayout({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState("")
  const { 
    lastEditedDraftTitle, 
    lastEditedDraftId, 
    open, 
    editorContent, 
    setEditorContent, 
    isSaved, 
    setIsSaved 
  } = useSidePaneStore()

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const truncateDraftName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name
    return name.slice(0, maxLength) + "..."
  }

  return (
    <HeaderContext.Provider value={{ title, setTitle }}>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full min-w-0">
          <header className="flex items-center justify-between gap-2 border-b px-4 py-2 sticky top-0 bg-background z-10">
            <div className="flex items-center gap-2 shrink-0">
              <SidebarTrigger />
            </div>
            {title && (
              <div className="flex-1 min-w-0 px-4">
                <h1 className="text-sm font-medium text-muted-foreground truncate text-center">{title}</h1>
              </div>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={open}
                disabled={!lastEditedDraftTitle}
                className="flex items-center gap-2"
              >
                <span className={`inline-block w-2 h-2 rounded-full ${lastEditedDraftTitle ? 'bg-blue-500' : 'bg-gray-400'}`} />
                <span className="text-xs">
                  {lastEditedDraftTitle ? `Continue editing ${truncateDraftName(lastEditedDraftTitle)}` : 'No draft selected'}
                </span>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleFullscreen} aria-label="Fullscreen">
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </header>
          {children}
        </main>
        
        {/* Global SidePane */}
        <SidePane title={lastEditedDraftTitle || "Side Panel"}>
          {lastEditedDraftId && (
            <div className="flex items-center gap-2 mb-2">
              {/* LED Save Status */}
              <span
                className={`inline-block w-3 h-3 rounded-full ${isSaved ? "bg-green-500" : "bg-yellow-400 animate-pulse"}`}
                title={isSaved ? "Saved" : "Unsaved"}
              />
              <span className="text-xs text-muted-foreground">
                {isSaved ? "Saved" : "Unsaved"}
              </span>
            </div>
          )}
          {lastEditedDraftId && (
            <MilkdownEditor
              defaultValue={editorContent}
              onChange={(markdown) => {
                setEditorContent(markdown)
                setIsSaved(false)
              }}
            />
          )}
        </SidePane>
      </SidebarProvider>
    </HeaderContext.Provider>
  )
}
