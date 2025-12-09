"use client";

import { useState, useEffect } from "react";
import { Motion, MotionType } from "@/types/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { FlagAvatar } from "@/components/ui/flag-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCommittee } from "@/lib/committee-context";

interface MotionFormProps {
  committeeId: string;
  onSubmit: (motion: Omit<Motion, "id" | "createdAt">) => void;
  onCancel: () => void;
}

const motionTypes: MotionType[] = [
  "Moderated Caucus",
  "Unmoderated Caucus",
  "GSL",
  "Close Debate",
  "Table Debate",
  "Introduce Draft Resolution",
  "Custom",
];

export const MotionForm = ({ committeeId, onSubmit, onCancel }: MotionFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "Moderated Caucus" as MotionType,
    proposingCountry: "",
    duration: {
      minutes: 15,
      seconds: 0
    },
    speakingTime: {
      minutes: 1,
      seconds: 0
    }
  });

  const [presentCountries, setPresentCountries] = useState<Array<{ id: string; name: string; flagQuery: string }>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load non-absent countries from session
  // Use committee context to get country list
  const { committee } = useCommittee();

  useEffect(() => {
    if (!committee?.countryList) {
      console.warn('No committee or country list available');
      return;
    }

    // Check if motions are enabled
if (committee.settings && committee.settings.enableMotions === false) {
  toast.error("Motions are disabled in committee settings");
  onCancel();
  return;
}

    // Get only present and present-voting countries
    const activeCountries = committee.countryList
      .filter(c => c.attendance === 'present' || c.attendance === 'present-voting')
      .map(c => ({
        id: c.id || `${c.name}-${c.flagQuery}`,
        name: c.name,
        flagQuery: c.flagQuery
      }));

    console.log('Active countries loaded:', {
      total: activeCountries.length,
      countries: activeCountries.map(c => c.name)
    });

    setPresentCountries(activeCountries);
  }, [committee, onCancel]); // Include onCancel in dependencies

  // Calculate division of time for moderated caucus
  const calculateTimeDivision = () => {
    const totalTimeInSeconds = (formData.duration.minutes * 60) + formData.duration.seconds;
    const speakingTimeInSeconds = (formData.speakingTime.minutes * 60) + formData.speakingTime.seconds;
    
    if (speakingTimeInSeconds <= 0) return { canDivide: false, totalSpeakers: 0 };
    
    const possibleSpeakers = Math.floor(totalTimeInSeconds / speakingTimeInSeconds);
    return {
      canDivide: totalTimeInSeconds % speakingTimeInSeconds === 0,
      totalSpeakers: possibleSpeakers
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.proposingCountry.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    let motionName = formData.type;
    if (formData.type === "Unmoderated Caucus") {
      motionName = "Unmoderated Caucus";
    } else if (formData.type === "GSL") {
      motionName = "GSL";
    } else {
      motionName = formData.name.trim() || formData.type;
    }

    const totalDurationInMinutes = formData.duration.minutes + (formData.duration.seconds / 60);
    const speakingTimeInSeconds = (formData.speakingTime.minutes * 60) + formData.speakingTime.seconds;

    const { totalSpeakers } = calculateTimeDivision();

    const motion: Omit<Motion, "id" | "createdAt"> = {
      committeeId,
      name: motionName,
      type: formData.type,
      proposingCountry: formData.proposingCountry.trim(),
      status: "Pending",
      ...(formData.type === "Moderated Caucus" 
        ? { 
            duration: totalDurationInMinutes,
            totalSpeakers,
            speakingTime: speakingTimeInSeconds,
          }
        : formData.type === "Unmoderated Caucus"
        ? { duration: totalDurationInMinutes }
        : formData.type === "GSL"
        ? { 
            totalSpeakers,
            speakingTime: speakingTimeInSeconds 
          }
        : {}),
    };

    onSubmit(motion);
    toast.success("Motion created successfully");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-start">
        {(formData.type === "Moderated Caucus" || formData.type === "GSL") && (
          <span className={`px-2 py-1 rounded text-sm ${calculateTimeDivision().canDivide ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
            {calculateTimeDivision().canDivide ? '✓ Evenly divisible' : '⚠️ Not divisible'}
          </span>
        )}
      </div>

      {formData.type !== "Unmoderated Caucus" && formData.type !== "GSL" && (
        <div className="space-y-2">
          <Label htmlFor="motion-name">Motion Name</Label>
          <Input
            id="motion-name"
            placeholder="Enter custom motion name (optional)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="motion-type">Motion Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as MotionType })}
          name="motion-type"
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a motion type" />
          </SelectTrigger>
          <SelectContent>
            {motionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                ? presentCountries.find(c => c.name === formData.proposingCountry)?.name
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
                    .filter(country => 
                      country.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(country => (
                      <CommandItem
                        key={country.id}
                        value={country.name}
                        onSelect={(currentValue) => {
                          setFormData({ ...formData, proposingCountry: currentValue });
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FlagAvatar query={country.flagQuery} alt={country.name} className="h-6 w-6" />
                          <span>{country.name}</span>
                        </div>
                        {formData.proposingCountry === country.name && (
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

      {(formData.type === "Moderated Caucus" || formData.type === "Unmoderated Caucus") && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration-min">Duration (minutes)</Label>
              <Input
                id="duration-min"
                type="number"
                min="0"
                value={formData.duration.minutes}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  duration: {
                    ...formData.duration,
                    minutes: parseInt(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration-sec">Seconds</Label>
              <Input
                id="duration-sec"
                type="number"
                min="0"
                max="59"
                value={formData.duration.seconds}
                onChange={(e) => setFormData({
                  ...formData,
                  duration: {
                    ...formData.duration,
                    seconds: parseInt(e.target.value) || 0
                  }
                })}
              />
            </div>
          </div>

          {formData.type === "Moderated Caucus" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="speaking-time-min">Speaking Time (minutes)</Label>
                  <Input
                    id="speaking-time-min"
                    type="number"
                    min="0"
                    value={formData.speakingTime.minutes}
                    onChange={(e) => setFormData({
                      ...formData,
                      speakingTime: {
                        ...formData.speakingTime,
                        minutes: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speaking-time-sec">Seconds</Label>
                  <Input
                    id="speaking-time-sec"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.speakingTime.seconds}
                    onChange={(e) => setFormData({
                      ...formData,
                      speakingTime: {
                        ...formData.speakingTime,
                        seconds: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Number of speakers: {calculateTimeDivision().totalSpeakers}
              </div>
            </div>
          )}
        </div>
      )}

      {formData.type === "GSL" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="speaking-time">Speaking Time (sec)</Label>
            <Input
              id="speaking-time"
              type="number"
              min="10"
              value={formData.speakingTime.minutes * 60 + formData.speakingTime.seconds}
              onChange={(e) => {
                const totalSeconds = parseInt(e.target.value) || 60;
                setFormData({
                  ...formData,
                  speakingTime: {
                    minutes: Math.floor(totalSeconds / 60),
                    seconds: totalSeconds % 60
                  }
                });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gsl-duration-min">Total Time (minutes)</Label>
              <Input
                id="gsl-duration-min"
                type="number"
                min="0"
                value={formData.duration.minutes}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  duration: {
                    ...formData.duration,
                    minutes: parseInt(e.target.value) || 0
                  }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gsl-duration-sec">Seconds</Label>
              <Input
                id="gsl-duration-sec"
                type="number"
                min="0"
                max="59"
                value={formData.duration.seconds}
                onChange={(e) => setFormData({
                  ...formData,
                  duration: {
                    ...formData.duration,
                    seconds: parseInt(e.target.value) || 0
                  }
                })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2">
        <Button type="submit">
          Create Motion
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};