"use client";

import { useState, useEffect } from "react";
import type { Motion } from "@/types/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronsUpDown, Check, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { FlagAvatar } from "@/components/ui/flag-avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExtendMotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalMotion: Motion;
  onSubmit: (
    motionId: string,
    additionalDuration: number,
    newSpeakingTime: number,
    proposingCountry: string,
    passed: boolean
  ) => void;
  countries: Array<{ name: string; code: string }>;
  enableVoting?: boolean;  // ADD THIS
}

export const ExtendMotionDialog = ({
  open,
  onOpenChange,
  originalMotion,
  onSubmit,
  countries,
  enableVoting = true,  // ADD THIS
}: ExtendMotionDialogProps) => {
  const [step, setStep] = useState<"config" | "vote">("config");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    duration: { minutes: 15, seconds: 0 },
    speakingTime: { minutes: 1, seconds: 0 },
    useSameTimings: !!originalMotion?.speakingTime,
    proposingCountry: countries[0]?.name || "",
  });

  const presentCountries = countries.map((c) => ({
    id: c.code,
    name: c.name,
    flagQuery: c.code.toLowerCase(),
  }));

  // ADD CONSOLE LOGS HERE
  useEffect(() => {
    console.log("=== ExtendMotionDialog Props ===");
    console.log("enableVoting:", enableVoting);
    console.log("open:", open);
    console.log("step:", step);
    console.log("originalMotion:", originalMotion);
  }, [enableVoting, open, step, originalMotion]);

  useEffect(() => {
    if (open) {
      const origSpeakingTime = originalMotion?.speakingTime
        ? {
            minutes: Math.floor(originalMotion.speakingTime / 60),
            seconds: originalMotion.speakingTime % 60,
          }
        : { minutes: 1, seconds: 0 };

      setFormData({
        duration: { minutes: 15, seconds: 0 },
        speakingTime: origSpeakingTime,
        useSameTimings: originalMotion?.speakingTime ? true : false,
        proposingCountry: countries[0]?.name || "",
      });
      setStep("config");
      
      console.log("=== ExtendMotionDialog Opened ===");
      console.log("Reset to config step");
    }
  }, [open, originalMotion?.speakingTime, countries]);

  const calculateTimeDivision = () => {
    const totalTimeInSeconds = formData.duration.minutes * 60 + formData.duration.seconds;
    const speakingTimeInSeconds = formData.useSameTimings
      ? originalMotion?.speakingTime || 0
      : formData.speakingTime.minutes * 60 + formData.speakingTime.seconds;

    if (speakingTimeInSeconds <= 0) return { canDivide: false, totalSpeakers: 0 };

    const possibleSpeakers = Math.floor(totalTimeInSeconds / speakingTimeInSeconds);
    return {
      canDivide: totalTimeInSeconds % speakingTimeInSeconds === 0,
      totalSpeakers: possibleSpeakers,
    };
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.proposingCountry.trim()) {
      toast.error("Please select a proposing country");
      return;
    }

    console.log("=== Config Submit ===");
    console.log("enableVoting:", enableVoting);

    if (enableVoting) {
      console.log("Moving to vote step");
      setStep("vote");
    } else {
      console.log("Voting disabled, auto-passing motion");
      const additionalDurationInMinutes =
        formData.duration.minutes + formData.duration.seconds / 60;
      const newSpeakingTimeInSeconds = formData.useSameTimings
        ? originalMotion?.speakingTime || 0
        : formData.speakingTime.minutes * 60 + formData.speakingTime.seconds;

      onSubmit(
        originalMotion.id,
        additionalDurationInMinutes,
        newSpeakingTimeInSeconds,
        formData.proposingCountry,
        true  // Auto-pass when voting is disabled
      );
      onOpenChange(false);
      toast.success("Motion extension applied");
    }
  };

  const handleVoteComplete = (passed: boolean) => {
    console.log("=== Vote Complete ===");
    console.log("Passed:", passed);
    
    const additionalDurationInMinutes =
      formData.duration.minutes + formData.duration.seconds / 60;
    const newSpeakingTimeInSeconds = formData.useSameTimings
      ? originalMotion?.speakingTime || 0
      : formData.speakingTime.minutes * 60 + formData.speakingTime.seconds;

    onSubmit(
      originalMotion.id,
      additionalDurationInMinutes,
      newSpeakingTimeInSeconds,
      formData.proposingCountry,
      passed
    );

    onOpenChange(false);
    toast.success(passed ? "Motion extension passed" : "Motion extension failed");
  };

  const formatDuration = () => {
    const { minutes, seconds } = formData.duration;
    if (minutes > 0 && seconds > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  };

  const formatSpeakingTime = () => {
    const { minutes, seconds } = formData.speakingTime;
    if (minutes > 0 && seconds > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  };

  console.log("=== Render ExtendMotionDialog ===");
  console.log("Current step:", step);
  console.log("enableVoting:", enableVoting);
  console.log("Should show voting buttons:", step === "vote" && enableVoting);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Extend {originalMotion?.name}</DialogTitle>
        </DialogHeader>

        {step === "config" ? (
          <form onSubmit={handleConfigSubmit} className="space-y-6">
            {/* Total Time & Even Divisible */}
            {(originalMotion?.type === "Moderated Caucus" ||
              originalMotion?.type === "GSL") && (
              <span
                className={`px-2 py-1 rounded text-sm ${
                  calculateTimeDivision().canDivide
                    ? "bg-green-600/20 text-green-400"
                    : "bg-yellow-600/20 text-yellow-400"
                }`}
              >
                {calculateTimeDivision().canDivide
                  ? "✓ Evenly divisible"
                  : "⚠️ Not divisible"}
                <div className="mt-1">
                  Total Speakers: {calculateTimeDivision().totalSpeakers}
                </div>
              </span>
            )}

            {/* Use same timings */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="same-timings"
                checked={formData.useSameTimings}
                onCheckedChange={(checked) => {
                  setFormData((prev) => ({
                    ...prev,
                    useSameTimings: checked,
                    speakingTime: checked
                      ? originalMotion?.speakingTime
                        ? {
                            minutes: Math.floor(originalMotion.speakingTime / 60),
                            seconds: originalMotion.speakingTime % 60,
                          }
                        : prev.speakingTime
                      : prev.speakingTime,
                  }));
                }}
              />
              <Label htmlFor="same-timings" className="text-sm font-medium leading-none">
                Use same speaking time as original motion
              </Label>
            </div>

            {/* Duration Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration-min">Additional Duration (minutes)</Label>
                <Input
                  id="duration-min"
                  type="number"
                  min={0}
                  value={formData.duration.minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: { ...formData.duration, minutes: parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration-sec">Seconds</Label>
                <Input
                  id="duration-sec"
                  type="number"
                  min={0}
                  max={59}
                  value={formData.duration.seconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: { ...formData.duration, seconds: parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
            </div>

            {/* Speaking Time Inputs */}
            {(!formData.useSameTimings ||
              originalMotion?.type === "Moderated Caucus" ||
              originalMotion?.type === "GSL") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="speaking-time-min">Speaking Time (minutes)</Label>
                  <Input
                    id="speaking-time-min"
                    type="number"
                    min={0}
                    disabled={formData.useSameTimings}
                    value={formData.speakingTime.minutes}
                    onChange={(e) =>
                      !formData.useSameTimings &&
                      setFormData((prev) => ({
                        ...prev,
                        speakingTime: {
                          ...prev.speakingTime,
                          minutes: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speaking-time-sec">Seconds</Label>
                  <Input
                    id="speaking-time-sec"
                    type="number"
                    min={0}
                    max={59}
                    disabled={formData.useSameTimings}
                    value={formData.speakingTime.seconds}
                    onChange={(e) =>
                      !formData.useSameTimings &&
                      setFormData((prev) => ({
                        ...prev,
                        speakingTime: {
                          ...prev.speakingTime,
                          seconds: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Proposing Country */}
            <div className="space-y-2">
              <Label htmlFor="proposing-country">Proposing Country *</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-between"
                  >
                    {formData.proposingCountry
                      ? presentCountries.find((c) => c.name === formData.proposingCountry)?.name
                      : "Select a country..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search for a country..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-[200px]">
                        {presentCountries
                          .filter((c) =>
                            c.name.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={(value) => {
                                setFormData({ ...formData, proposingCountry: value });
                                setSearchOpen(false);
                                setSearchQuery("");
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <FlagAvatar query={c.flagQuery} alt={c.name} className="h-6 w-6" />
                                <span>{c.name}</span>
                              </div>
                              {formData.proposingCountry === c.name && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                {enableVoting ? "Continue to Vote" : "Extend Motion"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          // Voting View - Only show if enableVoting is true
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
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
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Cancel Vote
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};