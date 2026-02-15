"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  isSameTeamBuilderState,
  safeParseTeamBuilderState,
  TeamBuilderPersistedState,
} from "@/lib/persistence/schemas/teamBuilder";

const SAVE_DEBOUNCE_MS = 250;

interface TeamBuilderDraftRow {
  team_id: string;
  state: unknown;
  updated_at: string;
  updated_by: string;
}

interface UseCollaborativeTeamBuilderDraftResult {
  draftState: TeamBuilderPersistedState | null;
  isReady: boolean;
  remoteVersion: number;
  scheduleSave: (nextState: TeamBuilderPersistedState) => void;
}

function createEmptyDraftState(): TeamBuilderPersistedState {
  return {
    version: 1,
    selectedPlayerIds: [],
    playerConstraints: {},
    groups: {},
    updatedAt: new Date().toISOString(),
  };
}

export function useCollaborativeTeamBuilderDraft(
  teamId?: string
): UseCollaborativeTeamBuilderDraftResult {
  const [draftState, setDraftState] = useState<TeamBuilderPersistedState | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState(0);
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const teamIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<TeamBuilderPersistedState | null>(null);
  const latestServerStateRef = useRef<TeamBuilderPersistedState | null>(null);
  const latestServerUpdatedAtRef = useRef<string | null>(null);

  const applyServerRow = useCallback(
    (
      row: TeamBuilderDraftRow,
      options?: {
        countAsRemoteChange?: boolean;
      }
    ) => {
      const parsedState = safeParseTeamBuilderState(row.state);
      if (!parsedState) {
        return;
      }

      const nextUpdatedAt = Date.parse(row.updated_at);
      if (Number.isNaN(nextUpdatedAt)) {
        return;
      }

      const previousUpdatedAt = latestServerUpdatedAtRef.current;
      const previousUpdatedAtMs = previousUpdatedAt
        ? Date.parse(previousUpdatedAt)
        : Number.NEGATIVE_INFINITY;

      if (nextUpdatedAt < previousUpdatedAtMs) {
        return;
      }

      const previousState = latestServerStateRef.current;
      const hasMeaningfulChange =
        previousUpdatedAt !== row.updated_at ||
        !previousState ||
        !isSameTeamBuilderState(previousState, parsedState);

      latestServerStateRef.current = parsedState;
      latestServerUpdatedAtRef.current = row.updated_at;

      if (hasMeaningfulChange) {
        setDraftState(parsedState);
      }

      if (
        options?.countAsRemoteChange &&
        row.updated_by !== sessionId &&
        hasMeaningfulChange
      ) {
        setRemoteVersion((prev) => prev + 1);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    teamIdRef.current = teamId ?? null;
  }, [teamId]);

  useEffect(() => {
    if (!teamId) {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      pendingSaveRef.current = null;
      latestServerStateRef.current = null;
      latestServerUpdatedAtRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftState(null);
      setRemoteVersion(0);
      setIsReady(false);
      return;
    }

    let isActive = true;
    setIsReady(false);
    setRemoteVersion(0);
    setDraftState(null);
    pendingSaveRef.current = null;
    latestServerStateRef.current = null;
    latestServerUpdatedAtRef.current = null;

    const fetchOrCreateLatest = async (countAsRemoteChange: boolean) => {
      const { data, error } = await supabase
        .from("team_builder_drafts")
        .select("team_id, state, updated_at, updated_by")
        .eq("team_id", teamId)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Failed to fetch team builder draft", error);
        return;
      }

      if (data) {
        applyServerRow(data as TeamBuilderDraftRow, {
          countAsRemoteChange,
        });
        return;
      }

      const initialState = createEmptyDraftState();
      const { data: created, error: createError } = await supabase
        .from("team_builder_drafts")
        .upsert(
          {
            team_id: teamId,
            state: initialState,
            updated_by: sessionId,
          },
          { onConflict: "team_id" }
        )
        .select("team_id, state, updated_at, updated_by")
        .single();

      if (!isActive) {
        return;
      }

      if (createError) {
        console.error("Failed to create team builder draft", createError);
        return;
      }

      applyServerRow(created as TeamBuilderDraftRow, {
        countAsRemoteChange: false,
      });
    };

    const channel = supabase
      .channel(
        `team-builder-draft:${teamId}:${
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
        }`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_builder_drafts",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            return;
          }

          applyServerRow(payload.new as TeamBuilderDraftRow, {
            countAsRemoteChange: true,
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void fetchOrCreateLatest(true);
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            "team_builder_drafts realtime channel degraded (polling disabled for debugging)"
          );
          void fetchOrCreateLatest(true);
        }

        if (status === "CLOSED") {
          void fetchOrCreateLatest(true);
        }
      });

    void fetchOrCreateLatest(false).finally(() => {
      if (isActive) {
        setIsReady(true);
      }
    });

    // Polling fallback intentionally disabled for realtime-only debugging.
    // const resyncInterval = window.setInterval(() => {
    //   if (!isActive) {
    //     return;
    //   }
    //
    //   void fetchOrCreateLatest(true);
    // }, 1000);

    return () => {
      isActive = false;
      // if (resyncInterval) {
      //   window.clearInterval(resyncInterval);
      // }
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [applyServerRow, sessionId, teamId]);

  const scheduleSave = useCallback(
    (nextState: TeamBuilderPersistedState) => {
      pendingSaveRef.current = nextState;

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      if (!teamIdRef.current) {
        return;
      }

      saveTimerRef.current = window.setTimeout(async () => {
        const currentTeamId = teamIdRef.current;
        const pendingState = pendingSaveRef.current;
        if (!currentTeamId || !pendingState) {
          return;
        }

        if (
          latestServerStateRef.current &&
          isSameTeamBuilderState(latestServerStateRef.current, pendingState)
        ) {
          return;
        }

        const payloadState: TeamBuilderPersistedState = {
          ...pendingState,
          updatedAt: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("team_builder_drafts")
          .upsert(
            {
              team_id: currentTeamId,
              state: payloadState,
              updated_by: sessionId,
            },
            { onConflict: "team_id" }
          )
          .select("team_id, state, updated_at, updated_by")
          .single();

        if (error) {
          console.error("Failed to save team builder draft", error);
          return;
        }

        applyServerRow(data as TeamBuilderDraftRow, {
          countAsRemoteChange: false,
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [applyServerRow, sessionId]
  );

  return {
    draftState,
    isReady,
    remoteVersion,
    scheduleSave,
  };
}
