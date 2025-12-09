"use client";

import { useSidePaneStore } from "@/lib/store/side-pane-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SidePaneProps {
  title?: string;
  children?: React.ReactNode;
}

export function SidePane({ title, children }: SidePaneProps) {
  const { isOpen, close } = useSidePaneStore();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-1/2 sm:w-1/2 sm:max-w-none flex flex-col">
        {title && (
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        )}
        <div className="flex-1 overflow-auto px-4 pb-4 pt-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
