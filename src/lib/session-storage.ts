"use client";

import { Committee, AttendanceStatus } from "@/components/committee-manager";

export type CommitteeSessionData = {
  id: string;
  name: string;
  abbrev: string;
  agenda: string;
  countries: Array<{ name: string; code: string; attendance: 'present' | 'present-voting' | 'absent' }>;
  countryList: Array<{ id: string; name: string; flagQuery: string; attendance: 'present' | 'present-voting' | 'absent' }>;
  chair: string;
  coChair: string;
  rapporteur: string;
  currentSpeaker?: any;
  speakerQueue?: any[];
  isYielded?: boolean;
  yieldedTime?: number;
  committeeInfo?: {
    name: string;
  };
  settings?: {
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
};

/**
 * Retrieves all session data from sessionStorage.
 * @returns The parsed session data, or null if not found.
 */
export function getSessionData(): CommitteeSessionData | null {
  if (typeof window === "undefined") return null;
  const data = sessionStorage.getItem("sessionData");
  return data ? JSON.parse(data) : null;
}

/**
 * Updates the session data in sessionStorage.
 * @param data - The data to store.
 */
export function updateSessionData(data: CommitteeSessionData): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("sessionData", JSON.stringify(data));
}

/**
 * Retrieves a specific committee by its ID from sessionStorage.
 * @param committeeId - The ID of the committee to retrieve.
 * @returns The committee data, or null if not found.
 */
export function getCommittee(committeeId: string): CommitteeSessionData | null {
  if (typeof window === "undefined") return null;
  const data = sessionStorage.getItem(`committee_${committeeId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Saves committee data to sessionStorage.
 * @param committee - The committee data to save.
 */
export function saveCommittee(committee: CommitteeSessionData): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`committee_${committee.id}`, JSON.stringify(committee));
}