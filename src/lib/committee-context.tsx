"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Committee } from "@/components/committee-manager";
import { saveSession, loadSession } from "./supabase/session";

type CommitteeContextType = {
  committee: Committee | null;
  setCommittee: (committee: Committee | null | ((prev: Committee | null) => Committee | null)) => void;
  isLoading: boolean;
  error: Error | null;
};

const CommitteeContext = createContext<CommitteeContextType>({
  committee: null,
  setCommittee: () => {},
  isLoading: false,
  error: null
});

export function CommitteeProvider({ children }: { children: ReactNode }) {
  const [committee, setCommitteeState] = useState<Committee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (committee?.currentSession) {
      // Clear any existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save
      const timeout = setTimeout(async () => {
        try {
          await saveSession(committee.currentSession!);
        } catch (err) {
          console.error('Auto-save error:', err);
          setError(err instanceof Error ? err : new Error('Failed to auto-save session'));
        }
      }, 2000); // Auto-save after 2 seconds of no changes

      setSaveTimeout(timeout);

      // Cleanup on unmount
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [committee?.currentSession]);

  // Wrapper for setCommittee that ensures proper state updates
  const setCommittee = (update: Committee | null | ((prev: Committee | null) => Committee | null)) => {
    setCommitteeState(prev => {
      try {
        let newState: Committee | null;
        
        // Handle functional updates
        if (typeof update === 'function') {
          newState = update(prev);
        } else {
          newState = update;
        }

        // If the new state is null or unchanged, don't trigger an update
        if (!newState || JSON.stringify(newState) === JSON.stringify(prev)) {
          return prev;
        }

        setError(null); // Clear any previous errors
        return newState;
      } catch (error) {
        console.error('Error updating committee:', error);
        setError(error instanceof Error ? error : new Error('Failed to update committee'));
        return prev;
      }
    });
  };

  return (
    <CommitteeContext.Provider value={{ committee, setCommittee, isLoading, error }}>
      {children}
    </CommitteeContext.Provider>
  );
}

export function useCommittee() {
  const context = useContext(CommitteeContext);
  if (!context) {
    throw new Error("useCommittee must be used within a CommitteeProvider");
  }
  return context;
}
