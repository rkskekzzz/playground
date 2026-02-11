"use client";

import { Game, GameParticipant } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface GameWithDetails extends Game {
  participants: (GameParticipant & {
    member: { nickname: string; lol_id: string };
  })[];
}

interface GameCardProps {
  game: GameWithDetails;
  onDeleted: (gameId: string) => void;
}

const POSITIONS = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

export function GameCard({ game, onDeleted }: GameCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const blueTeam = game.participants.filter((p) => p.team === "BLUE");
  const redTeam = game.participants.filter((p) => p.team === "RED");

  const getPlayer = (team: typeof blueTeam, pos: string) =>
    team.find((p) => p.position === pos);

  const handleCopyId = () => {
    navigator.clipboard.writeText(game.id);
    toast.success("Game ID copied to clipboard!");
  };

  const handleDeleteGame = async () => {
    setIsDeleting(true);

    const { error } = await supabase.from("games").delete().eq("id", game.id);

    setIsDeleting(false);

    if (error) {
      toast.error("Failed to delete game history");
      return;
    }

    setIsDeleteModalOpen(false);
    onDeleted(game.id);
    toast.success("Game history deleted");
  };

  return (
    <Card
      className="bg-zinc-900/30 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors cursor-pointer p-0 w-full"
      onClick={handleCopyId}
    >
      <div className="flex">
        {/* Left Winner Indicator */}
        <div
          className={`w-2 md:w-30 shrink-0 flex items-center justify-center ${
            game.winning_team === "BLUE" ? "bg-blue-500" : "bg-red-500"
          }`}
        >
          <div className="hidden md:flex items-center gap-2">
            <Trophy className={`w-4 h-4 text-white`} />
            <span className={`text-sm font-semibold text-white`}>
              {game.winning_team} WIN
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3">
          <div className="mb-2 flex justify-end md:hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
              onClick={(event) => {
                event.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Delete history</span>
            </Button>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Blue Team */}
            <div
              className={`rounded-md p-2 ${
                game.winning_team === "BLUE"
                  ? "bg-blue-950/20"
                  : "bg-zinc-950/30"
              }`}
            >
              <div className="text-xs font-semibold text-blue-400 mb-1.5">
                BLUE
              </div>
              <div className="space-y-1">
                {POSITIONS.map((pos) => {
                  const p = getPlayer(blueTeam, pos);
                  return (
                    <div key={pos} className="flex items-center gap-2 text-xs">
                      <span className="w-10 font-bold text-zinc-600">
                        {pos.slice(0, 3)}
                      </span>
                      <span className="text-zinc-300 truncate">
                        {p?.member?.nickname || "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Red Team */}
            <div
              className={`rounded-md p-2 ${
                game.winning_team === "RED" ? "bg-red-950/20" : "bg-zinc-950/30"
              }`}
            >
              <div className="text-xs font-semibold text-red-400 mb-1.5">
                RED
              </div>
              <div className="space-y-1">
                {POSITIONS.map((pos) => {
                  const p = getPlayer(redTeam, pos);
                  return (
                    <div key={pos} className="flex items-center gap-2 text-xs">
                      <span className="w-10 font-bold text-zinc-600">
                        {pos.slice(0, 3)}
                      </span>
                      <span className="text-zinc-300 truncate">
                        {p?.member?.nickname || "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Timestamp - Hidden on mobile */}
        <div className="hidden md:flex w-32 shrink-0 flex-col items-center justify-center bg-zinc-800/30 p-2 gap-1">
          <span className="text-xs text-zinc-400">
            {formatDistanceToNow(new Date(game.played_at), { addSuffix: true })}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
            #{game.id.slice(0, 8)}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="mt-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
            onClick={(event) => {
              event.stopPropagation();
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">Delete history</span>
          </Button>
        </div>
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete this game history?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected game result will be
              removed permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGame}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
