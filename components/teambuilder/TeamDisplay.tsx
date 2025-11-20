
'use client'

import { TeamResult, Position, Player } from '@/lib/teamLogic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw, Trophy } from 'lucide-react'
import { toast } from 'sonner'

interface TeamDisplayProps {
  result: TeamResult | null
  onRecordWin: (team: 'BLUE' | 'RED') => void
}

const POSITIONS: Position[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

export function TeamDisplay({ result, onRecordWin }: TeamDisplayProps) {
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <p className="text-zinc-500">Select 10 players and generate teams</p>
      </div>
    )
  }

  const copyToClipboard = () => {
    const text = `
[BLUE TEAM]
TOP: ${result.blue.TOP?.nickname}
JG: ${result.blue.JUNGLE?.nickname}
MID: ${result.blue.MID?.nickname}
ADC: ${result.blue.ADC?.nickname}
SUP: ${result.blue.SUPPORT?.nickname}

[RED TEAM]
TOP: ${result.red.TOP?.nickname}
JG: ${result.red.JUNGLE?.nickname}
MID: ${result.red.MID?.nickname}
ADC: ${result.red.ADC?.nickname}
SUP: ${result.red.SUPPORT?.nickname}
    `.trim()

    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const TeamCard = ({ team, side }: { team: Record<Position, Player | null>, side: 'BLUE' | 'RED' }) => (
    <Card className={`border-t-4 ${side === 'BLUE' ? 'border-t-blue-500' : 'border-t-red-500'} bg-zinc-900/50`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className={side === 'BLUE' ? 'text-blue-400' : 'text-red-400'}>
          {side} TEAM
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          className={`hover:bg-${side === 'BLUE' ? 'blue' : 'red'}-950/30 ${side === 'BLUE' ? 'hover:text-blue-400' : 'hover:text-red-400'}`}
          onClick={() => onRecordWin(side)}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Win
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {POSITIONS.map(pos => (
          <div key={pos} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
            <span className="text-xs font-bold text-zinc-500 w-12">{pos}</span>
            <span className="font-medium text-zinc-200">{team[pos]?.nickname || '-'}</span>
            <span className="text-xs text-zinc-600 w-20 text-right truncate">{team[pos]?.lol_id}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamCard team={result.blue} side="BLUE" />
        <TeamCard team={result.red} side="RED" />
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={copyToClipboard} className="w-full md:w-auto">
          <Copy className="w-4 h-4 mr-2" />
          Copy Result
        </Button>
      </div>
    </div>
  )
}
