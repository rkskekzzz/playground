"use client";

import { useMemo, useState } from "react";
import { Member } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Search, Users } from "lucide-react";

interface PlayerPoolMobileProps {
  members: Member[];
  selectedIds: string[];
  onToggle: (member: Member) => void;
}

export function PlayerPoolMobile({
  members,
  selectedIds,
  onToggle,
}: PlayerPoolMobileProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredMembers = useMemo(
    () =>
      [...members]
        .sort((a, b) => a.nickname.localeCompare(b.nickname))
        .filter(
          (member) =>
            member.nickname.toLowerCase().includes(search.toLowerCase()) ||
            member.lol_id.toLowerCase().includes(search.toLowerCase())
        ),
    [members, search]
  );

  const selectedMembers = useMemo(
    () => members.filter((member) => selectedIds.includes(member.id)),
    [members, selectedIds]
  );
  const selectedNames =
    selectedMembers.length > 0
      ? selectedMembers.map((m) => m.nickname).join(", ")
      : "플레이어를 선택하세요";

  return (
    <>
      {/* Trigger Card */}
      <div
        onClick={() => setIsOpen(true)}
        className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-zinc-400" />
            <h3 className="font-semibold text-zinc-200">Player Pool</h3>
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
            {selectedIds.length} / 10
          </span>
        </div>
        <p className="text-sm text-zinc-400 truncate">{selectedNames}</p>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title={`Player Pool (${selectedIds.length}/10)`}
      >
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search players..."
              className="pl-10 bg-zinc-950/50 border-zinc-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Player List */}
          <div className="space-y-2">
            {filteredMembers.map((member) => {
              const isSelected = selectedIds.includes(member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => onToggle(member)}
                  className={`
                    flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all border
                    ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-zinc-950/50 border-zinc-800 hover:bg-zinc-800/50"
                    }
                  `}
                >
                  <div className="flex flex-col">
                    <span
                      className={`font-medium ${
                        isSelected ? "text-blue-400" : "text-zinc-300"
                      }`}
                    >
                      {member.nickname}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {member.lol_id}
                    </span>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    className={
                      isSelected
                        ? "border-blue-500 data-[state=checked]:bg-blue-500"
                        : "border-zinc-700"
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
