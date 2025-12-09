"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogProps } from "@/types/shared/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Speaker } from "@/types/shared/speaker";
import { FlagAvatar } from "@/components/ui/flag-avatar";

export interface YieldDialogProps extends DialogProps {
  availableSpeakers: Speaker[]
  onYield: (speaker: Speaker) => void
}

export function YieldDialog({
  open,
  onOpenChange,
  availableSpeakers,
  onYield,
}: YieldDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const filtered = availableSpeakers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose a speaker to yield to</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2"
        />
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filtered.map((speaker) => (
              <button
                key={speaker.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                onClick={() => {
                  onYield(speaker)
                  onOpenChange(false)
                }}
              >
                <FlagAvatar query={speaker.flagQuery} alt={`${speaker.name} flag`} className="h-8 w-12" />
                <span>{speaker.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}