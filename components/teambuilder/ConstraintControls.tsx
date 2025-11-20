'use client'

import { useState } from 'react'
import { Player, Position } from '@/lib/teamLogic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { X, Link as LinkIcon, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface ConstraintControlsProps {
  selectedPlayers: Player[]
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void
  groups: { [key: string]: string[] }
  onCreateGroup: (memberIds: string[]) => void
  onDeleteGroup: (groupId: string) => void
}

export function ConstraintControls({
  selectedPlayers,
  onUpdatePlayer,
  groups,
  onCreateGroup,
  onDeleteGroup
}: ConstraintControlsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [groupSelection, setGroupSelection] = useState<string[]>([])

  // Helper to find available players for grouping
  const groupedPlayerIds = Object.values(groups).flat()
  const availableForGroup = selectedPlayers.filter(p => !groupedPlayerIds.includes(p.id))

  const handleCreateGroup = () => {
    if (groupSelection.length < 2) {
      toast.error("Select at least 2 players for a group")
      return
    }
    if (groupSelection.length > 5) {
      toast.error("Max 5 players per group")
      return
    }
    onCreateGroup(groupSelection)
    setGroupSelection([])
    setIsDialogOpen(false)
  }

  const toggleGroupSelection = (id: string) => {
    setGroupSelection(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Fixed Positions Section */}
      <Card className="bg-zinc-900/30 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-zinc-200">Fixed Positions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedPlayers.length === 0 && (
            <p className="text-sm text-zinc-500">Select players to set constraints.</p>
          )}
          {selectedPlayers.map(player => (
            <div key={player.id} className="flex items-center justify-between bg-zinc-950/50 p-2 rounded-md border border-zinc-800/50">
              <span className="text-sm font-medium text-zinc-300 w-24 truncate">{player.nickname}</span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`fixed-${player.id}`}
                    checked={player.fixedPosition || false}
                    onCheckedChange={(checked) => onUpdatePlayer(player.id, { fixedPosition: checked })}
                  />
                  <Label htmlFor={`fixed-${player.id}`} className="text-xs text-zinc-500">Fixed</Label>
                </div>

                <Select
                  value={player.selectedPosition || ''}
                  onValueChange={(val) => onUpdatePlayer(player.id, { selectedPosition: val as Position })}
                  disabled={!player.fixedPosition}
                >
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="Pos" />
                  </SelectTrigger>
                  <SelectContent>
                    {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Groups Section */}
      <Card className="bg-zinc-900/30 border-zinc-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-zinc-200">Pre-made Groups</CardTitle>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Plus className="w-3 h-3 mr-2" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-zinc-400 mb-4">
                  Select players who must be on the same team (2-5 players).
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableForGroup.length === 0 ? (
                    <p className="text-zinc-500 text-center py-4">No available players to group.</p>
                  ) : (
                    availableForGroup.map(p => (
                      <div
                        key={p.id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border cursor-pointer
                          ${groupSelection.includes(p.id) ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:bg-zinc-800'}
                        `}
                        onClick={() => toggleGroupSelection(p.id)}
                      >
                        <span className="text-zinc-200">{p.nickname}</span>
                        <Checkbox checked={groupSelection.includes(p.id)} />
                      </div>
                    ))
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGroup} disabled={groupSelection.length < 2}>
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(groups).map(([groupId, memberIds]) => (
            <div key={groupId} className="bg-blue-950/20 border border-blue-500/20 p-3 rounded-lg relative group">
              <button
                onClick={() => onDeleteGroup(groupId)}
                className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
              <div className="flex flex-wrap gap-2">
                {memberIds.map(id => {
                  const p = selectedPlayers.find(sp => sp.id === id)
                  return p ? (
                    <Badge key={id} variant="secondary" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">
                      {p.nickname}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          ))}
          {Object.keys(groups).length === 0 && (
            <p className="text-sm text-zinc-500">No groups created.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
