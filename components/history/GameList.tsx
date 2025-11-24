
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { GameCard } from './GameCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import { useTeam } from '@/context/TeamContext'

// Type definition for the joined query result
type GameData = {
  id: string
  played_at: string
  winning_team: 'BLUE' | 'RED'
  game_participants: {
    id: string
    team: 'BLUE' | 'RED'
    position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
    member: {
      nickname: string
      lol_id: string
    }
  }[]
}

const PAGE_SIZE = 30

export function GameList() {
  const { currentTeam } = useTeam()
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const observer = useRef<IntersectionObserver | null>(null)
  const lastGameElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore])

  const fetchGames = async (pageIndex: number) => {
    if (!currentTeam) return
    setLoading(true)
    const from = pageIndex * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        game_participants (
          id,
          team,
          position,
          member:members (
            nickname,
            lol_id
          )
        )
      `)
      .eq('team_id', currentTeam.id)
      .order('played_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching games:', error)
    } else {
      if (data.length < PAGE_SIZE) {
        setHasMore(false)
      }

      // Transform data to match GameCard props structure if needed
      // The query structure matches closely, just need to map game_participants to participants
      const formattedData = data.map(g => ({
        ...g,
        participants: g.game_participants
      }))

      setGames(prev => pageIndex === 0 ? formattedData : [...prev, ...formattedData])
    }
    setLoading(false)
  }

  useEffect(() => {
    setPage(0)
    setGames([])
    setHasMore(true)
  }, [currentTeam])

  useEffect(() => {
    fetchGames(page)
  }, [page, currentTeam])

  return (
    <ScrollArea className="h-full w-full rounded-md border border-zinc-800 bg-zinc-950/30">
      <div className="p-4 space-y-4 mx-auto">
        {games.map((game, index) => {
          if (games.length === index + 1) {
            return (
              <div ref={lastGameElementRef} key={game.id}>
                <GameCard game={game} />
              </div>
            )
          } else {
            return <GameCard key={game.id} game={game} />
          }
        })}

        {loading && (
          <div className="py-4 flex justify-center text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {!hasMore && games.length > 0 && (
          <div className="py-4 text-center text-zinc-500 text-sm">
            No more games to load.
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="py-12 text-center text-zinc-500">
            No games recorded yet. Go play some matches!
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
