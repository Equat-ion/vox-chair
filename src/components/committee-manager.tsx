"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getCommittee, saveCommittee } from "@/lib/session-storage";
import { useCommittee } from "@/lib/committee-context";
import { CountryAttendance } from "./country-attendance";
import { CommitteeSessionData } from "@/types/session";

export type AttendanceStatus = 'present' | 'present-voting' | 'absent';

export type Country = {
  name: string;
  code: string;
  attendance: AttendanceStatus;
};

export type CountryListItem = {
  id: string;
  name: string;
  flagQuery: string;
  attendance: AttendanceStatus;
};

export interface Committee {
  id: string;
  name: string;
  abbrev: string;
  agenda: string;
  countries: Array<Country>;
  countryList: Array<CountryListItem>;
  chair: string;
  coChair: string;
  rapporteur: string;
  currentSession?: CommitteeSessionData;
  settings?: {
    enableMotions: boolean;
    enableVoting: boolean;
    showTimer: boolean;
    showSpeakerList: boolean;
    showMotions: boolean;
    recordSession: boolean;
    autoSaveDrafts: boolean;
    notificationsEnabled: boolean;
    speakingTime: number;
  };
}

export function CommitteeManager() {
  const searchParams = useSearchParams();
  const { committee, setCommittee } = useCommittee();

  // Load committee data on mount or URL change
  useEffect(() => {
    const committeeId = searchParams.get("committee");
    if (!committeeId || !setCommittee) return;

    const storedCommittee = getCommittee(committeeId);
    if (!storedCommittee) return;

    // Only update if the committee has changed
    setCommittee(prev => {
      if (prev?.id === committeeId) return prev;

      const normalizeAttendance = (status: string | undefined): AttendanceStatus => {
        if (status === 'present') return 'present';
        if (status === 'present-voting') return 'present-voting';
        return 'absent';
      };

      return {
        ...storedCommittee,
        id: committeeId,
        countries: storedCommittee.countries.map(country => ({
          ...country,
          attendance: normalizeAttendance(country.attendance)
        })),
        countryList: storedCommittee.countryList.map(country => ({
          ...country,
          attendance: normalizeAttendance(country.attendance)
        }))
      };
    });
  }, [searchParams, setCommittee]);

  // Memoized handlers to prevent unnecessary re-renders
    const handleAttendanceChange = useCallback((countryName: string, newStatus: AttendanceStatus) => {
    if (!committee?.id) return;

    // Check if the status is actually different
    const currentCountry = committee.countryList.find(c => c.name === countryName);
    if (currentCountry?.attendance === newStatus) return;

    const updatedCommittee = {
      ...committee,
      countryList: committee.countryList.map(country => 
        country.name === countryName ? { ...country, attendance: newStatus } : country
      ),
      countries: committee.countries.map(country => 
        country.name === countryName ? { ...country, attendance: newStatus } : country
      )
    };

    // Update storage first, then state
    saveCommittee(updatedCommittee);
    setCommittee(updatedCommittee);
  }, [committee, setCommittee]);



  if (!committee) return null;

  if (!committee) return null;

  return (
    <div className="flex flex-col gap-4">
      <CountryAttendance 
        countryList={committee.countryList}
        onAttendanceChange={handleAttendanceChange}
      />
    </div>
  );
}
