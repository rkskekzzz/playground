"use client";

import { useState } from "react";
import { PlayerPool } from "@/components/teambuilder/PlayerPool";
import { PlayerPoolMobile } from "@/components/teambuilder/PlayerPoolMobile";
import { ConstraintControls } from "@/components/teambuilder/ConstraintControls";
import { ConstraintControlsMobile } from "@/components/teambuilder/ConstraintControlsMobile";
import { FixedPositionMobile } from "@/components/teambuilder/FixedPositionMobile";
import { TeamDisplay } from "@/components/teambuilder/TeamDisplay";
import { Player, TeamResult, generateTeams } from "@/lib/teamLogic";
import { Member } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function TeamBuilderPage() {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [groups, setGroups] = useState<{ [key: string]: string[] }>({});
  const [teamResult, setTeamResult] = useState<TeamResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTogglePlayer = (member: Member) => {
    setSelectedPlayers((prev) => {
      const exists = prev.find((p) => p.id === member.id);
      if (exists) {
        return prev.filter((p) => p.id !== member.id);
      } else {
        if (prev.length >= 10) {
          toast.error("Max 10 players allowed");
          return prev;
        }
        return [...prev, { ...member }];
      }
    });
  };

  const handleUpdatePlayer = (playerId: string, updates: Partial<Player>) => {
    setSelectedPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, ...updates } : p))
    );
  };

  const handleCreateGroup = (memberIds: string[]) => {
    const groupId = Math.random().toString(36).substring(7);
    setGroups((prev) => ({ ...prev, [groupId]: memberIds }));
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  };

  const handleGenerate = () => {
    if (selectedPlayers.length !== 10) {
      toast.error("Please select exactly 10 players");
      return;
    }

    setIsGenerating(true);
    // Small delay for UX
    setTimeout(() => {
      const result = generateTeams(selectedPlayers, groups);
      if (result) {
        setTeamResult(result);
        toast.success("Teams generated!");
      } else {
        toast.error("Failed to generate valid teams with current constraints");
      }
      setIsGenerating(false);
    }, 500);
  };

  const handleRecordWin = async (winningTeam: "BLUE" | "RED") => {
    if (!teamResult) return;

    try {
      // 1. Create Game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert([{ winning_team: winningTeam }])
        .select()
        .single();

      if (gameError) throw gameError;

      // 2. Create Participants
      const participants: {
        game_id: string;
        member_id: string;
        team: "BLUE" | "RED";
        position: string;
      }[] = [];

      // Blue Team
      Object.entries(teamResult.blue).forEach(([pos, player]) => {
        if (player) {
          participants.push({
            game_id: gameData.id,
            member_id: player.id,
            team: "BLUE",
            position: pos,
          });
        }
      });

      // Red Team
      Object.entries(teamResult.red).forEach(([pos, player]) => {
        if (player) {
          participants.push({
            game_id: gameData.id,
            member_id: player.id,
            team: "RED",
            position: pos,
          });
        }
      });

      const { error: partError } = await supabase
        .from("game_participants")
        .insert(participants);

      if (partError) throw partError;

      toast.success(`${winningTeam} team win recorded!`, {
        action: {
          label: "Undo",
          onClick: async () => {
            const { error: deleteError } = await supabase
              .from("games")
              .delete()
              .eq("id", gameData.id);

            if (deleteError) {
              toast.error("Failed to undo game");
            } else {
              toast.success("Game recording undone");
            }
          },
        },
        duration: 5000,
      });
    } catch (error: any) {
      toast.error("Failed to save game result: " + error.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)] md:h-[calc(100vh-3rem)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Team Builder
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Select players and generate balanced teams.
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || selectedPlayers.length !== 10}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 w-full md:w-auto"
        >
          <Wand2
            className={`w-5 h-5 mr-2 ${isGenerating ? "animate-spin" : ""}`}
          />
          {isGenerating ? "Generating..." : "Generate Teams"}
        </Button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Player Selection (3 cols on desktop) */}
        <div className="lg:col-span-3 h-full min-h-0">
          <PlayerPool
            selectedIds={selectedPlayers.map((p) => p.id)}
            onToggle={handleTogglePlayer}
          />
        </div>

        {/* Middle: Constraints (3 cols on desktop) */}
        <div className="lg:col-span-3">
          <ConstraintControls
            selectedPlayers={selectedPlayers}
            onUpdatePlayer={handleUpdatePlayer}
            groups={groups}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        </div>

        {/* Right: Result (6 cols on desktop) */}
        <div className="lg:col-span-6">
          <TeamDisplay result={teamResult} onRecordWin={handleRecordWin} />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col lg:hidden gap-4 pb-12">
        {/* Player Pool - Bottom Sheet */}
        <PlayerPoolMobile
          selectedIds={selectedPlayers.map((p) => p.id)}
          onToggle={handleTogglePlayer}
        />

        {/* Fixed Positions - Bottom Sheet */}
        <FixedPositionMobile
          selectedPlayers={selectedPlayers}
          onUpdatePlayer={handleUpdatePlayer}
        />

        {/* Pre-made Groups - Modal */}
        <ConstraintControlsMobile
          selectedPlayers={selectedPlayers}
          groups={groups}
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
        />

        {/* Team Result */}
        <TeamDisplay result={teamResult} onRecordWin={handleRecordWin} />
      </div>
    </div>
  );
}
