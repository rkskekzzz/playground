import { Position } from "@/lib/teamLogic";
import { buildScopedKey } from "@/lib/persistence/localStorage";

export const TEAM_BUILDER_STORAGE_NAMESPACE = "team_playground:teambuilder:v1";

export const TEAM_BUILDER_STATE_VERSION = 1;
const VALID_POSITIONS: Position[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

export interface TeamBuilderPlayerConstraint {
  fixedPosition: boolean;
  selectedPositions?: Position[];
}

export interface TeamBuilderPersistedState {
  version: 1;
  selectedPlayerIds: string[];
  playerConstraints: Record<string, TeamBuilderPlayerConstraint>;
  groups: Record<string, string[]>;
  updatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidPosition(value: unknown): value is Position {
  return (
    typeof value === "string" &&
    VALID_POSITIONS.includes(value as Position)
  );
}

function sanitizeSelectedPositions(rawConstraint: Record<string, unknown>): Position[] {
  if (Array.isArray(rawConstraint.selectedPositions)) {
    const positions = rawConstraint.selectedPositions.filter(isValidPosition);
    return Array.from(new Set(positions)).slice(0, 4);
  }

  if (isValidPosition(rawConstraint.selectedPosition)) {
    return [rawConstraint.selectedPosition];
  }

  return [];
}

function uniqueStringList(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function getTeamBuilderStorageKey(teamId: string): string {
  return buildScopedKey(TEAM_BUILDER_STORAGE_NAMESPACE, teamId);
}

export function sanitizeGroups(
  groups: Record<string, string[]>,
  allowedMemberIds: Set<string>
): Record<string, string[]> {
  const sanitizedGroups: Record<string, string[]> = {};

  Object.entries(groups).forEach(([groupId, memberIds]) => {
    const validMembers = uniqueStringList(
      memberIds.filter((memberId) => allowedMemberIds.has(memberId))
    );

    if (validMembers.length >= 2) {
      sanitizedGroups[groupId] = validMembers;
    }
  });

  return sanitizedGroups;
}

export function safeParseTeamBuilderState(
  input: unknown
): TeamBuilderPersistedState | null {
  if (!isRecord(input)) {
    return null;
  }

  if (input.version !== TEAM_BUILDER_STATE_VERSION) {
    return null;
  }

  if (
    !Array.isArray(input.selectedPlayerIds) ||
    !isRecord(input.playerConstraints) ||
    !isRecord(input.groups) ||
    typeof input.updatedAt !== "string"
  ) {
    return null;
  }

  const updatedAtDate = new Date(input.updatedAt);
  if (Number.isNaN(updatedAtDate.getTime())) {
    return null;
  }

  const selectedPlayerIds = input.selectedPlayerIds.filter(
    (playerId): playerId is string => typeof playerId === "string"
  );

  const playerConstraints: Record<string, TeamBuilderPlayerConstraint> = {};
  Object.entries(input.playerConstraints).forEach(([playerId, rawConstraint]) => {
    if (!isRecord(rawConstraint)) {
      return;
    }

    if (typeof rawConstraint.fixedPosition !== "boolean") {
      return;
    }

    const fixedPosition = rawConstraint.fixedPosition;
    const selectedPositions = sanitizeSelectedPositions(rawConstraint);

    playerConstraints[playerId] = {
      fixedPosition,
      ...(selectedPositions.length > 0 ? { selectedPositions } : {}),
    };
  });

  const groups: Record<string, string[]> = {};
  Object.entries(input.groups).forEach(([groupId, rawMemberIds]) => {
    if (!Array.isArray(rawMemberIds)) {
      return;
    }

    groups[groupId] = rawMemberIds.filter(
      (memberId): memberId is string => typeof memberId === "string"
    );
  });

  return {
    version: 1,
    selectedPlayerIds,
    playerConstraints,
    groups,
    updatedAt: input.updatedAt,
  };
}

export function sanitizeTeamBuilderState(
  state: TeamBuilderPersistedState,
  validMemberIds: Set<string>
): TeamBuilderPersistedState {
  const selectedPlayerIds = uniqueStringList(
    state.selectedPlayerIds.filter((playerId) => validMemberIds.has(playerId))
  );
  const selectedIdSet = new Set(selectedPlayerIds);

  const playerConstraints: Record<string, TeamBuilderPlayerConstraint> = {};
  Object.entries(state.playerConstraints).forEach(([playerId, constraint]) => {
    if (!selectedIdSet.has(playerId)) {
      return;
    }

    playerConstraints[playerId] = {
      fixedPosition: constraint.fixedPosition,
      ...(constraint.selectedPositions && constraint.selectedPositions.length > 0
        ? {
            selectedPositions: Array.from(
              new Set(constraint.selectedPositions.filter(isValidPosition))
            ).slice(0, 4),
          }
        : {}),
    };
  });

  const groups = sanitizeGroups(state.groups, selectedIdSet);

  return {
    version: 1,
    selectedPlayerIds,
    playerConstraints,
    groups,
    updatedAt: state.updatedAt,
  };
}

function normalizeForComparison(state: TeamBuilderPersistedState) {
  const sortedConstraints = Object.fromEntries(
    Object.entries(state.playerConstraints)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([playerId, constraint]) => [
        playerId,
        {
          fixedPosition: Boolean(constraint.fixedPosition),
          ...(constraint.selectedPositions && constraint.selectedPositions.length > 0
            ? {
                selectedPositions: Array.from(
                  new Set(constraint.selectedPositions.filter(isValidPosition))
                )
                  .slice(0, 4)
                  .sort((a, b) => a.localeCompare(b)),
              }
            : {}),
        },
      ])
  );

  const sortedGroups = Object.fromEntries(
    Object.entries(state.groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupId, memberIds]) => [
        groupId,
        [...memberIds].sort((a, b) => a.localeCompare(b)),
      ])
  );

  return {
    version: state.version,
    selectedPlayerIds: [...state.selectedPlayerIds].sort((a, b) =>
      a.localeCompare(b)
    ),
    playerConstraints: sortedConstraints,
    groups: sortedGroups,
  };
}

export function isSameTeamBuilderState(
  a: TeamBuilderPersistedState,
  b: TeamBuilderPersistedState
): boolean {
  return (
    JSON.stringify(normalizeForComparison(a)) ===
    JSON.stringify(normalizeForComparison(b))
  );
}
