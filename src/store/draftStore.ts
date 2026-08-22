import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { SleeperDraft, SleeperLeague, SleeperPick, SleeperUser } from '@/types/sleeper'
import type { RankedPlayer } from '@/types/player'
import type { PositionFilter } from '@/types/draft'

type SetupStep = 'username' | 'league' | 'draft' | 'rankings' | 'tracking'

const VALID_STEPS: SetupStep[] = ['username', 'league', 'draft', 'rankings', 'tracking']

/**
 * localStorage can throw on ANY call: quota exceeded, Safari private mode,
 * blocked site data. Persistence is best-effort — a storage failure must never
 * break a state update mid-draft.
 */
const safeStorage = {
  getItem(name: string): string | null {
    try {
      return window.localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem(name: string, value: string): void {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // full or blocked — keep running unpersisted
    }
  },
  removeItem(name: string): void {
    try {
      window.localStorage.removeItem(name)
    } catch {
      // ignore
    }
  },
}

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

  /** Sleeper user_id → display/team name for the active league */
  managerNames: Record<string, string>

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
  setManagerNames: (names: Record<string, string>) => void
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
  managerNames: {},
  positionFilter: 'ALL' as PositionFilter,
  showDrafted: false,
  searchQuery: '',
  lastUpdated: null,
  pollError: null,
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),
      setUser: (user) => set({ user }),
      setLeagues: (leagues) => set({ leagues }),
      setSelectedLeague: (selectedLeague) => set({ selectedLeague }),
      setDrafts: (drafts) => set({ drafts }),
      setSelectedDraft: (selectedDraft) => set({ selectedDraft }),
      setRankings: (rankings) => set({ rankings }),
      setRawPicks: (rawPicks) => set({ rawPicks }),
      setManagerNames: (managerNames) => set({ managerNames }),
      setPositionFilter: (positionFilter) => set({ positionFilter }),
      setShowDrafted: (showDrafted) => set({ showDrafted }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setLastUpdated: (lastUpdated) => set({ lastUpdated }),
      setPollError: (pollError) => set({ pollError }),
      reset: () => set(initialState),
    }),
    {
      name: 'zonk_draft_store',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Keep older persisted state on version bumps; `merge` below validates it
      migrate: (persisted) => persisted,
      // Only persist meaningful state — skip transient UI and re-fetchable list data
      partialize: (state) => ({
        step: state.step,
        user: state.user,
        selectedLeague: state.selectedLeague,
        selectedDraft: state.selectedDraft,
        rankings: state.rankings,
        rawPicks: state.rawPicks,
        positionFilter: state.positionFilter,
        showDrafted: state.showDrafted,
      }),
      // Never trust persisted state: it may come from an older app version or
      // be corrupted. A bad value here must not be able to brick the app.
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) {
          return current
        }
        const p = persisted as Partial<DraftStore>
        const state: DraftStore = {
          ...current,
          ...p,
          user: p.user && typeof p.user === 'object' ? p.user : null,
          selectedLeague:
            p.selectedLeague && typeof p.selectedLeague === 'object' ? p.selectedLeague : null,
          selectedDraft:
            p.selectedDraft && typeof p.selectedDraft === 'object' && p.selectedDraft.draft_id
              ? p.selectedDraft
              : null,
          rankings: Array.isArray(p.rankings) ? p.rankings : [],
          rawPicks: Array.isArray(p.rawPicks) ? p.rawPicks : [],
          step: VALID_STEPS.includes(p.step as SetupStep) ? (p.step as SetupStep) : 'username',
          // Not persisted / always re-fetched:
          leagues: [],
          drafts: [],
          managerNames: {},
          lastUpdated: null,
          pollError: null,
        }
        // Don't restore into a step whose prerequisites are gone
        if (state.step === 'tracking' && (!state.selectedDraft || state.rankings.length === 0)) {
          state.step = 'username'
        }
        if (state.step === 'rankings' && !state.selectedDraft) {
          state.step = state.user ? 'league' : 'username'
        }
        if (state.step === 'draft') {
          // The drafts list isn't persisted, so this step is always empty on reload
          state.step = state.user ? 'league' : 'username'
        }
        if (state.step === 'league' && !state.user) {
          state.step = 'username'
        }
        return state
      },
    },
  ),
)
