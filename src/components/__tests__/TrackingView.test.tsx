import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TrackingView } from '@/components/draft/TrackingView'
import { useDraftStore } from '@/store/draftStore'
import { mkDraft, mkPick, mkRanked, mkUser } from '@/test/fixtures'

vi.mock('@/api/sleeper', () => ({
  sleeperApi: {
    getPicks: vi.fn().mockResolvedValue([]),
    getLeagueUsers: vi.fn().mockResolvedValue([]),
  },
}))

import { sleeperApi } from '@/api/sleeper'

describe('TrackingView (integration, hostile data)', () => {
  beforeEach(() => {
    useDraftStore.getState().reset()
    vi.mocked(sleeperApi.getPicks).mockResolvedValue([])
    vi.mocked(sleeperApi.getLeagueUsers).mockResolvedValue([])
  })

  it('renders the whole tracking surface with incomplete data and does not crash', async () => {
    useDraftStore.setState({
      user: mkUser(),
      selectedDraft: mkDraft(),
      rankings: [
        // matched + drafted with full data
        mkRanked({ rank: 1, name: 'Bijan Robinson', sleeperId: '1001', team: 'ATL', var: 45.4 }),
        // unmatched, no team, no position, no metrics at all
        mkRanked({ rank: 2, name: 'Mystery Man', position: '', team: '' }),
        // empty-string name edge (parser filters these, but persisted state might not)
        mkRanked({ rank: 3, name: 'Old Format Guy', var: null, ppg: null }),
      ],
      rawPicks: [
        // pick with NO metadata at all — must not crash any panel
        mkPick({ pick_no: 1, player_id: '1001', metadata: undefined, picked_by: '' }),
        // pick with partial metadata
        mkPick({
          pick_no: 2,
          player_id: '2002',
          picked_by: 'user_b',
          metadata: { first_name: 'Partial' },
        }),
      ],
      step: 'tracking',
    })

    render(<TrackingView />)

    // Player table renders every ranked player
    expect(screen.getAllByText('Bijan Robinson').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mystery Man').length).toBeGreaterThan(0)

    // Recent picks renders the metadata-less pick without crashing
    expect(screen.getByText('Recent Picks')).toBeInTheDocument()
    expect(screen.getByText('Partial')).toBeInTheDocument()

    // Rosters panel renders
    expect(screen.getByText('Rosters')).toBeInTheDocument()

    // On-the-clock banner: 2 picks made → pick 3 → slot 3 (user_c); my slot is 1,
    // next up at pick 8 → 5 picks away
    await waitFor(() => {
      expect(screen.getByText(/5 picks until your turn/)).toBeInTheDocument()
    })
  })

  it('shows the empty state instead of crashing when rankings are missing', () => {
    useDraftStore.setState({ selectedDraft: mkDraft(), rankings: [], step: 'tracking' })
    render(<TrackingView />)
    expect(screen.getByText(/No rankings loaded/)).toBeInTheDocument()
  })

  it('export button works without a crash even when clipboard/URL APIs are stubbed', () => {
    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))

    useDraftStore.setState({
      user: mkUser(),
      selectedDraft: mkDraft(),
      rankings: [mkRanked({ rank: 1, name: 'Bijan Robinson' })],
      step: 'tracking',
    })
    render(<TrackingView />)

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
    expect(createObjectURL).toHaveBeenCalledTimes(1)

    vi.unstubAllGlobals()
  })

  it('share button falls back to prompt when clipboard API is unavailable (http)', () => {
    const prompt = vi.spyOn(window, 'prompt').mockImplementation(() => null)
    useDraftStore.setState({
      user: mkUser(),
      selectedDraft: mkDraft(),
      rankings: [mkRanked({ rank: 1, name: 'Bijan Robinson' })],
      step: 'tracking',
    })
    render(<TrackingView />)

    // jsdom has no navigator.clipboard — exactly like a plain-http deployment
    fireEvent.click(screen.getByRole('button', { name: /Share/ }))
    expect(prompt).toHaveBeenCalledWith('Copy this link:', expect.stringContaining('?draft=draft123'))
    prompt.mockRestore()
  })

  it('keeps rendering when the league users fetch fails', async () => {
    vi.mocked(sleeperApi.getLeagueUsers).mockRejectedValue(new Error('boom'))
    useDraftStore.setState({
      user: mkUser(),
      selectedDraft: mkDraft(),
      rankings: [mkRanked({ rank: 1, name: 'Bijan Robinson' })],
      step: 'tracking',
    })
    render(<TrackingView />)
    await waitFor(() => {
      expect(screen.getAllByText('Bijan Robinson').length).toBeGreaterThan(0)
    })
  })
})
