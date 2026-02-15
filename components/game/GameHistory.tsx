
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Game } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { useTeam } from '@/context/TeamContext'

export function GameHistory() {
  const { currentTeam } = useTeam()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentTeam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGames([])
      setLoading(false)
      return
    }

    const fetchGames = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', currentTeam.id)
        .order('played_at', { ascending: false })
        .limit(10)

      if (data) setGames(data)
      setLoading(false)
    }
    fetchGames()
  }, [currentTeam])

  if (loading) return <div className="text-zinc-500">Loading history...</div>

  return (
    <div className="rounded-md border border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
            <TableHead className="text-zinc-400">Date</TableHead>
            <TableHead className="text-zinc-400">Winner</TableHead>
            <TableHead className="text-zinc-400">ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center h-24 text-zinc-500">
                No games recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            games.map((game) => (
              <TableRow key={game.id} className="border-zinc-800 hover:bg-zinc-900/50">
                <TableCell className="text-zinc-300">
                  {formatDistanceToNow(new Date(game.played_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      game.winning_team === 'BLUE'
                        ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                        : 'border-red-500 text-red-400 bg-red-950/20'
                    }
                  >
                    {game.winning_team} WIN
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-600 font-mono text-xs">
                  {game.id.slice(0, 8)}...
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
