import { create } from 'zustand'
import type { SleeperDraft, SleeperLeague, SleeperPick, SleeperUser } from '@/types/sleeper'
import type { RankedPlayer } from '@/types/player'
import type { PositionFilter } from '@/types/draft'

type SetupStep = 'username' | 'league' | 'draft' | 'rankings' | 'tracking'

interface DraftStore {
  // Setup
  step: SetupStep
  user: SleeperUser | null
  leagues: SleeperLeague[]
  selectedLeague: SleeperLeague | null
  drafts: SleeperDraft[]
  selectedDraft: SleeperDraft | null

  // Rankings
  rankings: RankedPlayer[]
  rawPicks: SleeperPick[]

  // Filters
  positionFilter: PositionFilter
  showDrafted: boolean
  searchQuery: string

  // Polling status
  lastUpdated: Date | null
  pollError: string | null

  // Actions
  setStep: (step: SetupStep) => void
  setUser: (user: SleeperUser) => void
  setLeagues: (leagues: SleeperLeague[]) => void
  setSelectedLeague: (league: SleeperLeague) => void
  setDrafts: (drafts: SleeperDraft[]) => void
  setSelectedDraft: (draft: SleeperDraft) => void
  setRankings: (rankings: RankedPlayer[]) => void
  setRawPicks: (picks: SleeperPick[]) => void
  setPositionFilter: (pos: PositionFilter) => void
  setShowDrafted: (show: boolean) => void
  setSearchQuery: (q: string) => void
  setLastUpdated: (date: Date) => void
  setPollError: (err: string | null) => void
  reset: () => void
}

const initialState = {
  step: 'username' as SetupStep,
  user: null,
  leagues: [],
  selectedLeague: null,
  drafts: [],
  selectedDraft: null,
  rankings: [],
  rawPicks: [],
  positionFilter: 'ALL' as PositionFilter,
  showDrafted: false,
  searchQuery: '',
  lastUpdated: null,
  pollError: null,
}

export const useDraftStore = create<DraftStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setUser: (user) => set({ user }),
  setLeagues: (leagues) => set({ leagues }),
  setSelectedLeague: (selectedLeague) => set({ selectedLeague }),
  setDrafts: (drafts) => set({ drafts }),
  setSelectedDraft: (selectedDraft) => set({ selectedDraft }),
  setRankings: (rankings) => set({ rankings }),
  setRawPicks: (rawPicks) => set({ rawPicks }),
  setPositionFilter: (positionFilter) => set({ positionFilter }),
  setShowDrafted: (showDrafted) => set({ showDrafted }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
  setPollError: (pollError) => set({ pollError }),
  reset: () => set(initialState),
}))
