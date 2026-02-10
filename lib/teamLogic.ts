
import { Member } from '@/types'

export type Position = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'

export interface Player extends Member {
  selectedPosition?: Position
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

  // 2. Separate players by constraints
  const fixedPlayers = players.filter(p => p.fixedPosition && p.selectedPosition)

  // 3. Initialize Teams
  // We'll try to fill slots.
  // Strategy:
  // - Assign fixed players first.
  // - Handle groups: Treat a group as a single unit.
  // - Randomly assign remaining players to remaining slots.

  // Since this is a constrained CSP (Constraint Satisfaction Problem), simple randomization might fail.
  // We'll try a few random attempts (Monte Carlo) because N=10 is small.

  const MAX_ATTEMPTS = 1000

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // A. Assign Fixed Players
    for (const p of fixedPlayers) {
      // Randomly assign to Blue or Red if not already taken?
      // Wait, "Fixed Position" usually means "I want to play MID". It doesn't mean "I want to play Blue MID".
      // So we need to find a side for them.

      // If two players want Fixed MID, one goes Blue, one goes Red.
      // If three players want Fixed MID, impossible -> Fail.

      // Let's track assigned fixed players
    }

    // Actually, a simpler approach for N=10:
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
    let currentB = 0

    for (const unit of shuffledUnits) {
      if (currentA + unit.length <= 5) {
        teamA.push(...unit)
        currentA += unit.length
      } else {
        teamB.push(...unit)
        currentB += unit.length
      }
    }

    if (teamA.length !== 5 || teamB.length !== 5) {
      continue // Retry partition
    }

    // Step 2: Assign Positions within Teams
    const assignPositions = (teamPlayers: Player[]): Record<Position, Player> | null => {
      const positions: Position[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
      const assigned: Partial<Record<Position, Player>> = {}
      const unassignedPlayers: Player[] = []
      const availablePositions = new Set(positions)

      // 1. Place Fixed Position Players
      for (const p of teamPlayers) {
        if (p.fixedPosition && p.selectedPosition) {
          if (availablePositions.has(p.selectedPosition)) {
            assigned[p.selectedPosition] = p
            availablePositions.delete(p.selectedPosition)
          } else {
            return null // Conflict: Two fixed players for same position in same team
          }
        } else {
          unassignedPlayers.push(p)
        }
      }

      // 2. Place Remaining Players (Randomly)
      const remainingPositions = Array.from(availablePositions)
      const shuffledRemaining = shuffle(unassignedPlayers)

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
