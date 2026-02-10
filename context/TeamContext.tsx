"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

interface Team {
  id: string;
  name: string;
}

interface TeamContextType {
  currentTeam: Team | null;
  login: (team: Team) => void;
  logout: () => void;
  isLoading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);
const STORAGE_KEY = "team_playground_team";

function readStoredTeam(): Team | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedTeam = localStorage.getItem(STORAGE_KEY);
  if (!storedTeam) {
    return null;
  }

  try {
    return JSON.parse(storedTeam) as Team;
  } catch (error) {
    console.error("Failed to parse stored team", error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(() =>
    readStoredTeam()
  );
  const isLoading = false;

  const login = (team: Team) => {
    setCurrentTeam(team);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  };

  const logout = () => {
    setCurrentTeam(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <TeamContext.Provider value={{ currentTeam, login, logout, isLoading }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
