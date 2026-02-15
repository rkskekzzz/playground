'use client'

import { Player, Position } from '@/lib/teamLogic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const POSITIONS: Position[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

interface ConstraintControlsProps {
  selectedPlayers: Player[]
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void
}

export function ConstraintControls({
  selectedPlayers,
  onUpdatePlayer
}: ConstraintControlsProps) {
  const toggleFixedPosition = (player: Player, position: Position) => {
    const selectedPositions = player.selectedPositions ?? []
    const isSelected = selectedPositions.includes(position)

    const nextSelectedPositions = isSelected
      ? selectedPositions.filter(pos => pos !== position)
      : [...selectedPositions, position]

    onUpdatePlayer(player.id, { selectedPositions: nextSelectedPositions })
  }

  return (
    <div className="h-full min-h-0">
      <Card className="bg-zinc-900/30 border-zinc-800 h-full min-h-0 flex flex-col py-0 gap-0">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-medium text-zinc-200">Fixed Positions</CardTitle>
        </CardHeader>
        <div className="relative flex-1 min-h-0">
          <CardContent className="p-0 h-full">
            <div className="h-full overflow-y-auto p-2 space-y-3">
              {selectedPlayers.length === 0 && (
                <p className="text-sm text-zinc-500">Select players to set constraints.</p>
              )}
              {selectedPlayers.map(player => (
                <div key={player.id} className="bg-zinc-950/50 p-3 rounded-md border border-zinc-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300 w-24 truncate">{player.nickname}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`fixed-${player.id}`}
                        checked={player.fixedPosition || false}
                        onCheckedChange={(checked) => onUpdatePlayer(player.id, { fixedPosition: checked })}
                      />
                      <Label htmlFor={`fixed-${player.id}`} className="text-xs text-zinc-500">Fixed</Label>
                    </div>
                  </div>

                  {player.fixedPosition && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-zinc-500">최대 4개 선택</p>
                        <p className="text-[11px] text-zinc-500">{(player.selectedPositions ?? []).length}/4</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {POSITIONS.map((position) => {
                          const selectedPositions = player.selectedPositions ?? []
                          const isSelected = selectedPositions.includes(position)
                          const isAtLimit = selectedPositions.length >= 4 && !isSelected

                          return (
                            <Button
                              key={position}
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isAtLimit}
                              onClick={() => toggleFixedPosition(player, position)}
                              aria-pressed={isSelected}
                              className={`h-8 text-xs ${
                                isSelected
                                  ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35 ring-2 ring-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.55)]'
                                  : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              {position}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-zinc-900/95 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-900/95 to-transparent"
          />
        </div>
      </Card>
    </div>
  )
}
