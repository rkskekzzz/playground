"use client";

import { useState } from "react";
import { Player } from "@/lib/teamLogic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, Plus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ConstraintControlsMobileProps {
  selectedPlayers: Player[];
  groups: { [key: string]: string[] };
  onCreateGroup: (memberIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
}

export function ConstraintControlsMobile({
  selectedPlayers,
  groups,
  onCreateGroup,
  onDeleteGroup,
}: ConstraintControlsMobileProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupSelection, setGroupSelection] = useState<string[]>([]);

  // Helper to find available players for grouping
  const groupedPlayerIds = Object.values(groups).flat();
  const availableForGroup = selectedPlayers.filter(
    (p) => !groupedPlayerIds.includes(p.id)
  );

  const handleCreateGroup = () => {
    if (groupSelection.length < 2) {
      toast.error("Select at least 2 players for a group");
      return;
    }
    if (groupSelection.length > 5) {
      toast.error("Max 5 players per group");
      return;
    }
    onCreateGroup(groupSelection);
    setGroupSelection([]);
    setIsDialogOpen(false);
  };

  const toggleGroupSelection = (id: string) => {
    setGroupSelection((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const groupCount = Object.keys(groups).length;
  const groupsInfo = groupCount > 0 ? `${groupCount}개의 그룹` : "그룹 없음";

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LinkIcon size={18} className="text-zinc-400" />
          <h3 className="font-semibold text-zinc-200">Pre-made Groups</h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Plus className="w-3 h-3 mr-2" />
              Add
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
                  <p className="text-zinc-500 text-center py-4">
                    No available players to group.
                  </p>
                ) : (
                  availableForGroup.map((p) => (
                    <div
                      key={p.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border cursor-pointer
                        ${
                          groupSelection.includes(p.id)
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-800 hover:bg-zinc-800"
                        }
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
              <Button
                onClick={handleCreateGroup}
                disabled={groupSelection.length < 2}
              >
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-zinc-400 mb-3">{groupsInfo}</p>

      <div className="space-y-2">
        {Object.entries(groups).map(([groupId, memberIds]) => (
          <div
            key={groupId}
            className="bg-blue-950/20 border border-blue-500/20 p-3 rounded-lg relative group"
          >
            <button
              onClick={() => onDeleteGroup(groupId)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-red-400"
            >
              <X size={14} />
            </button>
            <div className="flex flex-wrap gap-2">
              {memberIds.map((id) => {
                const p = selectedPlayers.find((sp) => sp.id === id);
                return p ? (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                  >
                    {p.nickname}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
