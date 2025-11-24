"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
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

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const storedTeam = localStorage.getItem("team_playground_team");
    if (storedTeam) {
      try {
        setCurrentTeam(JSON.parse(storedTeam));
      } catch (e) {
        console.error("Failed to parse stored team", e);
        localStorage.removeItem("team_playground_team");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (team: Team) => {
    setCurrentTeam(team);
    localStorage.setItem("team_playground_team", JSON.stringify(team));
  };

  const logout = () => {
    setCurrentTeam(null);
    localStorage.removeItem("team_playground_team");
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
