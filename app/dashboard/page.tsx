"use client";

import { AddMemberForm } from "@/components/members/AddMemberForm";
import { MemberList } from "@/components/members/MemberList";
import { GameHistory } from "@/components/game/GameHistory";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          Member Management
        </h1>
        <p className="text-zinc-400 text-sm md:text-base">
          Add and manage your scrim members here.
        </p>
      </div>

      <AddMemberForm />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Member List</h2>
        <MemberList />
      </div>

      <div className="space-y-4 pt-8 border-t border-zinc-800">
        <h2 className="text-xl font-semibold">Recent Games</h2>
        <GameHistory />
      </div>
    </div>
  );
}
