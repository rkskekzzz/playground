"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
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
type Listener = () => void;
const listeners = new Set<Listener>();
let cachedRawTeam: string | null | undefined;
let cachedTeam: Team | null = null;

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

function emitStoreChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);

  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawTeam = window.localStorage.getItem(STORAGE_KEY);
  if (rawTeam === cachedRawTeam) {
    return cachedTeam;
  }

  cachedRawTeam = rawTeam;
  cachedTeam = readStoredTeam();
  return cachedTeam;
}

function getServerSnapshot() {
  return null;
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const currentTeam = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const isLoading = false;

  const login = (team: Team) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    cachedRawTeam = JSON.stringify(team);
    cachedTeam = team;
    emitStoreChange();
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    cachedRawTeam = null;
    cachedTeam = null;
    emitStoreChange();
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
