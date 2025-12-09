import { Speaker } from './shared/speaker';

export type CommitteeSettings = {
  enableMotions: boolean;
  enableVoting: boolean;
  showTimer?: boolean;
  showSpeakerList?: boolean;
  showMotions?: boolean;
  recordSession?: boolean;
  autoSaveDrafts?: boolean;
  notificationsEnabled?: boolean;
  speakingTime?: number;
};

export type Country = {
  name: string;
  code: string;
  attendance: 'present' | 'present-voting' | 'absent';
};

export type Committee = {
  id: string;
  name: string;
  abbrev: string;
  agenda: string;
  chair: string;
  coChair: string;
  rapporteur: string;
  countries: Country[];
  countryList: Array<{
    id: string;
    name: string;
    flagQuery: string;
    attendance: 'present' | 'present-voting' | 'absent';
  }>;
  settings?: CommitteeSettings;
  currentSession?: {
    currentSpeaker?: Speaker;
    speakerQueue?: Speaker[];
    isYielded?: boolean;
  };
};