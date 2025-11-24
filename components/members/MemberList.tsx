"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Member } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EditMemberModal } from "./EditMemberModal";
import { useTeam } from "@/context/TeamContext";

interface MemberListProps {
  refreshTrigger: number;
}

export function MemberList({ refreshTrigger }: MemberListProps) {
  const { currentTeam } = useTeam();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchMembers = async () => {
    if (!currentTeam) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("team_id", currentTeam.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch members");
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger, currentTeam]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete member");
    } else {
      toast.success("Member deleted");
      fetchMembers();
    }
  };

  if (loading)
    return (
      <div className="text-center p-4 text-zinc-400">Loading members...</div>
    );

  return (
    <div className="rounded-md border border-zinc-800 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
            <TableHead className="text-zinc-400">Nickname</TableHead>
            <TableHead className="text-zinc-400">LoL ID</TableHead>
            <TableHead className="text-zinc-400">Main Position</TableHead>
            <TableHead className="text-right text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24 text-zinc-500">
                No members found. Add some!
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow
                key={member.id}
                className="border-zinc-800 hover:bg-zinc-900/50"
              >
                <TableCell className="font-medium text-zinc-200">
                  {member.nickname}
                </TableCell>
                <TableCell className="text-zinc-400">{member.lol_id}</TableCell>
                <TableCell className="text-zinc-400">
                  {member.main_position || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingMember(member);
                        setIsEditModalOpen(true);
                      }}
                      className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <EditMemberModal
        member={editingMember}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onMemberUpdated={fetchMembers}
      />
    </div>
  );
}
