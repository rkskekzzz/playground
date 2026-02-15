"use client";

import { useEffect, useRef, useState } from "react";
import { PlayerPool } from "@/components/teambuilder/PlayerPool";
import { PlayerPoolMobile } from "@/components/teambuilder/PlayerPoolMobile";
import { ConstraintControls } from "@/components/teambuilder/ConstraintControls";
import { ConstraintControlsMobile } from "@/components/teambuilder/ConstraintControlsMobile";
import { FixedPositionMobile } from "@/components/teambuilder/FixedPositionMobile";
import { PreMadeGroups } from "@/components/teambuilder/PreMadeGroups";
import { TeamDisplay } from "@/components/teambuilder/TeamDisplay";
import { Player, Position, TeamResult, generateTeams } from "@/lib/teamLogic";
import { Member } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTeam } from "@/context/TeamContext";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useTeamMembersRealtime } from "@/lib/realtime/useTeamMembersRealtime";
import { useCollaborativeTeamBuilderDraft } from "@/lib/realtime/useCollaborativeTeamBuilderDraft";
import {
  sanitizeGroups,
  sanitizeTeamBuilderState,
  TeamBuilderPersistedState,
  TeamBuilderPlayerConstraint,
} from "@/lib/persistence/schemas/teamBuilder";

type GroupsState = Record<string, string[]>;
const MAX_FIXED_POSITIONS = 4;

function areGroupsEqual(a: GroupsState, b: GroupsState): boolean {
  const aEntries = Object.entries(a).sort(([aKey], [bKey]) =>
    aKey.localeCompare(bKey)
  );
  const bEntries = Object.entries(b).sort(([aKey], [bKey]) =>
    aKey.localeCompare(bKey)
  );

  if (aEntries.length !== bEntries.length) {
    return false;
  }

  return aEntries.every(([aGroupId, aMembers], index) => {
    const [bGroupId, bMembers] = bEntries[index] ?? [];
    if (aGroupId !== bGroupId) {
      return false;
    }

    const aSorted = [...aMembers].sort((first, second) =>
      first.localeCompare(second)
    );
    const bSorted = [...bMembers].sort((first, second) =>
      first.localeCompare(second)
    );

    if (aSorted.length !== bSorted.length) {
      return false;
    }

    return aSorted.every((memberId, memberIndex) => memberId === bSorted[memberIndex]);
  });
}

