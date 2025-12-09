"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { FlagAvatar } from "@/components/ui/flag-avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Speaker } from "@/types/shared/speaker";
import { Check, ChevronsUpDown } from "lucide-react";

interface AddSpeakerProps {
  availableSpeakers: Speaker[];
  onAdd: (speaker: Speaker) => void;
}

export function AddSpeaker({ availableSpeakers, onAdd }: AddSpeakerProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredSpeakers = availableSpeakers.filter(
    (speaker) =>
      speaker.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span>Add Speaker</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Input
              placeholder="Search speakers..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9 border-0 focus-visible:ring-0"
            />
          </div>
          <CommandEmpty>No speakers found.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-auto">
            {filteredSpeakers.map((speaker) => (
              <CommandItem
                key={speaker.id}
                onSelect={() => {
                  onAdd(speaker);
                  setOpen(false);
                  setSearchValue("");
                }}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-accent"
              >
                <FlagAvatar country={speaker} size={24} />
                <span>{speaker.name}</span>
                <Check className="ml-auto h-4 w-4 opacity-0 group-data-[selected]:opacity-100" />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}