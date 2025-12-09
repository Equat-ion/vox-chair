import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VotingData } from "@/types/templates";
import { Check, X } from "lucide-react";

interface VotingSystemProps {
  onVotingComplete: (data: VotingData) => void;
  onCancel: () => void;
  topic: string;
  motionName: string;
  countries: Array<{ name: string; present: boolean }>;
  motion: {
    type: string;
    proposingCountry: string;
    duration?: number;
    speakersCount?: number;
    speakingTime?: number;
  };
}

export function VotingSystem({ onVotingComplete, onCancel, topic, motionName, countries, motion }: VotingSystemProps) {
  const handleVoteComplete = (passed: boolean) => {
    onVotingComplete({
      yes: passed ? 1 : 0,
      no: passed ? 0 : 1,
      abstain: 0,
      passed
    });
  };

  return (
    <Card className="p-6 border-2 border-primary/20">
      <div className="space-y-6">
        <div className="pb-4 border-b space-y-3">
          <div>
            <h2 className="text-2xl font-bold">{motionName}</h2>
            <p className="text-sm text-muted-foreground mt-1">Motion Type: {topic}</p>
          </div>
          {topic === "Moderated Caucus" && motion?.duration && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">Total Duration</p>
                <p className="text-lg font-semibold">{motion.duration} minutes</p>
              </div>
              {motion.speakingTime && (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">Speaker Time</p>
                  <p className="text-lg font-semibold">{motion.speakingTime} seconds</p>
                </div>
              )}
            </div>
          )}
          {topic === "Unmoderated Caucus" && motion?.duration && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-primary">Duration</p>
              <p className="text-lg font-semibold">{motion.duration} minutes</p>
            </div>
          )}
          {topic === "GSL" && motion?.speakersCount && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">Speakers</p>
                <p className="text-lg font-semibold">{motion.speakersCount} countries</p>
              </div>
              {motion.speakingTime && (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">Speaking Time</p>
                  <p className="text-lg font-semibold">{motion.speakingTime} seconds</p>
                </div>
              )}
            </div>
          )}
          {motion?.proposingCountry && (
            <div className="p-2 bg-accent/10 rounded-lg">
              <p className="text-sm font-medium text-accent-foreground">Proposed by</p>
              <p className="text-lg font-semibold">{motion.proposingCountry}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="h-24 text-lg bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleVoteComplete(true)}
            >
              <Check className="h-6 w-6 mr-2" />
              Pass Motion
            </Button>
            <Button
              size="lg"
              className="h-24 text-lg bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleVoteComplete(false)}
            >
              <X className="h-6 w-6 mr-2" />
              Fail Motion
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={onCancel} className="w-full">
                Cancel Vote
              </Button>
              <Button
                variant="outline"
                onClick={() => onVotingComplete({ yes: 0, no: 0, abstain: 0, passed: false, adjourned: true })}
                className="w-full text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                Adjourn Motion
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Are you sure you want to remove this motion? This action cannot be undone.')) {
                    onCancel();
                    onVotingComplete({ yes: 0, no: 0, abstain: 0, passed: false, removed: true });
                  }
                }}
                className="w-full text-red-600 border-red-600 hover:bg-red-50"
              >
                Remove Motion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}