function arePlayersEqual(a: Player[], b: Player[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((player, index) => {
    const other = b[index];
    if (!other) {
      return false;
    }

    const aPositions = player.selectedPositions ?? [];
    const bPositions = other.selectedPositions ?? [];

    if (aPositions.length !== bPositions.length) {
      return false;
    }

    const positionsMatch = aPositions.every(
      (position, posIndex) => position === bPositions[posIndex]
    );

    return (
      player.id === other.id &&
      player.nickname === other.nickname &&
      player.lol_id === other.lol_id &&
      player.main_position === other.main_position &&
      Boolean(player.fixedPosition) === Boolean(other.fixedPosition) &&
      positionsMatch
    );
  });
}

function normalizeSelectedPositions(
  positions?: Position[]
): Position[] | undefined {
  if (!positions || positions.length === 0) {
    return undefined;
  }

  const uniquePositions = Array.from(new Set(positions)).slice(
    0,
    MAX_FIXED_POSITIONS
  );

  return uniquePositions.length > 0 ? uniquePositions : undefined;
}

function buildPlayerConstraints(
  players: Player[]
): Record<string, TeamBuilderPlayerConstraint> {
  const constraints: Record<string, TeamBuilderPlayerConstraint> = {};

  players.forEach((player) => {
    const selectedPositions = normalizeSelectedPositions(player.selectedPositions);
    constraints[player.id] = {
      fixedPosition: Boolean(player.fixedPosition),
      ...(selectedPositions
        ? { selectedPositions }
        : {}),
    };
  });

  return constraints;
}

function createEmptyTeamBuilderState(): TeamBuilderPersistedState {
  return {
    version: 1,
    selectedPlayerIds: [],
    playerConstraints: {},
    groups: {},
    updatedAt: new Date().toISOString(),
  };
}

function buildTeamBuilderPersistedState(
  players: Player[],
  groups: GroupsState
): TeamBuilderPersistedState {
  const selectedPlayerIds = players.map((player) => player.id);
  const selectedIdSet = new Set(selectedPlayerIds);

  return {
    version: 1,
    selectedPlayerIds,
    playerConstraints: buildPlayerConstraints(players),
    groups: sanitizeGroups(groups, selectedIdSet),
    updatedAt: new Date().toISOString(),
  };
}

function deriveLocalStateFromDraft(
  draftState: TeamBuilderPersistedState | null,
  members: Member[]
): {
  selectedPlayers: Player[];
  groups: GroupsState;
  normalizedDraftState: TeamBuilderPersistedState;
} {
  const validMemberIds = new Set(members.map((member) => member.id));
  const memberById = new Map(members.map((member) => [member.id, member]));

  const sourceState = sanitizeTeamBuilderState(
    draftState ?? createEmptyTeamBuilderState(),
    validMemberIds
  );

  const selectedPlayerIds = sourceState.selectedPlayerIds.slice(0, 10);
  const selectedIdSet = new Set(selectedPlayerIds);
  const playerConstraints: Record<string, TeamBuilderPlayerConstraint> = {};

  selectedPlayerIds.forEach((playerId) => {
    const constraint = sourceState.playerConstraints[playerId];
    if (!constraint) {
      return;
    }

    if (!constraint.fixedPosition) {
      playerConstraints[playerId] = { fixedPosition: false };
      return;
    }

    const selectedPositions = normalizeSelectedPositions(
      constraint.selectedPositions
    );

    playerConstraints[playerId] = {
      fixedPosition: true,
      ...(selectedPositions
        ? { selectedPositions }
        : {}),
    };
  });

  const normalizedGroups = sanitizeGroups(sourceState.groups, selectedIdSet);

  const selectedPlayers = selectedPlayerIds
    .map((playerId) => {
      const member = memberById.get(playerId);
      if (!member) {
        return null;
      }

      const constraint = playerConstraints[playerId];
      return {
        ...member,
        ...(constraint
          ? {
              fixedPosition: constraint.fixedPosition,
              ...(constraint.selectedPositions
                ? { selectedPositions: constraint.selectedPositions }
                : {}),
            }
          : {}),
      };
    })
    .filter((player): player is Player => player !== null);

  const normalizedDraftState = buildTeamBuilderPersistedState(
    selectedPlayers,
    normalizedGroups
  );

  return {
    selectedPlayers,
    groups: normalizedDraftState.groups,
    normalizedDraftState,
  };
}

export default function TeamBuilderPage() {
  const { currentTeam, isLoading: isAuthLoading } = useTeam();
  const teamId = currentTeam?.id;
  const { members, isLoading: isMembersLoading } = useTeamMembersRealtime(teamId);
  const {
    draftState,
    isReady: isDraftReady,
    remoteVersion,
    scheduleSave,
  } = useCollaborativeTeamBuilderDraft(teamId);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [groups, setGroups] = useState<GroupsState>({});
  const [teamResult, setTeamResult] = useState<TeamResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecordingWin, setIsRecordingWin] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const hydratedTeamIdRef = useRef<string | null>(null);
  const handledRemoteVersionRef = useRef(0);

  useEffect(() => {
    if (!teamId) {
      hydratedTeamIdRef.current = null;
      handledRemoteVersionRef.current = 0;
      setSelectedPlayers([]);
      setGroups({});
      setTeamResult(null);
      setGenerationId(null);
      setIsHydrated(false);
      return;
    }

    hydratedTeamIdRef.current = null;
    handledRemoteVersionRef.current = 0;
    setSelectedPlayers([]);
    setGroups({});
    setTeamResult(null);
    setGenerationId(null);
    setIsHydrated(false);
  }, [teamId]);

  useEffect(() => {
    if (!teamId || !isDraftReady || isMembersLoading) {
      return;
    }

    if (hydratedTeamIdRef.current === teamId) {
      return;
    }

    const { selectedPlayers: restoredPlayers, groups: restoredGroups, normalizedDraftState } =
      deriveLocalStateFromDraft(draftState, members);

    setSelectedPlayers(restoredPlayers);
    setGroups(restoredGroups);
    setTeamResult(null);
    setGenerationId(null);
    setIsHydrated(true);
    hydratedTeamIdRef.current = teamId;
    handledRemoteVersionRef.current = remoteVersion;
    scheduleSave(normalizedDraftState);
  }, [
    teamId,
    isDraftReady,
    isMembersLoading,
    draftState,
    members,
    remoteVersion,
    scheduleSave,
  ]);

  useEffect(() => {
    if (!teamId || !isHydrated || !isDraftReady) {
      return;
    }

    if (remoteVersion <= handledRemoteVersionRef.current) {
      return;
    }

    handledRemoteVersionRef.current = remoteVersion;

    const { selectedPlayers: restoredPlayers, groups: restoredGroups } =
      deriveLocalStateFromDraft(draftState, members);
    setSelectedPlayers(restoredPlayers);
    setGroups(restoredGroups);
    setTeamResult(null);
    setGenerationId(null);
  }, [teamId, isHydrated, isDraftReady, remoteVersion, draftState, members]);

  useEffect(() => {
    if (!teamId || !isHydrated) {
      return;
    }

    const memberById = new Map(members.map((member) => [member.id, member]));
    const nextPlayers = selectedPlayers
      .map((player) => {
        const member = memberById.get(player.id);
        if (!member) {
          return null;
        }

        const selectedPositions = normalizeSelectedPositions(player.selectedPositions);
        const nextPlayer: Player = {
          ...member,
          ...(player.fixedPosition
            ? { fixedPosition: true }
            : {}),
          ...(selectedPositions
            ? { selectedPositions }
            : {}),
        };
        return nextPlayer;
      })
      .filter((player): player is Player => player !== null);

    const selectedIdSet = new Set(nextPlayers.map((player) => player.id));
    const nextGroups = sanitizeGroups(groups, selectedIdSet);

    const playersChanged = !arePlayersEqual(selectedPlayers, nextPlayers);
    const groupsChanged = !areGroupsEqual(groups, nextGroups);

    if (playersChanged) {
      setSelectedPlayers(nextPlayers);
    }

    if (groupsChanged) {
      setGroups(nextGroups);
    }

    if ((playersChanged || groupsChanged) && teamResult) {
      setTeamResult(null);
      setGenerationId(null);
    }
  }, [teamId, isHydrated, members, groups, selectedPlayers, teamResult]);

  useEffect(() => {
    if (!teamId || !isHydrated) {
      return;
    }

    scheduleSave(buildTeamBuilderPersistedState(selectedPlayers, groups));
  }, [teamId, isHydrated, selectedPlayers, groups, scheduleSave]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!currentTeam) {
    return <LoginScreen />;
  }

  if (!isHydrated || isMembersLoading || !isDraftReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const handleTogglePlayer = (member: Member) => {
    setSelectedPlayers((prev) => {
      const exists = prev.find((p) => p.id === member.id);
      if (exists) {
        const nextPlayers = prev.filter((p) => p.id !== member.id);
        const selectedIdSet = new Set(nextPlayers.map((player) => player.id));
        setGroups((prevGroups) => sanitizeGroups(prevGroups, selectedIdSet));
        return nextPlayers;
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
    let normalizedUpdates: Partial<Player> = { ...updates };

    if (updates.selectedPositions) {
      const uniqueSelectedPositions = Array.from(
        new Set(updates.selectedPositions)
      );

      if (uniqueSelectedPositions.length > MAX_FIXED_POSITIONS) {
        toast.error("고정 포지션은 최대 4개까지 선택할 수 있습니다.");
      }

      normalizedUpdates.selectedPositions = normalizeSelectedPositions(
        uniqueSelectedPositions
      );
    }

    if (updates.fixedPosition === false) {
      normalizedUpdates = {
        ...normalizedUpdates,
        selectedPositions: undefined,
      };
    }

    setSelectedPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, ...normalizedUpdates } : p))
    );
  };

  const handleCreateGroup = (memberIds: string[]) => {
    const selectedIdSet = new Set(selectedPlayers.map((player) => player.id));
    const validMemberIds = Array.from(
      new Set(memberIds.filter((memberId) => selectedIdSet.has(memberId)))
    );

    if (validMemberIds.length < 2 || validMemberIds.length > 5) {
      return;
    }

    const groupId = Math.random().toString(36).substring(7);
    setGroups((prev) => ({ ...prev, [groupId]: validMemberIds }));
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
    setGenerationId(null);
    // Small delay for UX
    setTimeout(() => {
      const result = generateTeams(selectedPlayers, groups);
      if (result) {
        setTeamResult(result);
        setGenerationId(crypto.randomUUID());
        toast.success("Teams generated!");
      } else {
        setTeamResult(null);
        toast.error("Failed to generate valid teams with current constraints");
      }
      setIsGenerating(false);
    }, 500);
  };

  const handleRecordWin = async (winningTeam: "BLUE" | "RED") => {
    if (!teamResult || !currentTeam || !generationId || isRecordingWin) return;

    setIsRecordingWin(true);

    try {
      // 1. Create Game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert([
          {
            winning_team: winningTeam,
            team_id: currentTeam.id,
            generation_id: generationId,
          },
        ])
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

      setGenerationId(null);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        toast.error("This matchup was already recorded.");
        return;
      }

      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to save game result: " + message);
    } finally {
      setIsRecordingWin(false);
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
            members={members}
            selectedIds={selectedPlayers.map((p) => p.id)}
            onToggle={handleTogglePlayer}
          />
        </div>

        {/* Middle: Constraints (3 cols on desktop) */}
        <div className="lg:col-span-3 min-h-0">
          <ConstraintControls
            selectedPlayers={selectedPlayers}
            onUpdatePlayer={handleUpdatePlayer}
          />
        </div>

        {/* Right: Result (6 cols on desktop) */}
        <div className="lg:col-span-6 min-h-0 flex flex-col gap-4">
          <PreMadeGroups
            selectedPlayers={selectedPlayers}
            groups={groups}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <TeamDisplay
              result={teamResult}
              onRecordWin={handleRecordWin}
              isRecordingWin={isRecordingWin}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col lg:hidden gap-4 pb-12">
        {/* Player Pool - Bottom Sheet */}
        <PlayerPoolMobile
          members={members}
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
        <TeamDisplay
          result={teamResult}
          onRecordWin={handleRecordWin}
          isRecordingWin={isRecordingWin}
        />
      </div>
    </div>
  );
}
