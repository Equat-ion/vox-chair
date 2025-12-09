"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommitteeManager } from "@/components/committee-manager";

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDialog({ open, onOpenChange }: AttendanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Committee Attendance</DialogTitle>
        </DialogHeader>
        <CommitteeManager />
      </DialogContent>
    </Dialog>
  );
}