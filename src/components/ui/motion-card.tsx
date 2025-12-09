"use client"

import { useState } from "react"
import type { Motion, ExtendedMotion } from "@/types/motion";
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Vote } from "lucide-react"

interface MotionCardProps {
  motion: Motion
  onVote: () => void
  onAdjournMotion?: () => void
  onExtendMotion?: () => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  className?: string
  isDragging?: boolean
  isDragOver?: boolean
  onEdit?: () => void
}

export function MotionCard({
  motion,
  onVote,
  onAdjournMotion,
  onExtendMotion,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  className = "",
  isDragging,
  isDragOver,
  onEdit
}: MotionCardProps) {
  const statusColors: Record<Motion["status"], string> = {
    "Pending": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20 transition-colors",
    "In Progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 transition-colors",
    "Passed": "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-colors",
    "Failed": "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 transition-colors",
  }

  return (
    <Card 
      className={`p-5 hover:shadow-md transition-all ${className} ${
        isDragging ? "opacity-50" : ""
      } ${
        isDragOver ? "border-primary border-2" : ""
      }`}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-lg">{motion.name}</h4>
            <Badge className={`${statusColors[motion.status]} font-medium shadow-sm px-3`}>
              {motion.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Type:</span> {motion.type}
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
            {motion.status !== "Pending" && (
              <p className="pt-1">
                <span className="font-medium">Votes:</span> For: {motion.votesFor || 0}, Against: {motion.votesAgainst || 0}, Abstain: {motion.abstentions || 0}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {motion.status === "Pending" && (
            <Button
              size="sm"
              onClick={onVote}
              className="formal-btn"
            >
              <Vote className="h-4 w-4 mr-2" />
              Vote
            </Button>
          )}
          {motion.status === "In Progress" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onAdjournMotion}
              >
                Adjourn
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onExtendMotion}
              >
                Extend
              </Button>
            </div>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}