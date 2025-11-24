"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/context/TeamContext";

const formSchema = z.object({
  nickname: z.string().min(1, "Nickname is required"),
  lol_id: z.string().min(1, "LoL ID is required"),
  main_position: z.enum(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddMemberFormProps {
  onMemberAdded: () => void;
}

export function AddMemberForm({ onMemberAdded }: AddMemberFormProps) {
  const { currentTeam } = useTeam();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (!currentTeam) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("members").insert([
        {
          team_id: currentTeam.id,
          nickname: data.nickname,
          lol_id: data.lol_id,
          main_position: data.main_position || null,
        },
      ]);

      if (error) throw error;

      toast.success("Member added successfully!");
      reset();
      onMemberAdded();
    } catch (error: any) {
      toast.error("Failed to add member: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="e.g. Faker"
                {...register("nickname")}
              />
              {errors.nickname && (
                <p className="text-sm text-red-500">
                  {errors.nickname.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lol_id">LoL ID</Label>
              <Input
                id="lol_id"
                placeholder="e.g. Hide on bush#KR1"
                {...register("lol_id")}
              />
              {errors.lol_id && (
                <p className="text-sm text-red-500">{errors.lol_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Main Position (Optional)</Label>
              <Select
                onValueChange={(val: any) => setValue("main_position", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOP">Top</SelectItem>
                  <SelectItem value="JUNGLE">Jungle</SelectItem>
                  <SelectItem value="MID">Mid</SelectItem>
                  <SelectItem value="ADC">ADC</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? "Adding..." : "Add Member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
