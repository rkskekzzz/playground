"use client";

import { useTeam } from "@/context/TeamContext";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentTeam, isLoading } = useTeam();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!currentTeam) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
