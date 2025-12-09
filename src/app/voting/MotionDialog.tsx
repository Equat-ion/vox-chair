"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Motion } from "@/types/motion";
import type { Speaker } from "@/types/shared/speaker";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface MotionDialogProps {
  motion: Motion;
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  onVote?: (votes: { yes: number; no: number; abstain: number; passed: boolean }) => void;
  onSubmit?: (
    motionId: string,
    additionalDuration: number,
    newSpeakingTime: number,
    proposingCountry: string,
    passed: boolean
  ) => void;
  allMembers: Speaker[];
  enableVoting?: boolean;
}

export function MotionDialog({
  motion,
  isOpen,
  onClose,
  onOpenChange,
  onVote,
  onSubmit,
  allMembers,
  enableVoting = true,
}: MotionDialogProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const presentMembers = allMembers.filter(member => 
    member.attendance === 'present' || member.attendance === 'present-voting'
  );

  const handleVoteComplete = (passed: boolean) => {
    console.log("=== Vote Complete ===");
    console.log("Passed:", passed);
    
    // Call the vote callback if provided
    if (typeof onVote === 'function') {
      onVote({ yes: 0, no: 0, abstain: 0, passed });
    }

    // Call submit with motion data if provided
    if (typeof onSubmit === 'function') {
      onSubmit(
        motion.id,
        0, // additionalDuration
        motion.speakingTime || 0,
        motion.proposingCountry || "", // Use motion's proposing country
        passed
      );
    }

    toast.success(passed ? "Motion passed" : "Motion failed");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{motion.type}</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <h3 className="font-medium">{motion.name || "Untitled Motion"}</h3>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="lg"
              className="h-20 text-base bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleVoteComplete(true)}
            >
              <Check className="h-5 w-5 mr-2" />
              Pass
            </Button>
            <Button
              size="lg"
              className="h-20 text-base bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleVoteComplete(false)}
            >
              <X className="h-5 w-5 mr-2" />
              Fail
            </Button>
          </div>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}