'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Member } from '@/types'

const formSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required'),
  lol_id: z.string().min(1, 'LoL ID is required'),
  main_position: z.enum(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']).optional(),
})

type FormData = z.infer<typeof formSchema>
type PositionOption = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

interface EditMemberModalProps {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberUpdated: () => void
}

export function EditMemberModal({ member, open, onOpenChange, onMemberUpdated }: EditMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    if (member) {
      setValue('nickname', member.nickname)
      setValue('lol_id', member.lol_id)
      if (member.main_position) {
        setValue('main_position', member.main_position)
      } else {
        setValue('main_position', undefined)
      }
    }
  }, [member, setValue])

  const onSubmit = async (data: FormData) => {
    if (!member) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({
          nickname: data.nickname,
          lol_id: data.lol_id,
          main_position: data.main_position || null,
        })
        .eq('id', member.id)

      if (error) throw error

      toast.success('Member updated successfully!')
      onMemberUpdated()
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error('Failed to update member: ' + getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              placeholder="e.g. Faker"
              {...register('nickname')}
            />
            {errors.nickname && (
              <p className="text-sm text-red-500">{errors.nickname.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lol_id">LoL ID</Label>
            <Input
              id="lol_id"
              placeholder="e.g. Hide on bush#KR1"
              {...register('lol_id')}
            />
            {errors.lol_id && (
              <p className="text-sm text-red-500">{errors.lol_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Main Position (Optional)</Label>
            <Select
              onValueChange={(val: PositionOption) => setValue('main_position', val)}
              defaultValue={member?.main_position || undefined}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
