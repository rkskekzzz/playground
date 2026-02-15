"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Member } from "@/types";

interface UseTeamMembersRealtimeResult {
  members: Member[];
  isLoading: boolean;
}

function isSameMembers(a: Member[], b: Member[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((member, index) => {
    const other = b[index];
    if (!other) {
      return false;
    }

    return (
      member.id === other.id &&
      member.nickname === other.nickname &&
      member.lol_id === other.lol_id &&
      member.main_position === other.main_position &&
      member.created_at === other.created_at
    );
  });
}

function upsertMember(members: Member[], nextMember: Member): Member[] {
  const nextMembers = members.filter((member) => member.id !== nextMember.id);
  nextMembers.unshift(nextMember);

  return nextMembers.sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return bTime - aTime;
  });
}

export function useTeamMembersRealtime(
  teamId?: string
): UseTeamMembersRealtimeResult {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!teamId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMembers([]);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Failed to fetch team members", error);
        setMembers([]);
      } else {
        const nextMembers = (data ?? []) as Member[];
        setMembers((prev) => (isSameMembers(prev, nextMembers) ? prev : nextMembers));
      }

      setIsLoading(false);
    };

    void fetchMembers();

    const channel = supabase
      .channel(
        `team-members:${teamId}:${
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
        }`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "members",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const insertedMember = payload.new as Member;
          setMembers((prev) => upsertMember(prev, insertedMember));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "members",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const updatedMember = payload.new as Member;
          setMembers((prev) => upsertMember(prev, updatedMember));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "members",
        },
        (payload) => {
          const deletedMemberId = (payload.old as { id?: string }).id;
          if (!deletedMemberId) {
            return;
          }

          setMembers((prev) =>
            prev.filter((member) => member.id !== deletedMemberId)
          );
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            "members realtime channel degraded (polling disabled for debugging)"
          );
        }
      });

    // Polling fallback intentionally disabled for realtime-only debugging.
    // const resyncInterval = window.setInterval(() => {
    //   if (!isActive) {
    //     return;
    //   }
    //
    //   void fetchMembers();
    // }, 1000);

    return () => {
      isActive = false;
      // if (resyncInterval) {
      //   window.clearInterval(resyncInterval);
      // }
      void supabase.removeChannel(channel);
    };
  }, [teamId]);

  return { members, isLoading };
}
