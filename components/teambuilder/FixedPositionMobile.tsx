"use client";

import { useState } from "react";
import { Player, Position } from "@/lib/teamLogic";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface FixedPositionMobileProps {
  selectedPlayers: Player[];
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
}

export function FixedPositionMobile({
  selectedPlayers,
  onUpdatePlayer,
}: FixedPositionMobileProps) {
  const [isOpen, setIsOpen] = useState(false);

  const fixedPlayers = selectedPlayers.filter((p) => p.fixedPosition);
  const fixedInfo =
    fixedPlayers.length > 0
      ? fixedPlayers
          .map((p) => `${p.nickname} (${p.selectedPosition})`)
          .join(", ")
      : "고정 포지션 없음";

  return (
    <>
      {/* Trigger Card */}
      <div
        onClick={() => setIsOpen(true)}
        className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-zinc-400" />
            <h3 className="font-semibold text-zinc-200">Fixed Positions</h3>
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
            {fixedPlayers.length}
          </span>
        </div>
        <p className="text-sm text-zinc-400 truncate">{fixedInfo}</p>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Fixed Positions"
      >
        <div className="p-4 space-y-3">
          {selectedPlayers.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">
              플레이어를 먼저 선택하세요.
            </p>
          ) : (
            selectedPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-zinc-300">
                    {player.nickname}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`fixed-mobile-${player.id}`}
                      checked={player.fixedPosition || false}
                      onCheckedChange={(checked) =>
                        onUpdatePlayer(player.id, { fixedPosition: checked })
                      }
                    />
                    <Label
                      htmlFor={`fixed-mobile-${player.id}`}
                      className="text-xs text-zinc-500"
                    >
                      Fixed
                    </Label>
                  </div>
                </div>

                {player.fixedPosition && (
                  <Select
                    value={player.selectedPosition || ""}
                    onValueChange={(val) =>
                      onUpdatePlayer(player.id, {
                        selectedPosition: val as Position,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Position" />
                    </SelectTrigger>
                    <SelectContent>
                      {["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"].map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))
          )}
        </div>
      </BottomSheet>
    </>
  );
}
