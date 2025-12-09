"use client";

import { useState } from "react";
import type { Motion, MotionStatus, ExtendedMotion } from "@/types/motion";
import type { Speaker } from "@/types/shared/speaker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vote } from "lucide-react";
import { MotionDialog } from "@/app/voting/MotionDialog";

interface MotionListProps {
  motions: Motion[];
  onVote: (motionId: string, votesFor: number, votesAgainst: number, abstentions: number) => void;
  onAdjournMotion: (motionId: string) => void;
  onExtendMotion: (motion: Motion) => void;
  onEditMotion: (motion: Motion) => void;
  onReorderMotions: (newOrder: Motion[]) => void;
  onStatusChange: (motionId: string, newStatus: "Pending" | "In Progress" | "Completed") => void;
  allMembers: Speaker[];
  currentSpeaker?: Speaker | null;
  showMotionStatus?: boolean;
  enableVoting?: boolean;
}

const statusColors: Record<MotionStatus, string> = {
  "Pending": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20 transition-colors",
  "In Progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 transition-colors",
  "Passed": "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-colors",
  "Failed": "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 transition-colors",
};

export const MotionList = ({ 
  motions, 
  onVote, 
  onAdjournMotion, 
  onExtendMotion, 
  onEditMotion,
  onReorderMotions,
  onStatusChange,
  allMembers,
  showMotionStatus = true,
  enableVoting = true
}: MotionListProps) => {

  console.log("=== MotionList Props ===");
  console.log("showMotionStatus:", showMotionStatus);
  console.log("enableVoting:", enableVoting);
  console.log("Number of motions:", motions.length);

  const [filter, setFilter] = useState<MotionStatus | "All">("All");
  const [draggedMotion, setDraggedMotion] = useState<Motion | null>(null);
  const [dragOverMotionId, setDragOverMotionId] = useState<string | null>(null);
  const [selectedMotion, setSelectedMotion] = useState<Motion | null>(null);
  const [votingDialogOpen, setVotingDialogOpen] = useState(false);
  
  // Sort motions: Passed -> In Progress -> Pending -> Failed
  const statusPriority: Record<MotionStatus, number> = {
    "Passed": 0,
    "In Progress": 1,
    "Pending": 2,
    "Failed": 3
  };

  const sortedMotions = [...motions].sort((a, b) => {
    return statusPriority[a.status] - statusPriority[b.status];
  });

  const filteredMotions =
    filter === "All" ? sortedMotions : sortedMotions.filter((m) => m.status === filter);

  const handleVoteComplete = (voteData: { yes: number; no: number; abstain: number; passed: boolean }) => {
    console.log("=== Vote Complete ===");
    console.log("Vote data:", voteData);
    console.log("Selected motion:", selectedMotion);
    
    if (!selectedMotion) return;
    
    // Call the onVote handler
    onVote(selectedMotion.id, voteData.yes, voteData.no, voteData.abstain);
    
    setSelectedMotion(null);
    setVotingDialogOpen(false);
  };

  const handleDragStart = (motion: Motion) => {
    setDraggedMotion(motion);
  };

  const handleDragEnd = () => {
    setDraggedMotion(null);
    setDragOverMotionId(null);
  };

  const handleDragOver = (e: React.DragEvent, motionId: string) => {
    e.preventDefault();
    if (draggedMotion?.id !== motionId) {
      setDragOverMotionId(motionId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetMotionId: string) => {
    e.preventDefault();
    if (!draggedMotion || draggedMotion.id === targetMotionId) return;

    // Only allow reordering within the same status group
    const targetMotion = motions.find(m => m.id === targetMotionId);
    if (!targetMotion || draggedMotion.status !== targetMotion.status) return;

    const draggedIdx = motions.findIndex(m => m.id === draggedMotion.id);
    const targetIdx = motions.findIndex(m => m.id === targetMotionId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    // Create new array with reordered motions
    const updatedMotions = [...motions];
    const [draggedItem] = updatedMotions.splice(draggedIdx, 1);
    updatedMotions.splice(targetIdx, 0, draggedItem);

    // Update parent component with new order
    onReorderMotions(updatedMotions);
    setDraggedMotion(null);
    setDragOverMotionId(null);
  };

  
const handleMotionSubmit = (
  motionId: string,
  additionalDuration: number,
  newSpeakingTime: number,
  proposingCountry: string,
  passed: boolean
) => {
  console.log("Motion Submit Handler Called:", {
    motionId,
    additionalDuration,
    newSpeakingTime,
    proposingCountry,
    passed,
  });

  if (!selectedMotion) return;

  // Update motion status based on vote result
  // If passed, move to "In Progress", if failed move to "Failed"
  const newStatus: MotionStatus = passed ? "In Progress" : "Failed";
  onStatusChange(motionId, newStatus);

  // Clear selected motion and close dialog
  setSelectedMotion(null);
  setVotingDialogOpen(false);
};

const handleVote = (votes: {
  yes: number;
  no: number;
  abstain: number;
  passed: boolean;
}) => {
  console.log("Vote recorded:", votes);
  // Additional vote handling if needed
};

const handleAdjournMotion = (motionId: string) => {
  console.log("=== Adjourn Motion ===");
  console.log("Motion ID:", motionId);
  
  // Change motion status from "In Progress" to "Passed"
  onStatusChange(motionId, "Passed");
  
  // Call the original adjourn handler if needed
  onAdjournMotion(motionId);
};


  return (
    <div className="space-y-4">
      <Tabs defaultValue="All" className="w-full space-y-4 pb-4" onValueChange={(value) => setFilter(value as MotionStatus | "All")}>
        <TabsList className="w-full">
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="In Progress">In Progress</TabsTrigger>
          <TabsTrigger value="Passed">Passed</TabsTrigger>
          <TabsTrigger value="Failed">Failed</TabsTrigger>
        </TabsList>
        <div className="space-y-3">
          {filteredMotions.length === 0 ? (
            <p className="text-muted-foreground text-center p-8">No motions found</p>
          ) : (
            filteredMotions.map((motion) => (
              <Card 
                key={motion.id} 
                className={`p-5 mx-4 hover:shadow-md transition-shadow cursor-move max-w-[95%]
                  ${dragOverMotionId === motion.id ? 'border-t-2 border-primary' : ''}
                  ${motion.type === "Extension" ? 'ml-8 border-l-4 border-l-primary' : ''}`}
                draggable
                onDragStart={() => handleDragStart(motion)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, motion.id)}
                onDrop={(e) => handleDrop(e, motion.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{motion.name}</h4>
                      {showMotionStatus && (
                        <Badge className={`${statusColors[motion.status]} font-medium shadow-sm px-3`}>
                          {motion.status}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Type:</span> {motion.type}
                        {motion.type === "Extension" && motion.parentMotionId && (
                          <span className="ml-2 text-muted-foreground">
                            (Extends Motion #{motion.parentMotionId.slice(0, 4)})
                          </span>
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Proposed by:</span> {motion.proposingCountry}
                      </p>
                      {motion.duration !== undefined && (
                        <p>
                          <span className="font-medium">Duration:</span> {motion.duration} minutes
                          {motion.speakingTime !== undefined && (
                            <span className="ml-2">
                              ({Math.floor(motion.speakingTime / 60)}:{(motion.speakingTime % 60).toString().padStart(2, '0')} per speaker)
                            </span>
                          )}
                        </p>
                      )}
                      {motion.totalSpeakers !== undefined && (
                        <p>
                          <span className="font-medium">Speakers:</span> {motion.totalSpeakers}
                          {motion.status === "In Progress" && "speakers" in motion && (
                            <span className="ml-2">
                              ({(motion as ExtendedMotion).speakers.length} registered)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {motion.status === "In Progress" && (
  <>
    {motion.type !== "Adjournment" && motion.type !== "Extension" && (
      <Button
        size="sm"
        onClick={() => onExtendMotion(motion)}
        className="formal-btn"
      >
        Extend
      </Button>
    )}
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleAdjournMotion(motion.id)}
    >
      Adjourn
    </Button>
  </>
)}
                    {motion.status === "Pending" && (
                      <>
                        {enableVoting && (
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log("=== Vote button clicked ===");
                              console.log("Motion:", motion);
                              console.log("enableVoting:", enableVoting);
                              setSelectedMotion(motion);
                              setVotingDialogOpen(true);
                            }}
                            className="bg-white hover:bg-white-700 text-black"
                          >
                            <Vote className="h-4 w-4 mr-1" />
                            Vote
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditMotion(motion)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Tabs>
      
      {/* Voting Dialog */}
{selectedMotion && (
  <MotionDialog
    motion={selectedMotion}
    isOpen={votingDialogOpen}
    onClose={() => {
      setVotingDialogOpen(false);
      setSelectedMotion(null);
    }}
    onOpenChange={setVotingDialogOpen}
    onVote={handleVote}
    onSubmit={handleMotionSubmit}
    allMembers={allMembers}
    enableVoting={enableVoting}
  />
)}
    </div>
  );
};