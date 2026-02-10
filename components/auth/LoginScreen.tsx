"use client";

import { useState } from "react";
import { useTeam } from "@/context/TeamContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An error occurred";
}

export function LoginScreen() {
  const { login } = useTeam();
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        // Register
        const { data, error } = await supabase.rpc("create_team", {
          team_name: teamName,
          team_password: password,
        });

        if (error) throw error;

        if (data) {
          toast.success("Team created successfully! You are now logged in.");
          login({ id: data, name: teamName });
        } else {
          throw new Error("Failed to create team");
        }
      } else {
        // Login
        const { data, error } = await supabase.rpc("verify_team_credentials", {
          team_name: teamName,
          team_password: password,
        });

        if (error) throw error;

        if (data) {
          toast.success("Logged in successfully!");
          login({ id: data, name: teamName });
        } else {
          toast.error("Invalid team name or password");
        }
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Pantheon_0.jpg"
          alt="Background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/60 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950/50 to-zinc-950" />
      </div>

      {/* Main Card */}
      <Card className="relative z-10 w-full max-w-md border-zinc-800/50 bg-zinc-950/60 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-900/20">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">
            {isRegistering ? "Create Team Space" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-zinc-400 text-base">
            {isRegistering
              ? "Initialize your team's command center"
              : "Enter your credentials to access the system"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-zinc-300">
                Team ID
              </Label>
              <Input
                id="teamName"
                placeholder="e.g. T1_Scrims"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoading}
                className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 h-11 text-base font-medium shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isRegistering ? "Initialize Team" : "Enter Space"}
            </Button>
            <div className="text-sm text-center text-zinc-500">
              {isRegistering ? (
                <>
                  Already have a space?{" "}
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors"
                    onClick={() => setIsRegistering(false)}
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  First time here?{" "}
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors"
                    onClick={() => setIsRegistering(true)}
                  >
                    Create Team
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
