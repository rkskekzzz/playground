
import { Member } from '@/types'

export type Position = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
const POSITIONS: Position[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

export interface Player extends Member {
  selectedPositions?: Position[]
  fixedPosition?: boolean
  groupId?: string // Players with same groupId must be on same team
}

export interface TeamResult {
  blue: { [key in Position]: Player | null }
  red: { [key in Position]: Player | null }
}

// Helper to shuffle array
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray
}

export function generateTeams(
  players: Player[],
  groups: { [key: string]: string[] } // groupId -> memberIds
): TeamResult | null {
  // 1. Basic Validation
  if (players.length !== 10) {
    console.error("Need exactly 10 players")
    return null
  }

  // 2. Initialize Teams
  // We'll try to fill slots.
  // Strategy:
  // - Assign fixed players first.
  // - Handle groups: Treat a group as a single unit.
  // - Randomly assign remaining players to remaining slots.

  // Since this is a constrained CSP (Constraint Satisfaction Problem), simple randomization might fail.
  // We'll try a few random attempts (Monte Carlo) because N=10 is small.

  const MAX_ATTEMPTS = 1000

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // A simpler approach for N=10:
    // 1. Partition 10 players into Team Blue (5) and Team Red (5) respecting Groups.
    // 2. For each team, assign positions respecting Fixed Positions.

    // Step 1: Partition Teams
    // Group constraints:
    // - Groups must stay together.
    // - Total size must be 5 vs 5.

    // Combine individual players into "Units" (Single player or Group of players)
    const units: Player[][] = []
    const processedIds = new Set<string>()

    // Add Groups first
    Object.values(groups).forEach(memberIds => {
      const groupPlayers = players.filter(p => memberIds.includes(p.id))
      if (groupPlayers.length > 0) {
        units.push(groupPlayers)
        groupPlayers.forEach(p => processedIds.add(p.id))
      }
    })

    // Add remaining individuals
    players.forEach(p => {
      if (!processedIds.has(p.id)) {
        units.push([p])
      }
    })

    // Shuffle units to randomize team assignment
    const shuffledUnits = shuffle(units)

    const teamA: Player[] = []
    const teamB: Player[] = []

    // Try to distribute units to make 5 vs 5
    // This is the Subset Sum Problem / Partition Problem, but small scale.
    // Greedy approach with backtracking or just random shuffle check?
    // Since units are small (max 5), random shuffle check is fast enough.

    let currentA = 0

    for (const unit of shuffledUnits) {
      if (currentA + unit.length <= 5) {
        teamA.push(...unit)
        currentA += unit.length
      } else {
        teamB.push(...unit)
      }
    }

    if (teamA.length !== 5 || teamB.length !== 5) {
      continue // Retry partition
    }

    // Step 2: Assign Positions within Teams
    const assignPositions = (teamPlayers: Player[]): Record<Position, Player> | null => {
      const assigned: Partial<Record<Position, Player>> = {}
      const availablePositions = new Set(POSITIONS)
      const assignedPlayerIds = new Set<string>()

      const constrainedPlayers = teamPlayers
        .map(player => ({
          player,
          allowedPositions: Array.from(
            new Set(
              (player.fixedPosition ? player.selectedPositions : undefined) ?? []
            )
          ).filter((pos): pos is Position => POSITIONS.includes(pos as Position))
        }))
        .filter(item => item.allowedPositions.length > 0)
        .sort((a, b) => a.allowedPositions.length - b.allowedPositions.length)

      // 1. Place Fixed Position Players with backtracking.
      const assignFixedPlayers = (index: number): boolean => {
        if (index >= constrainedPlayers.length) {
          return true
        }

        const { player, allowedPositions } = constrainedPlayers[index]
        const candidatePositions = shuffle(
          allowedPositions.filter(pos => availablePositions.has(pos))
        )

        for (const pos of candidatePositions) {
          assigned[pos] = player
          availablePositions.delete(pos)
          assignedPlayerIds.add(player.id)

          if (assignFixedPlayers(index + 1)) {
            return true
          }

          delete assigned[pos]
          availablePositions.add(pos)
          assignedPlayerIds.delete(player.id)
        }

        return false
      }

      if (!assignFixedPlayers(0)) {
        return null
      }

      // 2. Place Remaining Players (Randomly)
      const remainingPositions = shuffle(Array.from(availablePositions))
      const unassignedPlayers = teamPlayers.filter(
        player => !assignedPlayerIds.has(player.id)
      )
      const shuffledRemaining = shuffle(unassignedPlayers)

      if (remainingPositions.length !== shuffledRemaining.length) {
        return null
      }

      for (let i = 0; i < shuffledRemaining.length; i++) {
        assigned[remainingPositions[i]] = shuffledRemaining[i]
      }

      return assigned as Record<Position, Player>
    }

    const blueResult = assignPositions(teamA)
    const redResult = assignPositions(teamB)

    if (blueResult && redResult) {
      return {
        blue: blueResult,
        red: redResult
      }
    }
  }

  return null // Failed to generate valid teams
}
