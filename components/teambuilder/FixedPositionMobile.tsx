"use client";

import { useState } from "react";
import { Player, Position } from "@/lib/teamLogic";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

const POSITIONS: Position[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

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
          .map((p) => {
            const selectedPositions = p.selectedPositions ?? [];
            const label =
              selectedPositions.length > 0
                ? selectedPositions.join("/")
                : "미지정";
            return `${p.nickname} (${label})`;
          })
          .join(", ")
      : "고정 포지션 없음";

  const toggleFixedPosition = (player: Player, position: Position) => {
    const selectedPositions = player.selectedPositions ?? [];
    const isSelected = selectedPositions.includes(position);

    const nextSelectedPositions = isSelected
      ? selectedPositions.filter((pos) => pos !== position)
      : [...selectedPositions, position];

    onUpdatePlayer(player.id, { selectedPositions: nextSelectedPositions });
  };

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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500">최대 4개 선택</p>
                      <p className="text-[11px] text-zinc-500">
                        {(player.selectedPositions ?? []).length}/4
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {POSITIONS.map((position) => {
                        const selectedPositions = player.selectedPositions ?? [];
                        const isSelected = selectedPositions.includes(position);
                        const isAtLimit =
                          selectedPositions.length >= 4 && !isSelected;

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
                                ? "border-emerald-400 bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35 ring-2 ring-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.55)]"
                                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            }`}
                          >
                            {position}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </BottomSheet>
    </>
  );
}
