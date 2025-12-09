export type MotionStatus = "Pending" | "In Progress" | "Passed" | "Failed";
export type MotionType = "Moderated Caucus" | "Unmoderated Caucus" | "GSL" | "Close Debate" | "Table Debate" | "Introduce Draft Resolution" | "Custom" | "Extension";

export interface Motion {
  id: string;
  name: string;
  type: MotionType;
  proposingCountry: string;
  duration?: number;
  speakersCount?: number;
  speakingTime?: number;
  totalSpeakers?: number;
  speakers?: string[];  // Array of speaker IDs/names
  currentSpeakerIndex?: number;
  status: MotionStatus;
  votesFor?: number;
  votesAgainst?: number;
  abstentions?: number;
  createdAt: string;
  parentMotionId?: string; // For extension motions
}

export interface VotingData {
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
}

export interface Speaker {
  id: string;
  name: string;
  flagQuery: string;
  attendance?: 'present' | 'present-voting' | 'absent';
}

export interface ExtendedMotion extends Motion {
  speakers: string[];  // Override to make required for passed motions
  currentSpeakerIndex: number;  // Override to make required for passed motions
}
