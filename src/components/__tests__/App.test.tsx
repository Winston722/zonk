import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { useDraftStore } from '@/store/draftStore'
import { mkDraft, mkUser } from '@/test/fixtures'

vi.mock('@/api/sleeper', () => ({
  sleeperApi: {
    getDraft: vi.fn(),
    getPicks: vi.fn().mockResolvedValue([]),
    getLeagueUsers: vi.fn().mockResolvedValue([]),
  },
}))

import { sleeperApi } from '@/api/sleeper'

describe('App', () => {
  beforeEach(() => {
    useDraftStore.getState().reset()
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('renders the username step on a fresh visit', () => {
    render(<App />)
    expect(screen.getByText('Connect to Sleeper')).toBeInTheDocument()
  })

  it('renders the league step', () => {
    useDraftStore.setState({ step: 'league', user: mkUser(), leagues: [] })
    render(<App />)
    expect(screen.getByText('Select a League')).toBeInTheDocument()
    expect(screen.getByText(/No leagues found/)).toBeInTheDocument()
  })

  it('renders the rankings step', () => {
    useDraftStore.setState({ step: 'rankings', selectedDraft: mkDraft() })
    render(<App />)
    expect(screen.getByText('Load Your Rankings')).toBeInTheDocument()
  })

  it('loads a shared ?draft= link straight into the rankings step', async () => {
    vi.mocked(sleeperApi.getDraft).mockResolvedValue(mkDraft({ draft_id: '999' }))
    window.history.replaceState({}, '', '/?draft=999')

    render(<App />)
    await waitFor(() => {
      expect(useDraftStore.getState().selectedDraft?.draft_id).toBe('999')
    })
    expect(useDraftStore.getState().step).toBe('rankings')
    expect(screen.getByText('Load Your Rankings')).toBeInTheDocument()
  })

  it('stays on the normal flow when a shared draft link fails to load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(sleeperApi.getDraft).mockRejectedValue(new Error('not found'))
    window.history.replaceState({}, '', '/?draft=doesnotexist')

    render(<App />)
    // Never crashes; user can still proceed manually
    await waitFor(() => {
      expect(screen.getByText('Connect to Sleeper')).toBeInTheDocument()
    })
    expect(useDraftStore.getState().step).toBe('username')
    vi.restoreAllMocks()
  })
})
