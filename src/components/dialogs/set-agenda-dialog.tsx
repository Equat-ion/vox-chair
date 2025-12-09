"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DialogProps } from "@/types/shared/dialog";

export interface SetAgendaDialogProps extends DialogProps {
  currentAgenda: string;
  onSave: (agenda: string) => void;
}

export function SetAgendaDialog({
  open,
  onOpenChange,
  currentAgenda,
  onSave,
}: SetAgendaDialogProps) {
  const [agenda, setAgenda] = useState(currentAgenda);

  useEffect(() => {
    setAgenda(currentAgenda);
  }, [currentAgenda]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" title="Set Agenda">
        <DialogHeader>
          <DialogTitle>Set Agenda</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Enter agenda description"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(agenda)
              onOpenChange(false)
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}