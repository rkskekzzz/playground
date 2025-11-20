
export type Member = {
  id: string
  nickname: string
  lol_id: string
  main_position?: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' | null
  created_at: string
}

export type Game = {
  id: string
  played_at: string
  winning_team: 'BLUE' | 'RED'
}

export type GameParticipant = {
  id: string
  game_id: string
  member_id: string
  team: 'BLUE' | 'RED'
  position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  member?: Member // Joined
}
