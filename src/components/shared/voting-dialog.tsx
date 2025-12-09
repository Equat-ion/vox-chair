"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface VotingDialogProps {
  motion: {
    id: string;
    name?: string;
    type?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onVote: (data: { 
    yes: number;
    no: number;
    abstain: number;
    passed: boolean;
  }) => void;
}

export function VotingDialog({ motion, isOpen, onClose, onVote }: VotingDialogProps) {
  const handleVoteComplete = (passed: boolean) => {
    if (motion.status === "Passed" || motion.status === "In Progress") {
      onVote({
        yes: 1,
        no: 0,
        abstain: 0,
        passed: true,
        adjourned: true
      });
    } else {
      onVote({
        yes: passed ? 1 : 0,
        no: passed ? 0 : 1,
        abstain: 0,
        passed
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">Vote on {motion.name || motion.type}</h2>
          {motion.status !== "Passed" && motion.status !== "Failed" && (
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => handleVoteComplete(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Check className="mr-2 h-4 w-4" />
                Yes
              </Button>
              <Button
                onClick={() => handleVoteComplete(false)}
                className="bg-red-500 hover:bg-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                No
              </Button>
            </div>
          )}
          {(motion.status === "Passed" || motion.status === "Failed") && (
            <div className="text-center text-muted-foreground">
              This motion has already been {motion.status.toLowerCase()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}